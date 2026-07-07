import { describe, expect, it } from "vitest";
import { createStaticImageGenerationProvider } from "./static-image-generation-provider";

describe("createStaticImageGenerationProvider", () => {
  it("returns placeholder bytes without external provider cost", async () => {
    const provider = createStaticImageGenerationProvider({
      imagePath: "marketing/digital-human.png",
    });

    const result = await provider.generate({
      prompt: "生成一个数字人头像",
      style: "portrait",
    });

    expect(result.imageBytes?.byteLength).toBeGreaterThan(0);
    expect(result.mimeType).toBe("image/png");
    expect(result.metadata).toMatchObject({
      prompt: "生成一个数字人头像",
      source: "static-placeholder-image",
      sourcePath: "/marketing/digital-human.png",
      style: "portrait",
    });
  });

  it("rejects paths outside public directory", async () => {
    const provider = createStaticImageGenerationProvider({
      imagePath: "../package.json",
    });

    await expect(
      provider.generate({
        prompt: "invalid",
      }),
    ).rejects.toThrow("Invalid static image path");
  });
});
