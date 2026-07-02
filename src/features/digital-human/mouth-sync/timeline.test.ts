import { describe, expect, it } from "vitest";
import {
  createMouthSyncTimeline,
  getMouthOpenAt,
  mapMarkValueToMouthOpen,
} from "./timeline";

describe("mouth sync timeline", () => {
  it("normalizes and sorts speech marks", () => {
    const timeline = createMouthSyncTimeline({
      marks: [
        { timeMs: 240, value: "closed" },
        { timeMs: 40, value: "a" },
      ],
      startedAtMs: 1000,
    });

    expect(timeline?.marks).toEqual([
      { timeMs: 40, value: "a" },
      { timeMs: 240, value: "closed" },
    ]);
  });

  it("maps common viseme-like values to mouth openness", () => {
    expect(mapMarkValueToMouthOpen("closed")).toBe(0);
    expect(mapMarkValueToMouthOpen("a")).toBeGreaterThan(0.9);
    expect(mapMarkValueToMouthOpen("o")).toBeGreaterThan(0.6);
    expect(mapMarkValueToMouthOpen("m")).toBeLessThan(0.3);
    expect(mapMarkValueToMouthOpen("0.42")).toBeCloseTo(0.42);
  });

  it("interpolates mouth openness by elapsed time", () => {
    const timeline = createMouthSyncTimeline({
      marks: [
        { timeMs: 0, value: "closed" },
        { timeMs: 100, value: "a" },
      ],
      startedAtMs: 2000,
    });

    expect(timeline).not.toBeNull();
    expect(
      getMouthOpenAt({
        nowMs: 2050,
        timeline: timeline!,
      }),
    ).toBeGreaterThan(0.4);
  });

  it("returns null when no marks are available", () => {
    expect(
      createMouthSyncTimeline({
        marks: [],
        startedAtMs: 0,
      }),
    ).toBeNull();
  });
});
