import type { ASRProvider } from "@/core/providers/types";

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

export const mockASRProvider: ASRProvider = {
  id: "mock-asr",
  name: "Mock ASR Provider",
  capability: "asr",
  version: "0.1.0",
  health: "ready",

  async transcribe(input) {
    await wait(180, input.signal);

    return {
      text: "这是 mock ASR 转写结果",
      language: input.language ?? "zh",
      durationMs: Math.max(300, Math.min(3000, input.audio.size)),
      segments: [
        {
          startMs: 0,
          endMs: Math.max(300, Math.min(3000, input.audio.size)),
          text: "这是 mock ASR 转写结果",
        },
      ],
    };
  },
};
