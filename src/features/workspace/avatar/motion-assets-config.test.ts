import { describe, expect, it } from "vitest";
import {
  getAvatarMotionAssetsEditorValue,
  parseAvatarMotionAssetsEditorValue,
} from "./motion-assets-config";

describe("avatar motion assets config", () => {
  it("extracts runtime motion assets for editing", () => {
    const value = getAvatarMotionAssetsEditorValue({
      runtime: {
        motionAssets: {
          idle: {
            kind: "image",
            url: "/idle.png",
          },
        },
      },
    });

    expect(value).toContain('"idle"');
    expect(value).toContain('"/idle.png"');
  });

  it("writes normalized motion assets without dropping motion map", () => {
    const result = parseAvatarMotionAssetsEditorValue(
      {
        runtime: {
          motionMap: {
            speaking: {
              expression: "happy",
            },
          },
        },
        scene: "studio",
      },
      JSON.stringify({
        idle: {
          kind: "image",
          url: "/idle.png",
        },
        unknown: {
          kind: "image",
          url: "/ignored.png",
        },
      }),
    );

    expect(result.error).toBeUndefined();
    expect(result.config).toEqual({
      runtime: {
        motionAssets: {
          idle: {
            kind: "image",
            url: "/idle.png",
          },
        },
        motionMap: {
          speaking: {
            expression: "happy",
          },
        },
      },
      scene: "studio",
    });
  });

  it("accepts wrapped runtime config input", () => {
    const result = parseAvatarMotionAssetsEditorValue(
      {},
      JSON.stringify({
        runtime: {
          motionAssets: {
            speaking: {
              kind: "video",
              loop: true,
              url: "/speaking.mp4",
            },
          },
        },
      }),
    );

    expect(result.config).toEqual({
      runtime: {
        motionAssets: {
          speaking: {
            kind: "video",
            loop: true,
            url: "/speaking.mp4",
          },
        },
      },
    });
  });

  it("removes motion assets when editor is cleared", () => {
    const result = parseAvatarMotionAssetsEditorValue(
      {
        runtime: {
          motionAssets: {
            idle: {
              kind: "image",
              url: "/idle.png",
            },
          },
          motionMap: {
            speaking: {
              expression: "happy",
            },
          },
        },
      },
      "",
    );

    expect(result.config).toEqual({
      runtime: {
        motionMap: {
          speaking: {
            expression: "happy",
          },
        },
      },
    });
  });
});

