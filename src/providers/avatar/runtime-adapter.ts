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
import {
  getDefaultLive2DPackage,
  validateLive2DPackage,
} from "@/services/avatar-runtime/live2d-manifest";

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
    adapterId: "live2d-placeholder",
    adapterName: "Live2D 占位运行时",
    capabilities: {
      expressions: false,
      image: true,
      live2d: false,
      motions: false,
      viseme: true,
      vrm: false,
    },
    fallbackDriver: "static",
    status: "placeholder",
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
    adapterId: "vrm-placeholder",
    adapterName: "VRM 占位运行时",
    capabilities: {
      expressions: false,
      image: true,
      live2d: false,
      motions: false,
      viseme: true,
      vrm: false,
    },
    fallbackDriver: "static",
    status: "placeholder",
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

function getLive2DRuntime(input: AvatarRuntimeInput) {
  const manifest = input.assetPackageId
    ? validateLive2DPackage({ packageId: input.assetPackageId })
    : getDefaultLive2DPackage();

  if (!manifest) return null;

  return {
    adapterId: "live2d-runtime",
    adapterName: "Live2D 数字人运行时",
    asset: {
      entrypoint: manifest.entrypoint.url,
      files: manifest.files.map((file) => ({
        mimeType: file.mimeType,
        path: file.path,
        url: file.url,
      })),
      id: manifest.packageId,
      manifestUrl: manifest.entrypoint.url,
      type: "live2d" as const,
    },
    capabilities: {
      expressions: manifest.expressions.length > 0,
      image: true,
      live2d: manifest.valid,
      motions: manifest.motions.length > 0,
      viseme: true,
      vrm: false,
    },
    diagnostics: {
      errors: manifest.errors,
      warnings: manifest.warnings,
    },
    fallbackDriver: manifest.valid ? undefined : ("static" as const),
    status: manifest.valid ? ("ready" as const) : ("degraded" as const),
  };
}

export function resolveAvatarRuntime(
  input: AvatarRuntimeInput,
): AvatarRuntimeResult {
  const startedAt = performance.now();
  const driver = normalizeDriver(input.driver);
  const adapter = driver === "live2d" ? getLive2DRuntime(input) : null;
  const resolvedAdapter = adapter ?? adapters[driver];
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
