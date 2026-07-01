import type { AvatarProvider } from "@/core/providers/types";
import { staticAvatarProvider } from "./static-avatar-provider";

export function getAvatarProvider(): AvatarProvider {
  return staticAvatarProvider;
}
