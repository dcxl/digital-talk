import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import type { Prisma } from "@/generated/prisma/client";
import { getStreamingASRProvider } from "@/providers/asr";
import {
  appendMessage,
  createConversationWithUserMessage,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  createRealtimeSessionEvent,
  getNextRealtimeEventSequence,
} from "@/services/realtime/event-buffer";
import {
  presentRealtimeSession,
  presentRealtimeSessionEvent,
} from "@/services/realtime/presenter";
import {
  getRealtimeSessionStore,
  getRealtimeSessionTtlSeconds,
  touchRealtimeSession,
} from "@/services/realtime/session-store";
import type {
  RealtimeSession,
  RealtimeSessionEvent,
} from "@/services/realtime/types";

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

async function* singleAudioChunk(audio: Blob) {
  yield {
    audio,
    mimeType: audio.type || undefined,
    sequence: 1,
    timestampMs: Date.now(),
  };
}

function createAsrEvent(
  sessionId: string,
  sequence: number,
  chunk:
    | {
        endMs?: number;
        startMs?: number;
        text: string;
        type: "partial";
      }
    | {
        durationMs?: number;
        language?: string;
        segments: unknown[];
        text: string;
        type: "final";
      },
): RealtimeSessionEvent {
  return createRealtimeSessionEvent({
    payload:
      chunk.type === "partial"
        ? {
            endMs: chunk.endMs,
            startMs: chunk.startMs,
            text: chunk.text,
          }
        : {
            durationMs: chunk.durationMs,
            language: chunk.language,
            segments: chunk.segments,
            text: chunk.text,
          },
    sequence,
    sessionId,
    type: chunk.type === "partial" ? "asr.partial" : "asr.final",
  });
}

function updateSessionStatus(session: RealtimeSession, status: RealtimeSession["status"]) {
  return touchRealtimeSession({
    ...session,
    status,
  });
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getTranscriptSegments(value: unknown): Prisma.InputJsonArray {
  if (!Array.isArray(value)) return [];

  const segments: Prisma.InputJsonObject[] = [];

  for (const segment of value) {
    if (!segment || typeof segment !== "object") continue;

    const record = segment as Record<string, unknown>;
    const text = getString(record.text);
    if (!text) continue;

    segments.push({
      endMs: getNumber(record.endMs) ?? null,
      startMs: getNumber(record.startMs) ?? null,
      text,
    });
  }

  return segments;
}

function buildTranscriptMetadata(input: {
  finalTranscript: Record<string, unknown>;
  sessionId: string;
}): Prisma.InputJsonObject {
  const durationMs = getNumber(input.finalTranscript.durationMs);
  const language = getString(input.finalTranscript.language);
  const segments = getTranscriptSegments(input.finalTranscript.segments);

  return {
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(language ? { language } : {}),
    realtimeSessionId: input.sessionId,
    ...(segments.length > 0 ? { segments } : {}),
    source: "realtime_asr",
  };
}

async function persistFinalTranscript(input: {
  finalTranscript: Record<string, unknown> | null;
  session: RealtimeSession;
}) {
  const text =
    typeof input.finalTranscript?.text === "string"
      ? input.finalTranscript.text.trim()
      : "";

  if (!text || !isDatabaseConfigured()) return null;

  const metadata = buildTranscriptMetadata({
    finalTranscript: input.finalTranscript ?? {},
    sessionId: input.session.id,
  });

  if (input.session.conversationId) {
    const message = await appendMessage({
      content: text,
      conversationId: input.session.conversationId,
      metadata,
      role: "user",
      status: "completed",
    });

    return {
      conversationId: input.session.conversationId,
      message: {
        content: message.content,
        id: message.id,
        role: message.role,
        status: message.status,
      },
    };
  }

  const conversation = await createConversationWithUserMessage({
    knowledgeBaseId: input.session.knowledgeBaseId ?? undefined,
    message: text,
    messageMetadata: metadata,
    modelProviderId: input.session.modelProviderId ?? undefined,
  });
  const message = conversation.messages[0];

  if (!message) return null;

  return {
    conversationId: conversation.id,
    message: {
      content: message.content,
      id: message.id,
      role: message.role,
      status: message.status,
    },
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const formData = await request.formData().catch(() => null);
  const audio = formData?.get("audio");
  const language = formData?.get("language");

  if (!(audio instanceof Blob)) {
    return jsonError(
      {
        code: "bad_request",
        message: "audio file is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const store = getRealtimeSessionStore();
  const ttlSeconds = getRealtimeSessionTtlSeconds();

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

    if (session.status === "closed") {
      return jsonError(
        {
          code: "invalid_state",
          message: "Closed realtime sessions cannot transcribe audio",
          retryable: false,
        },
        { status: 409 },
      );
    }

    const transcribingSession = updateSessionStatus(session, "transcribing");
    await store.set(transcribingSession, ttlSeconds);

    const events: RealtimeSessionEvent[] = [];
    let finalTranscript: RealtimeSessionEvent["payload"] | null = null;
    let persistedTranscript: Awaited<
      ReturnType<typeof persistFinalTranscript>
    > = null;
    let persistenceError: string | undefined;
    const existingEvents = await store.listEvents(sessionId);
    let sequence = getNextRealtimeEventSequence(existingEvents) - 1;

    try {
      const provider = await getStreamingASRProvider();

      for await (const chunk of provider.stream({
        chunks: singleAudioChunk(audio),
        language: typeof language === "string" ? language : undefined,
        signal: AbortSignal.timeout(15000),
      })) {
        sequence += 1;
        const event = createAsrEvent(sessionId, sequence, chunk);
        await store.appendEvent(sessionId, event, ttlSeconds);
        events.push(event);

        if (event.type === "asr.final") {
          finalTranscript = event.payload ?? null;
        }
      }
    } catch (error) {
      await store.set(updateSessionStatus(transcribingSession, "idle"), ttlSeconds);

      return jsonError(
        {
          code: "provider_error",
          message: error instanceof Error ? error.message : "ASR provider failed",
          retryable: true,
        },
        { status: 502 },
      );
    }

    try {
      persistedTranscript = await persistFinalTranscript({
        finalTranscript,
        session: transcribingSession,
      });
    } catch (error) {
      persistenceError =
        error instanceof Error ? error.message : "Transcript persistence failed";
    }

    const completedSession = touchRealtimeSession({
      ...transcribingSession,
      conversationId:
        persistedTranscript?.conversationId ?? transcribingSession.conversationId,
      metadata: {
        ...(transcribingSession.metadata ?? {}),
        lastTranscript:
          typeof finalTranscript?.text === "string"
            ? finalTranscript.text
            : undefined,
        lastTranscriptAt: new Date().toISOString(),
      },
      status: "idle",
    });
    await store.set(completedSession, ttlSeconds);

    return jsonData({
      conversationId:
        persistedTranscript?.conversationId ?? completedSession.conversationId,
      events: events.map(presentRealtimeSessionEvent),
      message: persistedTranscript?.message ?? null,
      persistenceError,
      session: presentRealtimeSession(completedSession),
      transcript: finalTranscript,
    });
  } catch (error) {
    return redisUnavailable(error);
  }
}
