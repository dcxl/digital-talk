import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAICompatibleTTSProvider } from "./openai-compatible-tts-provider";

describe("createOpenAICompatibleTTSProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts OpenAI-compatible speech payload and returns playable data URL", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          "Content-Type": "audio/mpeg",
        },
        status: 200,
      }),
    );

    const provider = createOpenAICompatibleTTSProvider({
      apiKey: "sk-test",
      baseUrl: "https://example.com/v1",
      model: "tts-1",
      voice: "alloy",
    });
    const result = await provider.synthesize({
      format: "mp3",
      text: "hello",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/audio/speech",
      expect.objectContaining({
        body: JSON.stringify({
          input: "hello",
          model: "tts-1",
          response_format: "mp3",
          voice: "alloy",
        }),
        headers: {
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    expect(result.audioUrl).toBe("data:audio/mpeg;base64,AQID");
    expect(result.mimeType).toBe("audio/mpeg");
  });
});
