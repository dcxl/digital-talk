import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  ImageGenerationInput,
  ImageGenerationProvider,
} from "@/core/providers/types";

const defaultImagePath = "marketing/beautiful_girl.png";

export interface StaticImageGenerationProviderOptions {
  imagePath?: string;
  name?: string;
}

function getPublicRoot() {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public");
}

function resolvePublicImagePath(imagePath?: string) {
  const publicRoot = getPublicRoot();
  const relativePath = (imagePath || defaultImagePath).replace(/^\/+/, "");
  const filePath = path.resolve(publicRoot, relativePath);
  const normalizedRoot = path.resolve(publicRoot);

  if (
    filePath !== normalizedRoot &&
    !filePath.startsWith(`${normalizedRoot}${path.sep}`)
  ) {
    throw new Error("Invalid static image path");
  }

  return {
    filePath,
    relativePath,
  };
}

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
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
      const { filePath, relativePath } = resolvePublicImagePath(
        options.imagePath,
      );
      const [imageBytes, fileStat] = await Promise.all([
        readFile(filePath),
        stat(filePath),
      ]);

      return {
        imageBytes,
        metadata: {
          prompt: input.prompt,
          source: "static-public-image",
          sourcePath: `/${relativePath}`,
          size: fileStat.size,
          style: input.style,
        },
        mimeType: getMimeType(filePath),
      };
    },
  };
}
