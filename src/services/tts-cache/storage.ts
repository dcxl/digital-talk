import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

export interface TTSCacheKeyInput {
  format: "mp3" | "wav";
  model: string;
  provider: string;
  sampleRate: number;
  text: string;
  voice: string;
}

export interface TTSCacheEntry {
  audio: Buffer;
  durationMs: number;
  mimeType: string;
}

interface TTSCacheMetadata {
  durationMs: number;
  format: "mp3" | "wav";
  key: string;
  mimeType: string;
}

function isCacheEnabled() {
  return process.env.TTS_CACHE_ENABLED !== "false";
}

function getCacheRoot() {
  if (process.env.NODE_ENV === "test" && process.env.TTS_CACHE_DIR) {
    return process.env.TTS_CACHE_DIR.replace(/\/+$/, "");
  }

  return `${process.cwd()}/storage/tts-cache`;
}

export function createTTSCacheKey(input: TTSCacheKeyInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        format: input.format,
        model: input.model,
        provider: input.provider,
        sampleRate: input.sampleRate,
        text: input.text,
        voice: input.voice,
      }),
    )
    .digest("hex");
}

function getCachePaths(key: string, format: "mp3" | "wav") {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid TTS cache key");

  const root = getCacheRoot();

  return {
    audioPath: `${root}/${key}.${format}`,
    metadataPath: `${root}/${key}.json`,
  };
}

function getParentDirectory(filePath: string) {
  return filePath.slice(0, filePath.lastIndexOf("/")) || ".";
}

export async function readTTSCache(
  input: TTSCacheKeyInput,
): Promise<TTSCacheEntry | null> {
  if (!isCacheEnabled()) return null;

  const key = createTTSCacheKey(input);
  const paths = getCachePaths(key, input.format);

  try {
    const [audio, metadataText] = await Promise.all([
      readFile(paths.audioPath),
      readFile(paths.metadataPath, "utf8"),
    ]);
    const metadata = JSON.parse(metadataText) as TTSCacheMetadata;

    if (metadata.key !== key || metadata.format !== input.format) return null;

    return {
      audio,
      durationMs: metadata.durationMs,
      mimeType: metadata.mimeType,
    };
  } catch {
    return null;
  }
}

export async function writeTTSCache(
  input: TTSCacheKeyInput & TTSCacheEntry,
): Promise<void> {
  if (!isCacheEnabled()) return;

  const key = createTTSCacheKey(input);
  const paths = getCachePaths(key, input.format);
  const metadata: TTSCacheMetadata = {
    durationMs: input.durationMs,
    format: input.format,
    key,
    mimeType: input.mimeType,
  };

  await mkdir(getParentDirectory(paths.audioPath), { recursive: true });
  await Promise.all([
    writeFile(paths.audioPath, input.audio),
    writeFile(paths.metadataPath, JSON.stringify(metadata, null, 2)),
  ]);
}
