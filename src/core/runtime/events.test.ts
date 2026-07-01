import { describe, expect, it } from "vitest";
import { encodeRuntimeEvent } from "./events";

describe("encodeRuntimeEvent", () => {
  it("encodes runtime events as SSE blocks", () => {
    const encoded = encodeRuntimeEvent({
      type: "text.delta",
      messageId: "msg_1",
      text: "hello",
    });

    expect(encoded).toBe(
      'event: text.delta\ndata: {"type":"text.delta","messageId":"msg_1","text":"hello"}\n\n',
    );
  });
});
