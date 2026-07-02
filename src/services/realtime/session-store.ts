import { randomUUID } from "node:crypto";
import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { redisCommand } from "./redis-client";
import type {
  CreateRealtimeSessionInput,
  RealtimeSession,
  RealtimeSessionStore,
  RealtimeTransport,
} from "./types";

const sessionKeyPrefix = "rt:session:";
const defaultSessionTtlSeconds = 900;

function getSessionTtlSeconds() {
  const value = Number(process.env.REALTIME_SESSION_TTL_SECONDS ?? "");
  return Number.isFinite(value) && value > 0 ? value : defaultSessionTtlSeconds;
}

function getSessionKey(sessionId: string) {
  return `${sessionKeyPrefix}${sessionId}`;
}

function normalizeTransport(value?: RealtimeTransport) {
  return value === "websocket" ? "websocket" : "sse";
}

export function createRealtimeSessionRecord(
  input: Partial<CreateRealtimeSessionInput> = {},
) {
  const now = new Date();
  const ttlSeconds = getSessionTtlSeconds();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  return {
    session: {
      activeAudioId: null,
      activeMessageId: null,
      avatarProfileId: input.avatarProfileId ?? null,
      conversationId: input.conversationId ?? null,
      createdAt: now.toISOString(),
      endedAt: null,
      expiresAt: expiresAt.toISOString(),
      id: randomUUID(),
      interruptReason: null,
      knowledgeBaseId: input.knowledgeBaseId ?? null,
      metadata: input.metadata,
      modelProviderId: input.modelProviderId ?? null,
      status: "idle",
      transport: normalizeTransport(input.transport),
      updatedAt: now.toISOString(),
      userId: input.userId ?? DEFAULT_USER_ID,
      voiceProviderId: input.voiceProviderId ?? null,
    } satisfies RealtimeSession,
    ttlSeconds,
  };
}

export class RedisRealtimeSessionStore implements RealtimeSessionStore {
  async delete(sessionId: string) {
    await redisCommand("DEL", getSessionKey(sessionId));
  }

  async get(sessionId: string) {
    const value = await redisCommand("GET", getSessionKey(sessionId));
    if (!value || typeof value !== "string") return null;

    return JSON.parse(value) as RealtimeSession;
  }

  async ping() {
    await redisCommand("PING");
  }

  async set(session: RealtimeSession, ttlSeconds: number) {
    await redisCommand(
      "SET",
      getSessionKey(session.id),
      JSON.stringify(session),
      "EX",
      String(ttlSeconds),
    );
  }
}

export function getRealtimeSessionStore(): RealtimeSessionStore {
  return new RedisRealtimeSessionStore();
}

export function getRealtimeSessionTtlSeconds() {
  return getSessionTtlSeconds();
}

export function touchRealtimeSession(session: RealtimeSession) {
  return {
    ...session,
    updatedAt: new Date().toISOString(),
  };
}
