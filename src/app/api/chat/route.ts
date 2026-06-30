import { NextRequest } from "next/server";
import {
  encodeRuntimeEvent,
  type RuntimeEvent,
} from "@/core/runtime/events";
import { getLLMProvider } from "@/providers/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }

    const timer = globalThis.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      globalThis.clearTimeout(timer);
      reject(new Error("aborted"));
    }

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: RuntimeEvent,
) {
  controller.enqueue(encoder.encode(encodeRuntimeEvent(event)));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    message?: unknown;
    conversationId?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

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
            enqueue(controller, {
              type: "text.delta",
              messageId: assistantId,
              text: chunk.text,
            });
          }
        }

        if (request.signal.aborted) return;

        enqueue(controller, {
          type: "text.done",
          messageId: assistantId,
        });
        enqueue(controller, {
          type: "tts.started",
          messageId: assistantId,
        });

        await wait(520, request.signal);

        enqueue(controller, {
          type: "tts.done",
          messageId: assistantId,
        });
        enqueue(controller, {
          type: "avatar.state",
          state: "speaking",
          reason: "tts_ready",
        });
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
