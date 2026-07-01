import type { TTSProvider } from "@/core/providers/types";
import { mockTTSProvider } from "./mock-tts-provider";

export function getTTSProvider(): TTSProvider {
  return mockTTSProvider;
}
