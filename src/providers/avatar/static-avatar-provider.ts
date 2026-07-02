import type { AvatarProvider } from "@/core/providers/types";
import { resolveAvatarRuntime } from "./runtime-adapter";

export const staticAvatarProvider: AvatarProvider = {
  id: "static-avatar",
  name: "Static Avatar Provider",
  capability: "avatar",
  version: "0.1.0",
  health: "ready",

  async getRuntime(input) {
    return resolveAvatarRuntime(input);
  },

  async setState(input) {
    return {
      state: input.state,
      updatedAt: new Date().toISOString(),
    };
  },
};
