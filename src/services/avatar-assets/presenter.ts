import type { AvatarAsset } from "@/generated/prisma/client";

export function presentAvatarAsset(asset: AvatarAsset) {
  return {
    id: asset.id,
    profileId: asset.profileId,
    type: asset.type,
    name: asset.name,
    status: asset.status,
    source: asset.source,
    storageKey: asset.storageKey,
    publicUrl: asset.publicUrl,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    metadata: asset.metadata,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}
