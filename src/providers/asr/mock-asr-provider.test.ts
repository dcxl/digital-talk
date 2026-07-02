import { describe, expect, it } from "vitest";
import type { ASRChunk } from "@/core/providers/types";
import { mockASRProvider } from "./mock-asr-provider";

async function* audioChunks() {
  yield {
    audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
    mimeType: "audio/webm",
    sequence: 1,
  };
  yield {
    audio: new Blob([new Uint8Array([4, 5, 6])], { type: "audio/webm" }),
    mimeType: "audio/webm",
    sequence: 2,
  };
}

describe("mockASRProvider streaming", () => {
  it("emits partial chunks and a final transcript", async () => {
    const chunks: ASRChunk[] = [];

    for await (const chunk of mockASRProvider.stream({
      chunks: audioChunks(),
      language: "zh",
    })) {
      chunks.push(chunk);
    }

    expect(chunks.map((chunk) => chunk.type)).toEqual([
      "partial",
      "partial",
      "final",
    ]);
    expect(chunks.at(-1)).toMatchObject({
      language: "zh",
      text: "这是 mock ASR 转写结果",
      type: "final",
    });
  });
});
