import { randomUUID } from "node:crypto";
import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { redisCommand } from "./redis-client";
import type {
  CreateRealtimeSessionInput,
  RealtimeSession,
  RealtimeSessionEvent,
  RealtimeSessionStore,
  RealtimeTransport,
} from "./types";

const sessionKeyPrefix = "rt:session:";
const eventKeyPrefix = "rt:events:";
const defaultSessionTtlSeconds = 900;

function getSessionTtlSeconds() {
  const value = Number(process.env.REALTIME_SESSION_TTL_SECONDS ?? "");
  return Number.isFinite(value) && value > 0 ? value : defaultSessionTtlSeconds;
}

function getSessionKey(sessionId: string) {
  return `${sessionKeyPrefix}${sessionId}`;
}

function getEventKey(sessionId: string) {
  return `${eventKeyPrefix}${sessionId}`;
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
  async appendEvent(
    sessionId: string,
    event: RealtimeSessionEvent,
    ttlSeconds: number,
  ) {
    const key = getEventKey(sessionId);
    await redisCommand("RPUSH", key, JSON.stringify(event));
    await redisCommand("EXPIRE", key, String(ttlSeconds));
  }

  async delete(sessionId: string) {
    await redisCommand("DEL", getSessionKey(sessionId), getEventKey(sessionId));
  }

  async get(sessionId: string) {
    const value = await redisCommand("GET", getSessionKey(sessionId));
    if (!value || typeof value !== "string") return null;

    return JSON.parse(value) as RealtimeSession;
  }

  async listEvents(sessionId: string) {
    const value = await redisCommand("LRANGE", getEventKey(sessionId), "0", "-1");
    if (!Array.isArray(value)) return [];

    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => JSON.parse(item) as RealtimeSessionEvent);
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
