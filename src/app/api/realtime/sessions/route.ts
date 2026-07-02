import { jsonData, jsonError } from "@/core/http/responses";
import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { presentRealtimeSession } from "@/services/realtime/presenter";
import {
  createRealtimeSessionRecord,
  getRealtimeSessionStore,
} from "@/services/realtime/session-store";
import type { RealtimeTransport } from "@/services/realtime/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getTransport(value: unknown): RealtimeTransport | undefined {
  return value === "websocket" || value === "sse" ? value : undefined;
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    avatarProfileId?: unknown;
    conversationId?: unknown;
    knowledgeBaseId?: unknown;
    metadata?: unknown;
    modelProviderId?: unknown;
    transport?: unknown;
    voiceProviderId?: unknown;
  } | null;
  const { session, ttlSeconds } = createRealtimeSessionRecord({
    avatarProfileId: getString(body?.avatarProfileId),
    conversationId: getString(body?.conversationId),
    knowledgeBaseId: getString(body?.knowledgeBaseId),
    metadata:
      body?.metadata && typeof body.metadata === "object"
        ? (body.metadata as Record<string, unknown>)
        : undefined,
    modelProviderId: getString(body?.modelProviderId),
    transport: getTransport(body?.transport),
    userId: DEFAULT_USER_ID,
    voiceProviderId: getString(body?.voiceProviderId),
  });

  try {
    const store = getRealtimeSessionStore();
    await store.set(session, ttlSeconds);

    return jsonData(
      {
        session: presentRealtimeSession(session),
      },
      { status: 201 },
    );
  } catch (error) {
    return redisUnavailable(error);
  }
}
