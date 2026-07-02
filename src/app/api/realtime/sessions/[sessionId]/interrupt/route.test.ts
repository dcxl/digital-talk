import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RealtimeSession } from "@/services/realtime/types";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  appendRealtimeSessionEvent: vi.fn(),
  store: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("@/services/realtime/session-store", () => ({
  getRealtimeSessionStore: () => mocks.store,
  getRealtimeSessionTtlSeconds: () => 900,
  touchRealtimeSession: (session: RealtimeSession) => ({
    ...session,
    updatedAt: "2026-07-02T00:00:00.000Z",
  }),
}));

vi.mock("@/services/realtime/event-buffer", () => ({
  appendRealtimeSessionEvent: mocks.appendRealtimeSessionEvent,
}));

function createSession(overrides: Partial<RealtimeSession> = {}): RealtimeSession {
  return {
    activeAudioId: null,
    activeMessageId: null,
    avatarProfileId: null,
    conversationId: null,
    createdAt: "2026-07-02T00:00:00.000Z",
    endedAt: null,
    expiresAt: "2026-07-02T00:15:00.000Z",
    id: "session_1",
    interruptReason: null,
    knowledgeBaseId: null,
    metadata: undefined,
    modelProviderId: null,
    status: "idle",
    transport: "sse",
    updatedAt: "2026-07-02T00:00:00.000Z",
    userId: "user_1",
    voiceProviderId: null,
    ...overrides,
  };
}

function createRequest() {
  return new Request("http://localhost/api/realtime/sessions/session_1/interrupt", {
    body: JSON.stringify({ reason: "test" }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

async function callRoute() {
  return POST(createRequest() as unknown as NextRequest, {
    params: Promise.resolve({ sessionId: "session_1" }),
  });
}

describe("realtime interrupt failure recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when the session is missing", async () => {
    mocks.store.get.mockResolvedValue(null);

    const response = await callRoute();
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("not_found");
    expect(payload.error.retryable).toBe(false);
  });

  it("rejects interrupt for closed sessions", async () => {
    mocks.store.get.mockResolvedValue(createSession({ status: "closed" }));

    const response = await callRoute();
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("invalid_state");
    expect(payload.error.retryable).toBe(false);
  });

  it("returns retryable redis_unavailable when the store fails", async () => {
    mocks.store.get.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const response = await callRoute();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe("redis_unavailable");
    expect(payload.error.retryable).toBe(true);
  });

  it("persists an interrupt event for active sessions", async () => {
    mocks.store.get.mockResolvedValue(createSession());
    mocks.store.set.mockResolvedValue(undefined);
    mocks.appendRealtimeSessionEvent.mockResolvedValue({
      createdAt: "2026-07-02T00:00:00.000Z",
      id: "event_1",
      payload: { reason: "test", status: "interrupted" },
      sequence: 1,
      sessionId: "session_1",
      type: "session.interrupted",
    });

    const response = await callRoute();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.session.status).toBe("interrupted");
    expect(payload.data.event.type).toBe("session.interrupted");
  });
});
