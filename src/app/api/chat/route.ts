import { NextRequest } from "next/server";
import {
  encodeRuntimeEvent,
  type RuntimeEvent,
} from "@/core/runtime/events";
import { getAvatarProvider } from "@/providers/avatar";
import { getLLMProvider } from "@/providers/llm";
import { getTTSProvider } from "@/providers/tts";
import type {
  LLMMessage,
  StreamingTTSProvider,
  TTSProvider,
} from "@/core/providers/types";
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

function isStreamingTTSProvider(
  provider: TTSProvider,
): provider is StreamingTTSProvider {
  return typeof (provider as Partial<StreamingTTSProvider>).stream === "function";
}

function estimateSpeechDurationMs(text: string) {
  return Math.min(60_000, Math.max(650, text.length * 95));
}

function toAudioDataUrl(input: { audio: Uint8Array; mimeType: string }) {
  return `data:${input.mimeType};base64,${Buffer.from(input.audio).toString("base64")}`;
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
  characterId?: string;
  conversationId?: string;
  knowledgeBaseId?: string;
  message: string;
  modelProviderId?: string;
  sceneId?: string;
  userMessageId?: string;
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
      const userMessageId =
        input.userMessageId ??
        (
          await appendMessage({
            content: input.message,
            conversationId: input.conversationId,
            role: "user",
            status: "completed",
          })
        ).id;
      const assistantMessage = await appendMessage({
        content: "",
        conversationId: input.conversationId,
        parentMessageId: userMessageId,
        role: "assistant",
        status: "streaming",
      });

      return {
        assistantMessageId: assistantMessage.id,
        conversationId: input.conversationId,
        persisted: true,
        userMessageId,
      };
    }

    const conversation = await createConversationWithUserMessage({
      characterId: input.characterId,
      knowledgeBaseId: input.knowledgeBaseId,
      message: input.message,
      modelProviderId: input.modelProviderId,
      sceneId: input.sceneId,
    });
    const userMessage = conversation.messages[0];
    const assistantMessage = await appendMessage({
      content: "",
      conversationId: conversation.id,
      parentMessageId: userMessage?.id,
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
    characterId?: unknown;
    knowledgeBaseId?: unknown;
    modelProviderId?: unknown;
    sceneId?: unknown;
    userMessageId?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const enableTTS = body?.enableTTS !== false;
  const requestedConversationId =
    typeof body?.conversationId === "string" ? body.conversationId : undefined;
  const characterId =
    typeof body?.characterId === "string" ? body.characterId : undefined;
  const knowledgeBaseId =
    typeof body?.knowledgeBaseId === "string" ? body.knowledgeBaseId : undefined;
  const modelProviderId =
    typeof body?.modelProviderId === "string" ? body.modelProviderId : undefined;
  const sceneId = typeof body?.sceneId === "string" ? body.sceneId : undefined;
  const userMessageId =
    typeof body?.userMessageId === "string" ? body.userMessageId : undefined;

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
        characterId,
        conversationId: requestedConversationId,
        knowledgeBaseId,
        message,
        modelProviderId,
        sceneId,
        userMessageId,
      });
      const assistantId = turn.assistantMessageId;

      try {
        const llmProvider = getLLMProvider();
        const ttsProvider = await getTTSProvider();
        const avatarProvider = getAvatarProvider();
        let assistantText = "";
        let audioUrl: string | undefined;
        let usage: TokenUsageMetadata | undefined;
        const systemPrompt = await getRuntimeSystemPrompt();
        const markTurnInterrupted = async () => {
          if (turn.persisted) {
            await updateMessageStatus(assistantId, "interrupted").catch(
              () => undefined,
            );
          }
          await avatarProvider
            .setState({
              state: "interrupted",
              reason: "request_aborted",
            })
            .catch(() => undefined);
        };

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
            await markTurnInterrupted();
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
          await markTurnInterrupted();
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
            if (isStreamingTTSProvider(ttsProvider)) {
              const audioChunks: Buffer[] = [];
              let chunkCount = 0;
              let mimeType = "audio/mpeg";
              let speakingStarted = false;

              for await (const chunk of ttsProvider.stream({
                text: assistantText,
                signal: request.signal,
              })) {
                if (request.signal.aborted) {
                  await markTurnInterrupted();
                  return;
                }

                const audio = Buffer.from(chunk.audio);
                if (audio.length === 0) continue;

                chunkCount = chunk.sequence;
                mimeType = chunk.mimeType;
                audioChunks.push(audio);

                if (!speakingStarted) {
                  speakingStarted = true;
                  await avatarProvider.setState({
                    state: "speaking",
                    reason: "tts_chunk_ready",
                  });
                  enqueue(controller, {
                    type: "avatar.state",
                    state: "speaking",
                    reason: "tts_chunk_ready",
                  });
                }

                enqueue(controller, {
                  type: "tts.chunk",
                  messageId: assistantId,
                  audioUrl: toAudioDataUrl({ audio, mimeType }),
                  durationMs: chunk.durationMs,
                  marks: chunk.marks,
                  mimeType,
                  sequence: chunk.sequence,
                });
              }

              if (audioChunks.length === 0) {
                throw new Error("TTS provider returned empty audio");
              }

              const durationMs = estimateSpeechDurationMs(assistantText);
              audioUrl = toAudioDataUrl({
                audio: Buffer.concat(audioChunks),
                mimeType,
              });

              enqueue(controller, {
                type: "tts.done",
                messageId: assistantId,
                audioUrl,
                chunkCount,
                chunked: true,
                durationMs,
                mimeType,
              });
            } else {
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
                marks: ttsResult.marks,
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
            }
          } catch (error) {
            if (request.signal.aborted) {
              await markTurnInterrupted();
              return;
            }

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

        if (request.signal.aborted) {
          await markTurnInterrupted();
          return;
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
