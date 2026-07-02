import type { ImageGenerationProvider } from "@/core/providers/types";
import { createStaticImageGenerationProvider } from "./static-image-generation-provider";

function env(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function getImageGenerationProvider(): ImageGenerationProvider {
  return createStaticImageGenerationProvider({
    imagePath: env("DEFAULT_AVATAR_GENERATION_IMAGE"),
  });
}
