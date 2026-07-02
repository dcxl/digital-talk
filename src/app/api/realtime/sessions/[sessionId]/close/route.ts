import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { appendRealtimeSessionEvent } from "@/services/realtime/event-buffer";
import {
  presentRealtimeSession,
  presentRealtimeSessionEvent,
} from "@/services/realtime/presenter";
import {
  getRealtimeSessionStore,
  getRealtimeSessionTtlSeconds,
  touchRealtimeSession,
} from "@/services/realtime/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    const store = getRealtimeSessionStore();
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

    const closed = touchRealtimeSession({
      ...session,
      endedAt: new Date().toISOString(),
      status: "closed",
    });

    const ttlSeconds = getRealtimeSessionTtlSeconds();
    await store.set(closed, ttlSeconds);

    const event =
      session.status === "closed"
        ? null
        : await appendRealtimeSessionEvent(store, {
            payload: {
              endedAt: closed.endedAt,
              status: closed.status,
            },
            sessionId,
            ttlSeconds,
            type: "session.closed",
          });

    return jsonData({
      event: event ? presentRealtimeSessionEvent(event) : null,
      session: presentRealtimeSession(closed),
    });
  } catch (error) {
    return redisUnavailable(error);
  }
}
