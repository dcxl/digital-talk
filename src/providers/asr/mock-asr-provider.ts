import type { StreamingASRProvider } from "@/core/providers/types";

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }

    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      globalThis.clearTimeout(timer);
      reject(new Error("aborted"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

const mockText = "这是 mock ASR 转写结果";

export const mockASRProvider: StreamingASRProvider = {
  id: "mock-asr",
  name: "Mock ASR Provider",
  capability: "asr",
  version: "0.1.0",
  health: "ready",

  async transcribe(input) {
    await wait(180, input.signal);

    return {
      text: mockText,
      language: input.language ?? "zh",
      durationMs: Math.max(300, Math.min(3000, input.audio.size)),
      segments: [
        {
          startMs: 0,
          endMs: Math.max(300, Math.min(3000, input.audio.size)),
          text: mockText,
        },
      ],
    };
  },

  async *stream(input) {
    let totalSize = 0;

    for await (const chunk of input.chunks) {
      await wait(80, input.signal);
      totalSize += chunk.audio.size;

      yield {
        type: "partial",
        sequence: chunk.sequence,
        text: mockText.slice(0, Math.min(mockText.length, 6 + chunk.sequence * 4)),
      };
    }

    const durationMs = Math.max(300, Math.min(3000, totalSize));

    yield {
      type: "final",
      durationMs,
      language: input.language ?? "zh",
      segments: [
        {
          endMs: durationMs,
          startMs: 0,
          text: mockText,
        },
      ],
      text: mockText,
    };
  },
};
