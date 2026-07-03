import { describe, expect, it } from "vitest";
import {
  createRealtimeEventEnvelope,
  isRealtimeEventEnvelope,
  realtimeEventToEnvelope,
} from "./event-envelope";

describe("realtime event envelope", () => {
  it("creates a typed realtime event envelope", () => {
    const envelope = createRealtimeEventEnvelope({
      id: "event_1",
      payload: { text: "你好" },
      sequence: 2,
      sessionId: "session_1",
      timestamp: "2026-07-03T00:00:00.000Z",
      type: "asr.partial",
    });

    expect(envelope).toEqual({
      id: "event_1",
      payload: { text: "你好" },
      sequence: 2,
      sessionId: "session_1",
      timestamp: "2026-07-03T00:00:00.000Z",
      type: "asr.partial",
    });
  });

  it("converts stored realtime events to envelopes", () => {
    const envelope = realtimeEventToEnvelope({
      createdAt: "2026-07-03T00:00:00.000Z",
      id: "event_2",
      sequence: 7,
      sessionId: "session_2",
      type: "session.interrupted",
    });

    expect(envelope.payload).toBeNull();
    expect(envelope.timestamp).toBe("2026-07-03T00:00:00.000Z");
    expect(envelope.sequence).toBe(7);
  });

  it("guards envelope-shaped values", () => {
    expect(
      isRealtimeEventEnvelope({
        id: "event_1",
        payload: null,
        sequence: 1,
        sessionId: "session_1",
        timestamp: "2026-07-03T00:00:00.000Z",
        type: "heartbeat",
      }),
    ).toBe(true);
    expect(isRealtimeEventEnvelope({ type: "heartbeat" })).toBe(false);
  });
});
