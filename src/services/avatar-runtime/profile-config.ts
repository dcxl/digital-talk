import {
  getAvatarRuntimeMotionMapFromConfig,
  type AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";

export interface AvatarRuntimeProfileConfig {
  motionMap?: AvatarRuntimeMotionMap;
}

export function getAvatarRuntimeProfileConfig(
  config: unknown,
): AvatarRuntimeProfileConfig {
  const motionMap = getAvatarRuntimeMotionMapFromConfig(config);

  return {
    motionMap: Object.keys(motionMap).length > 0 ? motionMap : undefined,
  };
}
