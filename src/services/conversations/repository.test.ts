import { describe, expect, it } from "vitest";
import { createConversationTitle } from "./repository";

describe("createConversationTitle", () => {
  it("normalizes whitespace and limits title length", () => {
    expect(createConversationTitle("  hello    digital human project  ")).toBe(
      "hello digital human project",
    );
    expect(createConversationTitle("a".repeat(40))).toHaveLength(28);
  });

  it("falls back when input is empty", () => {
    expect(createConversationTitle("   ")).toBe("新会话");
  });
});
