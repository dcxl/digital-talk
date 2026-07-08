import { describe, expect, it } from "vitest";
import { resolveAvatarMotionRuntime } from "./motion-runtime";

describe("avatar motion runtime", () => {
  it("keeps idle movement subtle and closes the mouth", () => {
    const motion = resolveAvatarMotionRuntime({
      mouthOpen: 0.8,
      state: "idle",
      volume: 0.7,
    });

    expect(motion.animationClass).toBe("avatar-motion-breathe");
    expect(motion.mouthOpen).toBe(0);
    expect(motion.ring).toBe(false);
    expect(motion.cssVars["--avatar-motion-scale"]).toBe("1");
  });

  it("amplifies speaking mouth and motion with volume", () => {
    const motion = resolveAvatarMotionRuntime({
      mouthOpen: 0.2,
      state: "speaking",
      volume: 0.6,
    });

    expect(motion.animationClass).toBe("avatar-motion-speak");
    expect(motion.isSpeaking).toBe(true);
    expect(motion.mouthOpen).toBeGreaterThan(0.5);
    expect(Number(motion.cssVars["--avatar-motion-scale"])).toBeGreaterThan(1);
    expect(motion.ring).toBe(true);
  });

  it("clamps noisy audio inputs", () => {
    const motion = resolveAvatarMotionRuntime({
      mouthOpen: 2,
      state: "speaking",
      volume: Number.NaN,
    });

    expect(motion.volume).toBe(0);
    expect(motion.mouthOpen).toBe(1);
  });

  it("uses profile motion map semantics", () => {
    const motion = resolveAvatarMotionRuntime({
      motionMap: {
        thinking: {
          expression: "ponder",
          motion: "slow-float",
        },
      },
      state: "thinking",
    });

    expect(motion.expression).toBe("ponder");
    expect(motion.motion).toBe("slow-float");
    expect(motion.animationClass).toBe("avatar-motion-float");
  });
});

