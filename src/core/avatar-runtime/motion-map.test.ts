import { describe, expect, it } from "vitest";
import {
  getAvatarRuntimeMotionMapFromConfig,
  resolveAvatarMotionDirective,
} from "./motion-map";

describe("avatar runtime motion map", () => {
  it("resolves default speaking motion and expression candidates", () => {
    const directive = resolveAvatarMotionDirective({
      state: "speaking",
    });

    expect(directive.source).toBe("default");
    expect(directive.motionCandidates).toContain("Speaking");
    expect(directive.expressionCandidates).toContain("happy");
  });

  it("uses profile config overrides when available", () => {
    const motionMap = getAvatarRuntimeMotionMapFromConfig({
      runtime: {
        motionMap: {
          speaking: {
            expression: ["qizi1", "happy"],
            motion: "Scene1",
          },
        },
      },
    });
    const directive = resolveAvatarMotionDirective({
      motionMap,
      state: "speaking",
    });

    expect(directive.source).toBe("profile-config");
    expect(directive.motionCandidates).toEqual(["Scene1"]);
    expect(directive.expressionCandidates).toEqual(["qizi1", "happy"]);
  });

  it("ignores unsupported states and empty targets", () => {
    const motionMap = getAvatarRuntimeMotionMapFromConfig({
      motionMap: {
        idle: {
          motion: "",
        },
        unknown: {
          expression: "happy",
        },
      },
    });

    expect(motionMap).toEqual({});
  });
});
