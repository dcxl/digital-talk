import { describe, expect, it } from "vitest";
import { staticAvatarProvider } from "./static-avatar-provider";

describe("static avatar runtime provider", () => {
  it("returns a ready static runtime", async () => {
    const runtime = await staticAvatarProvider.getRuntime({
      driver: "static",
      mouthOpen: 0.6,
      state: "speaking",
    });

    expect(runtime.driver).toBe("static");
    expect(runtime.status).toBe("ready");
    expect(runtime.loadLatencyMs).toBeGreaterThanOrEqual(0);
    expect(runtime.mouth.openness).toBe(0.6);
    expect(runtime.motion.motionCandidates).toContain("Speaking");
  });

  it("degrades retired drivers back to static", async () => {
    const live2d = await staticAvatarProvider.getRuntime({
      assetPackageId: "missing-package",
      driver: "live2d",
      state: "idle",
    });
    const vrm = await staticAvatarProvider.getRuntime({
      driver: "vrm",
      state: "idle",
    });

    expect(live2d.fallbackDriver).toBe("static");
    expect(live2d.loadLatencyMs).toBeGreaterThanOrEqual(0);
    expect(live2d.status).toBe("degraded");
    expect(vrm.fallbackDriver).toBe("static");
    expect(vrm.status).toBe("degraded");
  });

  it("applies profile motion map overrides", async () => {
    const runtime = await staticAvatarProvider.getRuntime({
      driver: "static",
      motionMap: {
        speaking: {
          expression: "qizi1",
          motion: "Scene1",
        },
      },
      state: "speaking",
    });

    expect(runtime.motion.source).toBe("profile-config");
    expect(runtime.motion.expressionCandidates).toEqual(["qizi1"]);
    expect(runtime.motion.motionCandidates).toEqual(["Scene1"]);
  });
});
