import { describe, expect, it } from "vitest";
import {
  createRealtimeSessionRecord,
  touchRealtimeSession,
} from "./session-store";

describe("realtime session store helpers", () => {
  it("creates an idle realtime session record with ttl", () => {
    const { session, ttlSeconds } = createRealtimeSessionRecord({
      avatarProfileId: "avatar_1",
      transport: "websocket",
      userId: "user_1",
    });

    expect(session.id).toBeTruthy();
    expect(session.avatarProfileId).toBe("avatar_1");
    expect(session.status).toBe("idle");
    expect(session.transport).toBe("websocket");
    expect(session.userId).toBe("user_1");
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(
      new Date(session.createdAt).getTime(),
    );
    expect(ttlSeconds).toBeGreaterThan(0);
  });

  it("updates the session timestamp without changing identity", () => {
    const { session } = createRealtimeSessionRecord({
      userId: "user_1",
    });
    const touched = touchRealtimeSession(session);

    expect(touched.id).toBe(session.id);
    expect(touched.updatedAt).toBeTruthy();
  });
});
