import { describe, expect, it } from "vitest";
import {
  getAvatarRuntimeMotionAssetsFromConfig,
  normalizeAvatarRuntimeMotionAssets,
  resolveAvatarMotionAsset,
} from "./motion-assets";

describe("avatar runtime motion assets", () => {
  it("normalizes supported runtime state assets", () => {
    const assets = normalizeAvatarRuntimeMotionAssets({
      idle: {
        kind: "image",
        url: "/idle.png",
      },
      speaking: [
        {
          expression: "happy",
          kind: "video",
          loop: true,
          posterUrl: "/speaking.png",
          url: "/speaking.mp4",
        },
      ],
      unknown: {
        kind: "image",
        url: "/ignored.png",
      },
    });

    expect(assets.idle).toEqual({
      kind: "image",
      url: "/idle.png",
    });
    expect(assets.speaking).toEqual({
      expression: "happy",
      kind: "video",
      loop: true,
      posterUrl: "/speaking.png",
      url: "/speaking.mp4",
    });
    expect(Object.keys(assets)).not.toContain("unknown");
  });

  it("extracts assets from runtime config", () => {
    const assets = getAvatarRuntimeMotionAssetsFromConfig({
      runtime: {
        motionAssets: {
          thinking: {
            kind: "image",
            url: "/thinking.png",
          },
        },
      },
    });

    expect(assets.thinking).toEqual({
      kind: "image",
      url: "/thinking.png",
    });
  });

  it("matches by expression before motion and state fallback", () => {
    const asset = resolveAvatarMotionAsset({
      expressionCandidates: ["happy"],
      motionAssets: {
        speaking: [
          {
            kind: "image",
            motion: "talk-soft",
            url: "/talk.png",
          },
          {
            expression: "happy",
            kind: "image",
            url: "/happy.png",
          },
        ],
      },
      motionCandidates: ["talk-soft"],
      state: "speaking",
    });

    expect(asset?.matchedBy).toBe("expression");
    expect(asset?.url).toBe("/happy.png");
  });

  it("falls back to first state asset", () => {
    const asset = resolveAvatarMotionAsset({
      motionAssets: {
        error: [
          {
            kind: "image",
            url: "/error.png",
          },
        ],
      },
      state: "error",
    });

    expect(asset?.matchedBy).toBe("state");
    expect(asset?.url).toBe("/error.png");
  });
});
