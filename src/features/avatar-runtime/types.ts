import type { RuntimeState } from "@/core/runtime/events";

export type AvatarRuntimeDriver = "live2d" | "static" | "vrm";

export interface AvatarRuntimeFile {
  mimeType: string;
  path: string;
  url: string;
}

export interface AvatarRuntimeSnapshot {
  adapterId: string;
  adapterName: string;
  asset?: {
    entrypoint: string;
    files?: AvatarRuntimeFile[];
    id: string;
    manifestUrl?: string;
    type: "image" | "live2d" | "vrm";
  };
  capabilities: {
    expressions: boolean;
    image: boolean;
    live2d: boolean;
    motions: boolean;
    viseme: boolean;
    vrm: boolean;
  };
  diagnostics?: {
    errors: string[];
    warnings: string[];
  };
  driver: AvatarRuntimeDriver;
  fallbackDriver?: AvatarRuntimeDriver;
  mouth: {
    openness: number;
    source: "audio-volume" | "none" | "speech-mark" | "viseme";
  };
  reason?: string;
  status: "degraded" | "error" | "placeholder" | "ready";
  state: RuntimeState;
  updatedAt: string;
}
