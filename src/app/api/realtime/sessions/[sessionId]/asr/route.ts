import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { getStreamingASRProvider } from "@/providers/asr";
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
  return {
    createdAt: new Date().toISOString(),
    id: randomUUID(),
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
  };
}

function updateSessionStatus(session: RealtimeSession, status: RealtimeSession["status"]) {
  return touchRealtimeSession({
    ...session,
    status,
  });
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
    let sequence = 0;

    try {
      for await (const chunk of getStreamingASRProvider().stream({
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

    const completedSession = touchRealtimeSession({
      ...transcribingSession,
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
      events: events.map(presentRealtimeSessionEvent),
      session: presentRealtimeSession(completedSession),
      transcript: finalTranscript,
    });
  } catch (error) {
    return redisUnavailable(error);
  }
}
