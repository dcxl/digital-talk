import type { RuntimeEvent } from "@/core/runtime/events";

export interface PlaygroundFormState {
  enableTTS: boolean;
  knowledgeBaseId: string;
  message: string;
  modelProviderId: string;
}

export interface PlaygroundEventLog {
  at: string;
  event: RuntimeEvent;
  id: string;
}

export interface PlaygroundLogLine {
  at: string;
  id: string;
  level: "info" | "error" | "success";
  message: string;
}

export interface PlaygroundMetrics {
  eventCount: number;
  firstTokenMs?: number;
  inputTokens: number;
  outputTokens: number;
  ragHitCount: number;
  totalLatencyMs?: number;
  totalTokens: number;
  ttsLatencyMs?: number;
}
