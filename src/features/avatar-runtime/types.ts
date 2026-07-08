import type { RuntimeState } from "@/core/runtime/events";
import type {
  AvatarRuntimeMotionDirective,
  AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";
import type {
  AvatarRuntimeMotionAssetDirective,
  AvatarRuntimeMotionAssetMap,
} from "@/core/avatar-runtime/motion-assets";

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
  loadLatencyMs: number;
  mouth: {
    openness: number;
    source: "audio-volume" | "none" | "speech-mark" | "viseme";
  };
  motion: AvatarRuntimeMotionDirective;
  motionAsset?: AvatarRuntimeMotionAssetDirective;
  motionAssets?: AvatarRuntimeMotionAssetMap;
  motionMap?: AvatarRuntimeMotionMap;
  reason?: string;
  status: "degraded" | "error" | "placeholder" | "ready";
  state: RuntimeState;
  updatedAt: string;
}
