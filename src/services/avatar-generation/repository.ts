import type {
  AvatarGenerationJobStatus,
  Prisma,
} from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";

export const avatarGenerationJobInclude = {
  resultAsset: true,
};

export interface CreateAvatarGenerationJobInput {
  negativePrompt?: string | null;
  profileId?: string | null;
  prompt: string;
  providerConfigId?: string | null;
  status?: AvatarGenerationJobStatus;
  style?: string | null;
  userId?: string;
}

export interface ListAvatarGenerationJobsInput {
  profileId?: string;
  status?: AvatarGenerationJobStatus;
  userId?: string;
}

function toDatabaseProviderConfigId(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (!value || value.startsWith("env-")) return null;
  return value;
}

export async function createAvatarGenerationJob(
  input: CreateAvatarGenerationJobInput,
) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  return prisma.avatarGenerationJob.create({
    data: {
      negativePrompt: input.negativePrompt,
      profileId: input.profileId || null,
      prompt: input.prompt,
      providerConfigId: toDatabaseProviderConfigId(input.providerConfigId),
      status: input.status ?? "pending",
      style: input.style,
      userId: input.userId ?? user.id,
    },
    include: avatarGenerationJobInclude,
  });
}

export async function listAvatarGenerationJobs(
  input: ListAvatarGenerationJobsInput = {},
) {
  const prisma = getPrismaClient();

  return prisma.avatarGenerationJob.findMany({
    include: avatarGenerationJobInclude,
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      profileId: input.profileId,
      status: input.status,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}

export async function getAvatarGenerationJob(
  jobId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.avatarGenerationJob.findFirst({
    include: avatarGenerationJobInclude,
    where: {
      id: jobId,
      userId,
    },
  });
}

export async function updateAvatarGenerationJob(input: {
  completedAt?: Date | null;
  errorMessage?: string | null;
  jobId: string;
  resultAssetId?: string | null;
  startedAt?: Date | null;
  status: AvatarGenerationJobStatus;
  userId?: string;
}) {
  const prisma = getPrismaClient();
  const data: Prisma.AvatarGenerationJobUpdateInput = {
    status: input.status,
  };

  if (input.completedAt !== undefined) data.completedAt = input.completedAt;
  if (input.errorMessage !== undefined) data.errorMessage = input.errorMessage;
  if (input.resultAssetId !== undefined) {
    data.resultAsset = input.resultAssetId
      ? {
          connect: {
            id: input.resultAssetId,
          },
        }
      : {
          disconnect: true,
        };
  }
  if (input.startedAt !== undefined) data.startedAt = input.startedAt;

  return prisma.avatarGenerationJob.update({
    data,
    include: avatarGenerationJobInclude,
    where: {
      id: input.jobId,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}
