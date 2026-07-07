import { performance } from "node:perf_hooks";
import type {
  AvatarRuntimeDriver,
  AvatarRuntimeInput,
  AvatarRuntimeResult,
} from "@/core/providers/types";
import {
  normalizeAvatarRuntimeMotionMap,
  resolveAvatarMotionDirective,
} from "@/core/avatar-runtime/motion-map";

const adapters: Record<
  AvatarRuntimeDriver,
  {
    adapterId: string;
    adapterName: string;
    capabilities: AvatarRuntimeResult["capabilities"];
    fallbackDriver?: AvatarRuntimeDriver;
    status: AvatarRuntimeResult["status"];
  }
> = {
  live2d: {
    adapterId: "static-compat-runtime",
    adapterName: "静态兼容运行时",
    capabilities: {
      expressions: false,
      image: true,
      live2d: false,
      motions: false,
      viseme: true,
      vrm: false,
    },
    fallbackDriver: "static",
    status: "degraded",
  },
  static: {
    adapterId: "static-avatar-runtime",
    adapterName: "静态数字人运行时",
    capabilities: {
      expressions: false,
      image: true,
      live2d: false,
      motions: false,
      viseme: true,
      vrm: false,
    },
    status: "ready",
  },
  vrm: {
    adapterId: "static-compat-runtime",
    adapterName: "静态兼容运行时",
    capabilities: {
      expressions: false,
      image: true,
      live2d: false,
      motions: false,
      viseme: true,
      vrm: false,
    },
    fallbackDriver: "static",
    status: "degraded",
  },
};

function normalizeDriver(driver?: AvatarRuntimeDriver): AvatarRuntimeDriver {
  return driver === "live2d" || driver === "vrm" ? driver : "static";
}

function getMouthOpen(input: AvatarRuntimeInput) {
  if (input.state !== "speaking") return 0;
  if (typeof input.mouthOpen !== "number") return 0;

  return Math.max(0, Math.min(1, input.mouthOpen));
}

export function resolveAvatarRuntime(
  input: AvatarRuntimeInput,
): AvatarRuntimeResult {
  const startedAt = performance.now();
  const driver = normalizeDriver(input.driver);
  const resolvedAdapter = adapters[driver];
  const motionMap = normalizeAvatarRuntimeMotionMap(input.motionMap);

  return {
    ...resolvedAdapter,
    driver,
    loadLatencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    mouth: {
      openness: getMouthOpen(input),
      source: input.state === "speaking" ? "audio-volume" : "none",
    },
    motion: resolveAvatarMotionDirective({
      motionMap,
      state: input.state,
    }),
    motionMap: Object.keys(motionMap).length > 0 ? motionMap : undefined,
    reason: input.reason,
    state: input.state,
    updatedAt: new Date().toISOString(),
  };
}
