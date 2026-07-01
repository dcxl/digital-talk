import type {
  AvatarDriver,
  AvatarProfileStatus,
  Prisma,
} from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import { defaultAvatarConfig } from "./defaults";

const avatarProfileInclude = {
  providerConfig: true,
  voiceProvider: true,
};

export interface UpsertAvatarProfileInput {
  background?: string | null;
  config?: unknown;
  driver: AvatarDriver;
  id?: string;
  isDefault?: boolean;
  language?: string | null;
  name: string;
  previewImageUrl?: string | null;
  providerConfigId?: string | null;
  status?: AvatarProfileStatus;
  voice?: string | null;
  voiceProviderId?: string | null;
}

function toInputJson(value: unknown) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function ensureDefaultAvatarProfile(userId = DEFAULT_USER_ID) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();
  const resolvedUserId = userId || user.id;

  const existing = await prisma.avatarProfile.findFirst({
    include: avatarProfileInclude,
    where: {
      status: {
        not: "deleted",
      },
      userId: resolvedUserId,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  if (existing) return existing;

  return prisma.avatarProfile.create({
    data: {
      background: "studio",
      config: toInputJson(defaultAvatarConfig),
      driver: "static",
      isDefault: true,
      language: "zh-CN",
      name: "Emily",
      status: "active",
      voice: "default",
      userId: resolvedUserId,
    },
    include: avatarProfileInclude,
  });
}

export async function listAvatarProfiles(userId = DEFAULT_USER_ID) {
  await ensureDefaultAvatarProfile(userId);

  const prisma = getPrismaClient();

  return prisma.avatarProfile.findMany({
    include: avatarProfileInclude,
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    where: {
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function getAvatarProfile(
  avatarProfileId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.avatarProfile.findFirst({
    include: avatarProfileInclude,
    where: {
      id: avatarProfileId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function upsertAvatarProfile(input: UpsertAvatarProfileInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.avatarProfile.updateMany({
        data: {
          isDefault: false,
        },
        where: {
          userId: user.id,
        },
      });
    }

    if (input.id) {
      return tx.avatarProfile.update({
        data: {
          background: input.background,
          config: toInputJson(input.config),
          driver: input.driver,
          isDefault: input.isDefault ?? false,
          language: input.language,
          name: input.name,
          previewImageUrl: input.previewImageUrl,
          providerConfigId: input.providerConfigId,
          status: input.status,
          voice: input.voice,
          voiceProviderId: input.voiceProviderId,
        },
        include: avatarProfileInclude,
        where: {
          id: input.id,
          userId: user.id,
        },
      });
    }

    return tx.avatarProfile.create({
      data: {
        background: input.background,
        config: toInputJson(input.config),
        driver: input.driver,
        isDefault: input.isDefault ?? false,
        language: input.language,
        name: input.name,
        previewImageUrl: input.previewImageUrl,
        providerConfigId: input.providerConfigId,
        status: input.status ?? "active",
        userId: user.id,
        voice: input.voice,
        voiceProviderId: input.voiceProviderId,
      },
      include: avatarProfileInclude,
    });
  });
}
