import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { presentRealtimeSession } from "@/services/realtime/presenter";
import { getRealtimeSessionStore } from "@/services/realtime/session-store";

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    const session = await getRealtimeSessionStore().get(sessionId);
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

    return jsonData({
      session: presentRealtimeSession(session),
    });
  } catch (error) {
    return redisUnavailable(error);
  }
}
