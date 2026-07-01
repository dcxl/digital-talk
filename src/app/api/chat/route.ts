import { NextRequest } from "next/server";
import {
  encodeRuntimeEvent,
  type RuntimeEvent,
} from "@/core/runtime/events";
import { getAvatarProvider } from "@/providers/avatar";
import { getLLMProvider } from "@/providers/llm";
import { getTTSProvider } from "@/providers/tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: RuntimeEvent,
) {
  controller.enqueue(encoder.encode(encodeRuntimeEvent(event)));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    enableTTS?: unknown;
    message?: unknown;
    conversationId?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const enableTTS = body?.enableTTS !== false;

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
      const assistantId = crypto.randomUUID();

      try {
        const llmProvider = getLLMProvider();
        const ttsProvider = getTTSProvider();
        const avatarProvider = getAvatarProvider();
        let assistantText = "";

        enqueue(controller, {
          type: "assistant.created",
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

        for await (const chunk of llmProvider.chat({
          conversationId:
            typeof body?.conversationId === "string"
              ? body.conversationId
              : undefined,
          messages: [{ role: "user", content: message }],
          signal: request.signal,
        })) {
          if (request.signal.aborted) return;

          if (chunk.type === "text.delta") {
            assistantText += chunk.text;
            enqueue(controller, {
              type: "text.delta",
              messageId: assistantId,
              text: chunk.text,
            });
          }

          if (chunk.type === "usage") {
            enqueue(controller, {
              type: "usage",
              inputTokens: chunk.usage.promptTokens,
              outputTokens: chunk.usage.completionTokens,
              totalTokens: chunk.usage.totalTokens,
            });
          }
        }

        if (request.signal.aborted) return;

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

            enqueue(controller, {
              type: "tts.done",
              messageId: assistantId,
              audioUrl: ttsResult.audioUrl,
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

        enqueue(controller, {
          type: "done",
          messageId: assistantId,
        });
      } catch (error) {
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
