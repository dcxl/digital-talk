import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createTTSCacheKey,
  readTTSCache,
  writeTTSCache,
  type TTSCacheKeyInput,
} from "./storage";

const baseKey: TTSCacheKeyInput = {
  format: "mp3",
  model: "cosyvoice-v3-flash",
  provider: "bailian-cosyvoice",
  sampleRate: 24000,
  text: "你好，我是数字人语音测试。",
  voice: "longhua_v3",
};

describe("TTS cache storage", () => {
  let previousCacheDir: string | undefined;
  let previousCacheEnabled: string | undefined;
  let cacheDir: string;

  beforeEach(async () => {
    previousCacheDir = process.env.TTS_CACHE_DIR;
    previousCacheEnabled = process.env.TTS_CACHE_ENABLED;
    cacheDir = await mkdtemp(path.join(tmpdir(), "tts-cache-test-"));
    process.env.TTS_CACHE_DIR = cacheDir;
    delete process.env.TTS_CACHE_ENABLED;
  });

  afterEach(async () => {
    if (previousCacheDir === undefined) {
      delete process.env.TTS_CACHE_DIR;
    } else {
      process.env.TTS_CACHE_DIR = previousCacheDir;
    }

    if (previousCacheEnabled === undefined) {
      delete process.env.TTS_CACHE_ENABLED;
    } else {
      process.env.TTS_CACHE_ENABLED = previousCacheEnabled;
    }

    await rm(cacheDir, { force: true, recursive: true });
  });

  it("creates stable keys for identical synthesis input", () => {
    expect(createTTSCacheKey(baseKey)).toBe(createTTSCacheKey({ ...baseKey }));
    expect(createTTSCacheKey(baseKey)).not.toBe(
      createTTSCacheKey({
        ...baseKey,
        text: "另一段测试文本。",
      }),
    );
  });

  it("writes and reads cached audio", async () => {
    await writeTTSCache({
      ...baseKey,
      audio: Buffer.from([1, 2, 3]),
      durationMs: 1234,
      mimeType: "audio/mpeg",
    });

    const cached = await readTTSCache(baseKey);

    expect(cached?.audio).toEqual(Buffer.from([1, 2, 3]));
    expect(cached?.durationMs).toBe(1234);
    expect(cached?.mimeType).toBe("audio/mpeg");
  });

  it("skips cache when disabled", async () => {
    process.env.TTS_CACHE_ENABLED = "false";

    await writeTTSCache({
      ...baseKey,
      audio: Buffer.from([1, 2, 3]),
      durationMs: 1234,
      mimeType: "audio/mpeg",
    });

    await expect(readTTSCache(baseKey)).resolves.toBeNull();
  });
});
