import type { Prisma, PromptType } from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import {
  DEFAULT_SYSTEM_PROMPT,
  defaultPromptVariables,
} from "./defaults";

const promptInclude = {
  currentVersion: true,
  versions: {
    orderBy: {
      version: "desc" as const,
    },
    take: 20,
  },
};

export interface CreatePromptTemplateInput {
  content: string;
  description?: string;
  name: string;
  type: PromptType;
  variables?: unknown;
}

export interface CreatePromptVersionInput {
  changelog?: string;
  content: string;
  promptTemplateId: string;
  setCurrent?: boolean;
  variables?: unknown;
}

export interface ListPromptTemplatesInput {
  type?: PromptType;
  userId?: string;
}

function toInputJson(value: unknown) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function ensureDefaultSystemPrompt(userId = DEFAULT_USER_ID) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();
  const resolvedUserId = userId || user.id;

  const existing = await prisma.promptTemplate.findFirst({
    include: promptInclude,
    where: {
      name: "System Prompt",
      type: "system",
      userId: resolvedUserId,
    },
  });

  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const template = await tx.promptTemplate.create({
      data: {
        description: "默认系统提示词",
        name: "System Prompt",
        status: "active",
        type: "system",
        userId: resolvedUserId,
        variables: toInputJson(defaultPromptVariables),
      },
    });
    const version = await tx.promptVersion.create({
      data: {
        changelog: "Initial version",
        content: DEFAULT_SYSTEM_PROMPT,
        createdByUserId: user.id,
        promptTemplateId: template.id,
        variables: toInputJson(defaultPromptVariables),
        version: 1,
      },
    });

    return tx.promptTemplate.update({
      data: {
        currentVersionId: version.id,
      },
      include: promptInclude,
      where: {
        id: template.id,
      },
    });
  });
}

export async function listPromptTemplates(input: ListPromptTemplatesInput = {}) {
  await ensureDefaultSystemPrompt(input.userId);

  const prisma = getPrismaClient();

  return prisma.promptTemplate.findMany({
    include: promptInclude,
    orderBy: [
      {
        type: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
    where: {
      status: {
        not: "deleted",
      },
      type: input.type,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}

export async function createPromptTemplate(input: CreatePromptTemplateInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  return prisma.$transaction(async (tx) => {
    const template = await tx.promptTemplate.create({
      data: {
        description: input.description,
        name: input.name,
        status: "active",
        type: input.type,
        userId: user.id,
        variables: toInputJson(input.variables),
      },
    });
    const version = await tx.promptVersion.create({
      data: {
        changelog: "Initial version",
        content: input.content,
        createdByUserId: user.id,
        promptTemplateId: template.id,
        variables: toInputJson(input.variables),
        version: 1,
      },
    });

    return tx.promptTemplate.update({
      data: {
        currentVersionId: version.id,
      },
      include: promptInclude,
      where: {
        id: template.id,
      },
    });
  });
}

export async function createPromptVersion(input: CreatePromptVersionInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();
  const template = await prisma.promptTemplate.findFirst({
    where: {
      id: input.promptTemplateId,
      status: {
        not: "deleted",
      },
      userId: user.id,
    },
  });

  if (!template) throw new Error("Prompt not found");

  return prisma.$transaction(async (tx) => {
    const latest = await tx.promptVersion.aggregate({
      _max: {
        version: true,
      },
      where: {
        promptTemplateId: input.promptTemplateId,
      },
    });
    const versionNumber = (latest._max.version ?? 0) + 1;
    const version = await tx.promptVersion.create({
      data: {
        changelog: input.changelog,
        content: input.content,
        createdByUserId: user.id,
        promptTemplateId: input.promptTemplateId,
        variables: toInputJson(input.variables),
        version: versionNumber,
      },
    });
    const updateData: Prisma.PromptTemplateUncheckedUpdateInput = {
      currentVersionId:
        input.setCurrent === false ? template.currentVersionId : version.id,
    };
    if (input.variables !== undefined) {
      updateData.variables = toInputJson(input.variables);
    }

    return tx.promptTemplate.update({
      data: updateData,
      include: promptInclude,
      where: {
        id: input.promptTemplateId,
      },
    });
  });
}

export async function getPromptTemplate(promptTemplateId: string) {
  const prisma = getPrismaClient();

  return prisma.promptTemplate.findFirst({
    include: promptInclude,
    where: {
      id: promptTemplateId,
      status: {
        not: "deleted",
      },
      userId: DEFAULT_USER_ID,
    },
  });
}

export async function getCurrentPromptTemplateByType(type: PromptType) {
  await ensureDefaultSystemPrompt();

  const prisma = getPrismaClient();

  return prisma.promptTemplate.findFirst({
    include: promptInclude,
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      status: "active",
      type,
      userId: DEFAULT_USER_ID,
    },
  });
}
