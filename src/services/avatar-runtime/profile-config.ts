import {
  getAvatarRuntimeMotionMapFromConfig,
  type AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";

export interface AvatarRuntimeProfileConfig {
  assetPackageId?: string;
  motionMap?: AvatarRuntimeMotionMap;
}

export function getRuntimePackageId(config: unknown) {
  if (!config || typeof config !== "object") return undefined;

  const record = config as Record<string, unknown>;
  const runtimeConfig = record.runtime;
  const live2dConfig = record.live2d;
  const runtimePackageId =
    runtimeConfig && typeof runtimeConfig === "object"
      ? (runtimeConfig as Record<string, unknown>).packageId
      : undefined;
  const live2dPackageId =
    live2dConfig && typeof live2dConfig === "object"
      ? (live2dConfig as Record<string, unknown>).packageId
      : undefined;

  return typeof runtimePackageId === "string" && runtimePackageId.trim()
    ? runtimePackageId.trim()
    : typeof live2dPackageId === "string" && live2dPackageId.trim()
      ? live2dPackageId.trim()
      : undefined;
}

export function getAvatarRuntimeProfileConfig(
  config: unknown,
): AvatarRuntimeProfileConfig {
  const motionMap = getAvatarRuntimeMotionMapFromConfig(config);

  return {
    assetPackageId: getRuntimePackageId(config),
    motionMap: Object.keys(motionMap).length > 0 ? motionMap : undefined,
  };
}
