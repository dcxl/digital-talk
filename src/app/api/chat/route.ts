import { NextRequest } from "next/server";
import {
  encodeRuntimeEvent,
  type RuntimeEvent,
} from "@/core/runtime/events";
import { getAvatarProvider } from "@/providers/avatar";
import { getLLMProvider } from "@/providers/llm";
import { getTTSProvider } from "@/providers/tts";
import type { LLMMessage } from "@/core/providers/types";
import {
  appendMessage,
  createConversationWithUserMessage,
  updateMessage,
  updateMessageStatus,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { searchDocumentChunks } from "@/services/knowledge/repository";
import {
  toRAGContextMessage,
  toRAGSourcePreview,
  type RAGSource,
} from "@/services/knowledge/rag";
import { getRuntimeSystemPrompt } from "@/services/prompts/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

interface PersistedTurn {
  assistantMessageId: string;
  conversationId?: string;
  persisted: boolean;
  userMessageId: string;
}

interface TokenUsageMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface RAGBuildResult {
  messages: LLMMessage[];
  sources: ReturnType<typeof toRAGSourcePreview>;
}

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: RuntimeEvent,
) {
  controller.enqueue(encoder.encode(encodeRuntimeEvent(event)));
}

async function buildLLMMessages(input: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  knowledgeBaseId?: string;
  message: string;
  systemPrompt?: string;
}): Promise<RAGBuildResult> {
  const systemMessages: LLMMessage[] = input.systemPrompt
    ? [
        {
          role: "system",
          content: input.systemPrompt,
        },
      ]
    : [];

  if (!input.knowledgeBaseId || !isDatabaseConfigured()) {
    return {
      messages: [
        ...systemMessages,
        {
          role: "user",
          content: input.message,
        },
      ],
      sources: [],
    };
  }

  enqueue(input.controller, {
    type: "rag.retrieve.started",
    knowledgeBaseId: input.knowledgeBaseId,
    query: input.message,
  });

  try {
    const chunks = await searchDocumentChunks({
      knowledgeBaseId: input.knowledgeBaseId,
      limit: 4,
      query: input.message,
    });
    const sources: RAGSource[] = chunks.map((chunk) => ({
      chunkId: chunk.id,
      content: chunk.content,
      documentId: chunk.documentId,
      documentName: chunk.document.name,
    }));
    const contextMessage = toRAGContextMessage(sources);

    if (!contextMessage) {
      enqueue(input.controller, {
        type: "rag.retrieve.empty",
        knowledgeBaseId: input.knowledgeBaseId,
        query: input.message,
      });
      return {
        messages: [
          ...systemMessages,
          {
            role: "user",
            content: input.message,
          },
        ],
        sources: [],
      };
    }

    const sourcePreview = toRAGSourcePreview(sources);
    enqueue(input.controller, {
      type: "rag.retrieve.completed",
      chunks: sourcePreview,
      knowledgeBaseId: input.knowledgeBaseId,
    });

    return {
      messages: [
        ...systemMessages,
        {
          role: "system",
          content: contextMessage,
        },
        {
          role: "user",
          content: input.message,
        },
      ],
      sources: sourcePreview,
    };
  } catch (error) {
    enqueue(input.controller, {
      type: "rag.retrieve.failed",
      knowledgeBaseId: input.knowledgeBaseId,
      message: error instanceof Error ? error.message : "RAG retrieve failed",
      retryable: true,
    });
    return {
      messages: [
        ...systemMessages,
        {
          role: "user",
          content: input.message,
        },
      ],
      sources: [],
    };
  }
}

function buildAssistantMetadata(input: {
  knowledgeBaseId?: string;
  ragSources: ReturnType<typeof toRAGSourcePreview>;
  usage?: TokenUsageMetadata;
}) {
  const metadata: {
    inputTokens?: number;
    outputTokens?: number;
    rag?: {
      knowledgeBaseId: string;
      sources: ReturnType<typeof toRAGSourcePreview>;
    };
    totalTokens?: number;
  } = {};

  if (input.usage) {
    metadata.inputTokens = input.usage.inputTokens;
    metadata.outputTokens = input.usage.outputTokens;
    metadata.totalTokens = input.usage.totalTokens;
  }

  if (input.knowledgeBaseId && input.ragSources.length > 0) {
    metadata.rag = {
      knowledgeBaseId: input.knowledgeBaseId,
      sources: input.ragSources,
    };
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

async function createPersistenceTurn(input: {
  conversationId?: string;
  message: string;
  modelProviderId?: string;
  knowledgeBaseId?: string;
}): Promise<PersistedTurn> {
  if (!isDatabaseConfigured()) {
    return {
      assistantMessageId: crypto.randomUUID(),
      conversationId: input.conversationId,
      persisted: false,
      userMessageId: crypto.randomUUID(),
    };
  }

  try {
    if (input.conversationId) {
      const userMessage = await appendMessage({
        content: input.message,
        conversationId: input.conversationId,
        role: "user",
        status: "completed",
      });
      const assistantMessage = await appendMessage({
        content: "",
        conversationId: input.conversationId,
        role: "assistant",
        status: "streaming",
      });

      return {
        assistantMessageId: assistantMessage.id,
        conversationId: input.conversationId,
        persisted: true,
        userMessageId: userMessage.id,
      };
    }

    const conversation = await createConversationWithUserMessage({
      knowledgeBaseId: input.knowledgeBaseId,
      message: input.message,
      modelProviderId: input.modelProviderId,
    });
    const userMessage = conversation.messages[0];
    const assistantMessage = await appendMessage({
      content: "",
      conversationId: conversation.id,
      role: "assistant",
      status: "streaming",
    });

    return {
      assistantMessageId: assistantMessage.id,
      conversationId: conversation.id,
      persisted: true,
      userMessageId: userMessage?.id ?? crypto.randomUUID(),
    };
  } catch {
    return {
      assistantMessageId: crypto.randomUUID(),
      conversationId: input.conversationId,
      persisted: false,
      userMessageId: crypto.randomUUID(),
    };
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    enableTTS?: unknown;
    message?: unknown;
    conversationId?: unknown;
    knowledgeBaseId?: unknown;
    modelProviderId?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const enableTTS = body?.enableTTS !== false;
  const requestedConversationId =
    typeof body?.conversationId === "string" ? body.conversationId : undefined;
  const knowledgeBaseId =
    typeof body?.knowledgeBaseId === "string" ? body.knowledgeBaseId : undefined;
  const modelProviderId =
    typeof body?.modelProviderId === "string" ? body.modelProviderId : undefined;

  if (!message) {
    return Response.json(
      {
        error: {
          code: "invalid_message",
          message: "message is required",
        },
      },
      { status: 400 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const turn = await createPersistenceTurn({
        conversationId: requestedConversationId,
        knowledgeBaseId,
        message,
        modelProviderId,
      });
      const assistantId = turn.assistantMessageId;

      try {
        const llmProvider = getLLMProvider();
        const ttsProvider = getTTSProvider();
        const avatarProvider = getAvatarProvider();
        let assistantText = "";
        let audioUrl: string | undefined;
        let usage: TokenUsageMetadata | undefined;
        const systemPrompt = await getRuntimeSystemPrompt();

        enqueue(controller, {
          type: "message.created",
          conversationId: turn.conversationId,
          message: {
            id: turn.userMessageId,
            role: "user",
            content: message,
            status: "completed",
          },
        });

        enqueue(controller, {
          type: "assistant.created",
          conversationId: turn.conversationId,
          message: {
            id: assistantId,
            role: "assistant",
            content: "",
            status: "streaming",
          },
        });
        enqueue(controller, {
          type: "avatar.state",
          state: "thinking",
          reason: "request_received",
        });
        await avatarProvider.setState({
          state: "thinking",
          reason: "request_received",
        });
        const rag = await buildLLMMessages({
          controller,
          knowledgeBaseId,
          message,
          systemPrompt,
        });

        for await (const chunk of llmProvider.chat({
          conversationId: turn.conversationId,
          messages: rag.messages,
          signal: request.signal,
        })) {
          if (request.signal.aborted) {
            if (turn.persisted) {
              await updateMessageStatus(assistantId, "interrupted");
            }
            return;
          }

          if (chunk.type === "text.delta") {
            assistantText += chunk.text;
            enqueue(controller, {
              type: "text.delta",
              messageId: assistantId,
              text: chunk.text,
            });
          }

          if (chunk.type === "usage") {
            usage = {
              inputTokens: chunk.usage.promptTokens,
              outputTokens: chunk.usage.completionTokens,
              totalTokens: chunk.usage.totalTokens,
            };
            enqueue(controller, {
              type: "usage",
              ...usage,
            });
          }
        }

        if (request.signal.aborted) {
          if (turn.persisted) {
            await updateMessageStatus(assistantId, "interrupted");
          }
          return;
        }

        enqueue(controller, {
          type: "text.done",
          messageId: assistantId,
        });

        if (enableTTS) {
          enqueue(controller, {
            type: "tts.started",
            messageId: assistantId,
          });

          try {
            const ttsResult = await ttsProvider.synthesize({
              text: assistantText,
              signal: request.signal,
            });
            audioUrl = ttsResult.audioUrl;

            enqueue(controller, {
              type: "tts.done",
              messageId: assistantId,
              audioUrl,
              durationMs: ttsResult.durationMs,
              mimeType: ttsResult.mimeType,
            });
            await avatarProvider.setState({
              state: "speaking",
              reason: "tts_ready",
            });
            enqueue(controller, {
              type: "avatar.state",
              state: "speaking",
              reason: "tts_ready",
            });
          } catch (error) {
            if (!request.signal.aborted) {
              enqueue(controller, {
                type: "tts.failed",
                messageId: assistantId,
                message:
                  error instanceof Error ? error.message : "TTS request failed",
                retryable: true,
              });
              await avatarProvider.setState({
                state: "idle",
                reason: "tts_failed",
              });
            }
          }
        }

        if (turn.persisted) {
          await updateMessage({
            audioUrl,
            content: assistantText,
            messageId: assistantId,
            metadata: buildAssistantMetadata({
              knowledgeBaseId,
              ragSources: rag.sources,
              usage,
            }),
            status: "completed",
          });
        }

        enqueue(controller, {
          type: "done",
          conversationId: turn.conversationId,
          messageId: assistantId,
        });
      } catch (error) {
        if (turn.persisted) {
          await updateMessage({
            content: "",
            messageId: assistantId,
            status: "failed",
          }).catch(() => undefined);
        }

        if (!request.signal.aborted) {
          enqueue(controller, {
            type: "error",
            code: "provider_error",
            message:
              error instanceof Error ? error.message : "Provider request failed",
            retryable: true,
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
