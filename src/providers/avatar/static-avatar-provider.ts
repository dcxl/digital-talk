import type { AvatarProvider } from "@/core/providers/types";

export const staticAvatarProvider: AvatarProvider = {
  id: "static-avatar",
  name: "Static Avatar Provider",
  capability: "avatar",
  version: "0.1.0",
  health: "ready",

  async setState(input) {
    return {
      state: input.state,
      updatedAt: new Date().toISOString(),
    };
  },
};
