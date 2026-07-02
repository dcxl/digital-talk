import { NextRequest } from "next/server";
import { jsonError } from "@/core/http/responses";
import {
  presentRealtimeSession,
  presentRealtimeSessionEvent,
} from "@/services/realtime/presenter";
import { getRealtimeSessionStore } from "@/services/realtime/session-store";
import type {
  RealtimeSession,
  RealtimeSessionEvent,
  RealtimeSessionStore,
} from "@/services/realtime/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pollIntervalMs = 1000;
const heartbeatIntervalMs = 15000;

function redisUnavailable(error: unknown) {
  return jsonError(
    {
      code: "redis_unavailable",
      message:
        error instanceof Error ? error.message : "Realtime Redis store unavailable",
      retryable: true,
    },
    { status: 503 },
  );
}

function encodeSse(input: { data?: unknown; event?: string; id?: string }) {
  const lines: string[] = [];

  if (input.id) lines.push(`id: ${input.id}`);
  if (input.event) lines.push(`event: ${input.event}`);
  if (input.data !== undefined) {
    lines.push(`data: ${JSON.stringify(input.data)}`);
  }

  return `${lines.join("\n")}\n\n`;
}

function wait(ms: number, signal: AbortSignal) {
  if (signal.aborted) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const onAbort = () => {
      globalThis.clearTimeout(timeout);
      resolve();
    };
    const timeout = globalThis.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function seedSentEventIds(
  events: RealtimeSessionEvent[],
  lastEventId: string | null,
) {
  const sentIds = new Set<string>();
  if (!lastEventId) return sentIds;

  let found = false;
  for (const event of events) {
    sentIds.add(event.id);
    if (event.id === lastEventId) {
      found = true;
      break;
    }
  }

  return found ? sentIds : new Set<string>();
}

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  input: { data?: unknown; event?: string; id?: string },
) {
  controller.enqueue(encoder.encode(encodeSse(input)));
}

async function streamEvents(input: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
  initialSession: RealtimeSession;
  lastEventId: string | null;
  requestSignal: AbortSignal;
  store: RealtimeSessionStore;
}) {
  const {
    controller,
    encoder,
    initialSession,
    lastEventId,
    requestSignal,
    store,
  } = input;
  let closed = false;
  let lastHeartbeatAt = Date.now();
  let sentIds = new Set<string>();
  let sentClosedEvent = false;

  const close = () => {
    if (closed) return;
    closed = true;
    controller.close();
  };

  try {
    const initialEvents = await store.listEvents(initialSession.id);
    sentIds = seedSentEventIds(initialEvents, lastEventId);

    enqueue(controller, encoder, {
      data: presentRealtimeSession(initialSession),
      event: "session.snapshot",
    });

    while (!requestSignal.aborted && !closed) {
      const [session, events] = await Promise.all([
        store.get(initialSession.id),
        store.listEvents(initialSession.id),
      ]);

      if (!session) {
        enqueue(controller, encoder, {
          data: { sessionId: initialSession.id },
          event: "session.missing",
        });
        close();
        return;
      }

      for (const event of events) {
        if (sentIds.has(event.id)) continue;
        sentIds.add(event.id);
        if (event.type === "session.closed") sentClosedEvent = true;
        enqueue(controller, encoder, {
          data: presentRealtimeSessionEvent(event),
          event: event.type,
          id: event.id,
        });
      }

      if (session.status === "closed") {
        if (!sentClosedEvent) {
          enqueue(controller, encoder, {
            data: presentRealtimeSession(session),
            event: "session.closed",
          });
        }
        close();
        return;
      }

      if (Date.now() - lastHeartbeatAt >= heartbeatIntervalMs) {
        lastHeartbeatAt = Date.now();
        enqueue(controller, encoder, {
          data: {
            at: new Date().toISOString(),
            sessionId: session.id,
            status: session.status,
          },
          event: "heartbeat",
        });
      }

      await wait(pollIntervalMs, requestSignal);
    }

    close();
  } catch (error) {
    if (!closed) {
      enqueue(controller, encoder, {
        data: {
          message:
            error instanceof Error
              ? error.message
              : "Realtime event stream failed",
        },
        event: "error",
      });
      close();
    }
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const store = getRealtimeSessionStore();

  try {
    const session = await store.get(sessionId);
    if (!session) {
      return jsonError(
        {
          code: "not_found",
          message: "Realtime session not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        void streamEvents({
          controller,
          encoder,
          initialSession: session,
          lastEventId: request.headers.get("last-event-id"),
          requestSignal: request.signal,
          store,
        });
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
  } catch (error) {
    return redisUnavailable(error);
  }
}
