import type { AvatarDriver } from "@/generated/prisma/client";

export const avatarDrivers = new Set<AvatarDriver>(["static", "live2d", "vrm"]);

export const supportedAvatarDrivers = new Set<AvatarDriver>(["static"]);

export const defaultAvatarConfig = {
  scene: "studio",
  idleAnimation: "breathing",
  speakingAnimation: "pulse",
};
