import type { TTSProvider } from "@/core/providers/types";

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

export const mockTTSProvider: TTSProvider = {
  id: "mock-tts",
  name: "Mock TTS Provider",
  capability: "tts",
  version: "0.1.0",
  health: "ready",

  async synthesize(input) {
    const durationMs = Math.min(1400, Math.max(650, input.text.length * 14));
    await wait(260, input.signal);

    return {
      audioUrl: `/api/audio/mock-silence?durationMs=${durationMs}`,
      durationMs,
      mimeType: "audio/wav",
      marks: [],
    };
  },
};
