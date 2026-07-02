import fs from "node:fs";
import path from "node:path";

export interface Live2DAssetFile {
  mimeType: string;
  path: string;
  size: number;
  url: string;
}

export interface Live2DPackageManifest {
  displayInfo?: Live2DAssetFile;
  entrypoint: Live2DAssetFile;
  errors: string[];
  expressions: Live2DAssetFile[];
  files: Live2DAssetFile[];
  moc?: Live2DAssetFile;
  motions: Live2DAssetFile[];
  name: string;
  packageId: string;
  physics?: Live2DAssetFile;
  rootUrl: string;
  textures: Live2DAssetFile[];
  valid: boolean;
  vtube?: Live2DAssetFile;
  warnings: string[];
}

interface Live2DModelJson {
  FileReferences?: {
    DisplayInfo?: string;
    Expressions?: Array<{
      File?: string;
      Name?: string;
    }>;
    Moc?: string;
    Motions?: Record<
      string,
      Array<{
        File?: string;
      }>
    >;
    Physics?: string;
    Textures?: string[];
  };
  Version?: number;
}

const live2dRoot = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "live2d",
);

function isSafePackageId(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value);
}

function normalizePackageId(value: string) {
  return value.trim();
}

function getPublicUrl(packageId: string, relativePath = "") {
  return `/live2d/${packageId}${relativePath ? `/${relativePath}` : ""}`;
}

function getMimeType(filePath: string) {
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".moc3")) return "application/octet-stream";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function toAssetFile(input: {
  packageId: string;
  packagePath: string;
  relativePath: string;
}): Live2DAssetFile | null {
  const filePath = path.join(input.packagePath, input.relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;

  return {
    mimeType: getMimeType(input.relativePath),
    path: input.relativePath,
    size: fs.statSync(filePath).size,
    url: getPublicUrl(input.packageId, input.relativePath),
  };
}

function listFilesByExtension(packagePath: string, extension: string) {
  if (!fs.existsSync(packagePath)) return [];

  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".DS_Store") continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.name.endsWith(extension)) {
        found.push(path.relative(packagePath, fullPath));
      }
    }
  };

  walk(packagePath);
  return found.sort();
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function readModelJson(packagePath: string, modelJsonPath: string) {
  return JSON.parse(
    fs.readFileSync(path.join(packagePath, modelJsonPath), "utf8"),
  ) as Live2DModelJson;
}

export function listLocalLive2DPackages(root = live2dRoot) {
  if (!fs.existsSync(root)) return [];

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "starter-avatar")
    .map((entry) => entry.name)
    .filter(isSafePackageId)
    .sort();
}

export function validateLive2DPackage(input: {
  packageId: string;
  root?: string;
}): Live2DPackageManifest {
  const packageId = normalizePackageId(input.packageId);
  const root = input.root ?? live2dRoot;
  const packagePath = path.join(root, packageId);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isSafePackageId(packageId)) {
    errors.push("Invalid Live2D package id");
  }

  const modelJsonCandidates = isSafePackageId(packageId)
    ? listFilesByExtension(packagePath, ".model3.json")
    : [];
  const modelJsonPath =
    modelJsonCandidates.find((item) => item === `${packageId}.model3.json`) ??
    modelJsonCandidates[0];

  if (!modelJsonPath) {
    errors.push("Missing .model3.json entrypoint");
  }

  let modelJson: Live2DModelJson | null = null;
  if (modelJsonPath) {
    try {
      modelJson = readModelJson(packagePath, modelJsonPath);
    } catch {
      errors.push("Invalid model3.json");
    }
  }

  const references = modelJson?.FileReferences ?? {};
  const moc = references.Moc
    ? toAssetFile({ packageId, packagePath, relativePath: references.Moc })
    : null;
  const entrypoint = modelJsonPath
    ? toAssetFile({ packageId, packagePath, relativePath: modelJsonPath })
    : null;

  if (!moc) errors.push("Missing referenced .moc3 file");
  if (!entrypoint) errors.push("Missing readable model3.json entrypoint");

  const textures = (references.Textures ?? [])
    .map((relativePath) => toAssetFile({ packageId, packagePath, relativePath }))
    .filter((file): file is Live2DAssetFile => Boolean(file));

  if ((references.Textures ?? []).length === 0) {
    errors.push("Missing texture references");
  }
  if (textures.length !== (references.Textures ?? []).length) {
    errors.push("One or more referenced texture files are missing");
  }

  const referencedMotionPaths = unique(
    Object.values(references.Motions ?? {})
      .flat()
      .map((motion) => motion.File),
  );
  const scannedMotionPaths = listFilesByExtension(packagePath, ".motion3.json");
  const motions = unique([...referencedMotionPaths, ...scannedMotionPaths])
    .map((relativePath) => toAssetFile({ packageId, packagePath, relativePath }))
    .filter((file): file is Live2DAssetFile => Boolean(file));

  const referencedExpressionPaths = unique(
    (references.Expressions ?? []).map((expression) => expression.File),
  );
  const scannedExpressionPaths = listFilesByExtension(packagePath, ".exp3.json");
  const expressions = unique([
    ...referencedExpressionPaths,
    ...scannedExpressionPaths,
  ])
    .map((relativePath) => toAssetFile({ packageId, packagePath, relativePath }))
    .filter((file): file is Live2DAssetFile => Boolean(file));

  const physics = references.Physics
    ? toAssetFile({ packageId, packagePath, relativePath: references.Physics })
    : null;
  const displayInfo = references.DisplayInfo
    ? toAssetFile({
        packageId,
        packagePath,
        relativePath: references.DisplayInfo,
      })
    : null;
  const vtubePath = listFilesByExtension(packagePath, ".vtube.json")[0];
  const vtube = vtubePath
    ? toAssetFile({ packageId, packagePath, relativePath: vtubePath })
    : null;

  if (!physics) warnings.push("Physics file is not configured");
  if (motions.length === 0) warnings.push("No motion3 files found");
  if (expressions.length === 0) warnings.push("No expression files found");

  const files = [
    entrypoint,
    moc,
    ...textures,
    physics,
    displayInfo,
    vtube,
    ...motions,
    ...expressions,
  ].filter((file): file is Live2DAssetFile => Boolean(file));

  return {
    displayInfo: displayInfo ?? undefined,
    entrypoint:
      entrypoint ??
      ({
        mimeType: "application/json",
        path: modelJsonPath ?? "",
        size: 0,
        url: getPublicUrl(packageId, modelJsonPath ?? ""),
      } satisfies Live2DAssetFile),
    errors,
    expressions,
    files,
    moc: moc ?? undefined,
    motions,
    name: packageId,
    packageId,
    physics: physics ?? undefined,
    rootUrl: getPublicUrl(packageId),
    textures,
    valid: errors.length === 0,
    vtube: vtube ?? undefined,
    warnings,
  };
}

export function getDefaultLive2DPackage(root = live2dRoot) {
  for (const packageId of listLocalLive2DPackages(root)) {
    const manifest = validateLive2DPackage({ packageId, root });
    if (manifest.valid) return manifest;
  }

  return null;
}
