import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { presentRealtimeSession } from "@/services/realtime/presenter";
import {
  getRealtimeSessionStore,
  getRealtimeSessionTtlSeconds,
  touchRealtimeSession,
} from "@/services/realtime/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

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
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    reason?: unknown;
  } | null;

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

    if (session.status === "closed") {
      return jsonError(
        {
          code: "invalid_state",
          message: "Closed realtime sessions cannot be interrupted",
          retryable: false,
        },
        { status: 409 },
      );
    }

    const interrupted = touchRealtimeSession({
      ...session,
      interruptReason: getString(body?.reason) ?? "user_barge_in",
      status: "interrupted",
    });

    await store.set(interrupted, getRealtimeSessionTtlSeconds());

    return jsonData({
      session: presentRealtimeSession(interrupted),
    });
  } catch (error) {
    return redisUnavailable(error);
  }
}
