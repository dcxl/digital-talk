import type { ASRProvider } from "@/core/providers/types";
import { mockASRProvider } from "./mock-asr-provider";

export function getASRProvider(): ASRProvider {
  return mockASRProvider;
}
