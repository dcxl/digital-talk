import { describe, expect, it } from "vitest";
import {
  createRealtimeSessionEvent,
  getNextRealtimeEventSequence,
} from "./event-buffer";

describe("realtime event buffer helpers", () => {
  it("creates sequenced realtime events", () => {
    const event = createRealtimeSessionEvent({
      payload: { text: "你好" },
      sequence: 3,
      sessionId: "session_1",
      type: "asr.partial",
    });

    expect(event.id).toBeTruthy();
    expect(event.sequence).toBe(3);
    expect(event.payload).toEqual({ text: "你好" });
    expect(event.sessionId).toBe("session_1");
    expect(event.type).toBe("asr.partial");
  });

  it("calculates the next sequence from existing events", () => {
    expect(
      getNextRealtimeEventSequence([
        createRealtimeSessionEvent({
          sequence: 1,
          sessionId: "session_1",
          type: "asr.partial",
        }),
        createRealtimeSessionEvent({
          sequence: 7,
          sessionId: "session_1",
          type: "asr.final",
        }),
      ]),
    ).toBe(8);
  });
});
