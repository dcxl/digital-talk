import { describe, expect, it } from "vitest";
import {
  getAvatarMotionMapEditorValue,
  parseAvatarMotionMapEditorValue,
} from "./motion-config";

describe("avatar motion config", () => {
  it("extracts runtime motion map for editing", () => {
    const value = getAvatarMotionMapEditorValue({
      scene: "studio",
      runtime: {
        motionMap: {
          speaking: {
            expression: "happy",
            motion: "talk-soft",
          },
        },
      },
    });

    expect(value).toContain('"speaking"');
    expect(value).toContain('"talk-soft"');
  });

  it("writes normalized motion map without dropping existing config", () => {
    const result = parseAvatarMotionMapEditorValue(
      {
        scene: "studio",
      },
      JSON.stringify({
        speaking: {
          expression: ["happy", "speaking"],
          motion: "talk-soft",
        },
        unknown: {
          expression: "ignored",
        },
      }),
    );

    expect(result.error).toBeUndefined();
    expect(result.config).toEqual({
      runtime: {
        motionMap: {
          speaking: {
            expression: ["happy", "speaking"],
            motion: "talk-soft",
          },
        },
      },
      scene: "studio",
    });
  });

  it("accepts wrapped runtime config input", () => {
    const result = parseAvatarMotionMapEditorValue(
      {},
      JSON.stringify({
        runtime: {
          motionMap: {
            thinking: {
              expression: "thinking",
            },
          },
        },
      }),
    );

    expect(result.config).toEqual({
      runtime: {
        motionMap: {
          thinking: {
            expression: "thinking",
          },
        },
      },
    });
  });

  it("removes motion map when editor is cleared", () => {
    const result = parseAvatarMotionMapEditorValue(
      {
        runtime: {
          motionMap: {
            speaking: {
              expression: "happy",
            },
          },
          other: true,
        },
        scene: "studio",
      },
      "",
    );

    expect(result.config).toEqual({
      runtime: {
        other: true,
      },
      scene: "studio",
    });
  });

  it("returns validation errors for invalid input", () => {
    expect(parseAvatarMotionMapEditorValue({}, "[1]").error).toBe(
      "动作映射必须是对象",
    );
    expect(parseAvatarMotionMapEditorValue({}, "{").error).toBe(
      "动作映射 JSON 格式不正确",
    );
  });
});

