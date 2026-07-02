import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  listLocalLive2DPackages,
  validateLive2DPackage,
} from "./live2d-manifest";

function writeFixture(root: string) {
  const packagePath = path.join(root, "fixture");
  fs.mkdirSync(path.join(packagePath, "textures"), { recursive: true });
  fs.writeFileSync(path.join(packagePath, "fixture.moc3"), "moc");
  fs.writeFileSync(path.join(packagePath, "textures", "texture_00.png"), "png");
  fs.writeFileSync(path.join(packagePath, "idle.motion3.json"), "{}");
  fs.writeFileSync(path.join(packagePath, "happy.exp3.json"), "{}");
  fs.writeFileSync(
    path.join(packagePath, "fixture.model3.json"),
    JSON.stringify({
      FileReferences: {
        Moc: "fixture.moc3",
        Physics: "fixture.physics3.json",
        Textures: ["textures/texture_00.png"],
      },
      Version: 3,
    }),
  );
  fs.writeFileSync(path.join(packagePath, "fixture.physics3.json"), "{}");
}

describe("live2d manifest validation", () => {
  it("validates a local model package", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "live2d-test-"));
    writeFixture(root);

    const manifest = validateLive2DPackage({ packageId: "fixture", root });

    expect(manifest.valid).toBe(true);
    expect(manifest.entrypoint.path).toBe("fixture.model3.json");
    expect(manifest.moc?.path).toBe("fixture.moc3");
    expect(manifest.textures).toHaveLength(1);
    expect(manifest.motions).toHaveLength(1);
    expect(manifest.expressions).toHaveLength(1);
  });

  it("lists safe package directories only", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "live2d-list-test-"));
    fs.mkdirSync(path.join(root, "fixture"));
    fs.mkdirSync(path.join(root, "starter-avatar"));

    expect(listLocalLive2DPackages(root)).toEqual(["fixture"]);
  });
});
