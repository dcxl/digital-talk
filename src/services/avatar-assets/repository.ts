import type {
  AvatarAssetSource,
  AvatarAssetStatus,
  AvatarAssetType,
  Prisma,
} from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";

export interface CreateAvatarAssetInput {
  height?: number;
  metadata?: unknown;
  mimeType: string;
  name: string;
  profileId?: string;
  publicUrl?: string;
  size: number;
  source: AvatarAssetSource;
  status?: AvatarAssetStatus;
  storageKey: string;
  type?: AvatarAssetType;
  userId?: string;
  width?: number;
}

export interface ListAvatarAssetsInput {
  profileId?: string;
  status?: AvatarAssetStatus;
  type?: AvatarAssetType;
  userId?: string;
}

export interface UpdateAvatarAssetInput {
  assetId: string;
  height?: number | null;
  metadata?: unknown;
  name?: string;
  profileId?: string | null;
  publicUrl?: string | null;
  status?: AvatarAssetStatus;
  userId?: string;
  width?: number | null;
}

function toInputJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function createAvatarAsset(input: CreateAvatarAssetInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  return prisma.avatarAsset.create({
    data: {
      height: input.height,
      metadata:
        input.metadata === undefined ? undefined : toInputJson(input.metadata),
      mimeType: input.mimeType,
      name: input.name,
      profileId: input.profileId,
      publicUrl: input.publicUrl,
      size: input.size,
      source: input.source,
      status: input.status ?? "active",
      storageKey: input.storageKey,
      type: input.type ?? "image",
      userId: input.userId ?? user.id,
      width: input.width,
    },
  });
}

export async function listAvatarAssets(input: ListAvatarAssetsInput = {}) {
  const prisma = getPrismaClient();

  return prisma.avatarAsset.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      profileId: input.profileId,
      status: input.status ?? "active",
      type: input.type,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}

export async function getAvatarAsset(
  assetId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.avatarAsset.findFirst({
    where: {
      id: assetId,
      userId,
    },
  });
}

export async function softDeleteAvatarAsset(
  assetId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.avatarAsset.update({
    data: {
      status: "deleted",
    },
    where: {
      id: assetId,
      userId,
    },
  });
}

export async function updateAvatarAsset(input: UpdateAvatarAssetInput) {
  const prisma = getPrismaClient();
  const data: Prisma.AvatarAssetUncheckedUpdateInput = {};

  if (input.height !== undefined) data.height = input.height;
  if (input.metadata !== undefined) {
    data.metadata =
      input.metadata === null ? undefined : toInputJson(input.metadata);
  }
  if (input.name !== undefined) data.name = input.name;
  if (input.profileId !== undefined) data.profileId = input.profileId;
  if (input.publicUrl !== undefined) data.publicUrl = input.publicUrl;
  if (input.status !== undefined) data.status = input.status;
  if (input.width !== undefined) data.width = input.width;

  return prisma.avatarAsset.update({
    data,
    where: {
      id: input.assetId,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}
