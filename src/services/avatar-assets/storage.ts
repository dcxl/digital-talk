import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoreAvatarAssetInput {
  bytes: ArrayBuffer | Buffer | Uint8Array;
  mimeType: string;
  originalName?: string;
  userId: string;
}

export interface StoredAvatarAsset {
  publicUrl?: string;
  size: number;
  storageKey: string;
}

export interface AvatarAssetStorage {
  put(input: StoreAvatarAssetInput): Promise<StoredAvatarAsset>;
}

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getStorageRoot() {
  return (
    process.env.AVATAR_ASSET_STORAGE_DIR ||
    path.join(process.cwd(), "storage", "avatar-assets")
  );
}

function getExtension(input: StoreAvatarAssetInput) {
  const fromMimeType = extensionByMimeType[input.mimeType];
  if (fromMimeType) return fromMimeType;

  const fromName = input.originalName
    ? path.extname(input.originalName).replace(".", "")
    : "";
  return fromName || "bin";
}

function toBuffer(bytes: StoreAvatarAssetInput["bytes"]) {
  if (Buffer.isBuffer(bytes)) return bytes;
  if (bytes instanceof ArrayBuffer) return Buffer.from(new Uint8Array(bytes));
  return Buffer.from(bytes);
}

class LocalAvatarAssetStorage implements AvatarAssetStorage {
  async put(input: StoreAvatarAssetInput) {
    const buffer = toBuffer(input.bytes);
    const date = new Date().toISOString().slice(0, 10);
    const extension = getExtension(input);
    const storageKey = `${input.userId}/${date}/${randomUUID()}.${extension}`;
    const filePath = path.join(getStorageRoot(), storageKey);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);

    return {
      size: buffer.byteLength,
      storageKey,
    };
  }
}

export function getAvatarAssetStorage(): AvatarAssetStorage {
  return new LocalAvatarAssetStorage();
}
