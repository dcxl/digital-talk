export interface MouthSyncMark {
  timeMs: number;
  value: string;
}

export type MouthSyncSource = "audio-volume" | "none" | "speech-mark";

export interface MouthSyncTimeline {
  durationMs?: number;
  marks: MouthSyncMark[];
  source: "speech-mark";
  startedAtMs: number;
}

export interface MouthSyncState {
  mouthOpen: number;
  source: MouthSyncSource;
  volume: number;
}
