import type {
  ImageGenerationInput,
  ImageGenerationProvider,
} from "@/core/providers/types";

const defaultImagePath = "marketing/beautiful_girl.png";
const placeholderPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/luzx5wAAAABJRU5ErkJggg==",
  "base64",
);

export interface StaticImageGenerationProviderOptions {
  imagePath?: string;
  name?: string;
}

function resolvePublicImagePath(imagePath?: string) {
  const relativePath = (imagePath || defaultImagePath).replace(/^\/+/, "");
  const segments = relativePath.split("/").filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === "." || segment === "..") ||
    relativePath.includes("\\")
  ) {
    throw new Error("Invalid static image path");
  }

  return segments.join("/");
}

export function createStaticImageGenerationProvider(
  options: StaticImageGenerationProviderOptions = {},
): ImageGenerationProvider {
  return {
    id: "static-image-generation",
    name: options.name ?? "Static Image Generation Provider",
    capability: "image-generation",
    health: "ready",

    async generate(input: ImageGenerationInput) {
      const relativePath = resolvePublicImagePath(options.imagePath);

      return {
        imageBytes: placeholderPng,
        metadata: {
          prompt: input.prompt,
          source: "static-placeholder-image",
          sourcePath: `/${relativePath}`,
          size: placeholderPng.byteLength,
          style: input.style,
        },
        mimeType: "image/png",
      };
    },
  };
}
