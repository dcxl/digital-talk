import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAICompatibleASRProvider } from "./openai-compatible-asr-provider";

describe("createOpenAICompatibleASRProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts OpenAI-compatible transcription form data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        duration: 1.2,
        language: "zh",
        text: "你好",
      }),
    );

    const provider = createOpenAICompatibleASRProvider({
      apiKey: "sk-test",
      baseUrl: "https://example.com/v1",
      model: "whisper-1",
    });
    const result = await provider.transcribe({
      audio: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }),
      language: "zh",
    });
    const [, init] = fetchMock.mock.calls[0] ?? [];

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/audio/transcriptions",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer sk-test",
        },
        method: "POST",
      }),
    );
    expect((init?.body as FormData).get("model")).toBe("whisper-1");
    expect((init?.body as FormData).get("language")).toBe("zh");
    expect(result).toMatchObject({
      durationMs: 1200,
      language: "zh",
      text: "你好",
    });
  });
});
