import { describe, expect, it } from "vitest";
import { calculateRms, mapVolumeToMouthOpen } from "./audio-level";

describe("audio level helpers", () => {
  it("calculates silence as zero rms", () => {
    expect(calculateRms(new Uint8Array([128, 128, 128, 128]))).toBe(0);
  });

  it("calculates rms from byte time-domain samples", () => {
    const rms = calculateRms(new Uint8Array([128, 160, 96, 128]));

    expect(rms).toBeGreaterThan(0.17);
    expect(rms).toBeLessThan(0.18);
  });

  it("maps low noise to a closed mouth", () => {
    expect(mapVolumeToMouthOpen(0.005)).toBe(0);
  });

  it("maps stronger volume to larger mouth openness", () => {
    expect(mapVolumeToMouthOpen(0.25)).toBeGreaterThan(
      mapVolumeToMouthOpen(0.05),
    );
    expect(mapVolumeToMouthOpen(1)).toBe(1);
  });
});
