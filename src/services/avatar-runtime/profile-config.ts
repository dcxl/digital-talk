import {
  getAvatarRuntimeMotionMapFromConfig,
  type AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";
import {
  getAvatarRuntimeMotionAssetsFromConfig,
  type AvatarRuntimeMotionAssetMap,
} from "@/core/avatar-runtime/motion-assets";

export interface AvatarRuntimeProfileConfig {
  motionAssets?: AvatarRuntimeMotionAssetMap;
  motionMap?: AvatarRuntimeMotionMap;
}

export function getAvatarRuntimeProfileConfig(
  config: unknown,
): AvatarRuntimeProfileConfig {
  const motionAssets = getAvatarRuntimeMotionAssetsFromConfig(config);
  const motionMap = getAvatarRuntimeMotionMapFromConfig(config);

  return {
    motionAssets:
      Object.keys(motionAssets).length > 0 ? motionAssets : undefined,
    motionMap: Object.keys(motionMap).length > 0 ? motionMap : undefined,
  };
}
