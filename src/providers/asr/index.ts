import type { ASRProvider, StreamingASRProvider } from "@/core/providers/types";
import { mockASRProvider } from "./mock-asr-provider";

export function getASRProvider(): ASRProvider {
  return mockASRProvider;
}

export function getStreamingASRProvider(): StreamingASRProvider {
  return mockASRProvider;
}
