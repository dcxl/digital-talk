import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import type { CharacterListQuery, CharacterWriteInput } from "./schema";

export const characterProfileInclude = {
  _count: {
    select: {
      conversations: true,
      memories: true,
      workflows: true,
    },
  },
  appearanceProfile: {
    include: {
      assets: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        where: {
          status: "active",
          type: "image",
        },
      },
      providerConfig: true,
      voiceProvider: true,
    },
  },
  personaPrompt: true,
  sceneBindings: {
    include: {
      scene: true,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    where: {
      enabled: true,
    },
  },
  voiceProvider: true,
} as const satisfies Prisma.CharacterProfileInclude;

export type CharacterProfileRecord = Prisma.CharacterProfileGetPayload<{
  include: typeof characterProfileInclude;
}>;

function toInputJson(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toDatabaseId(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (!value || value.startsWith("env-")) return null;
  return value;
}

async function ensureOwnedAppearanceProfile(
  tx: Prisma.TransactionClient,
  appearanceProfileId: string | null | undefined,
  userId: string,
) {
  const resolvedId = toDatabaseId(appearanceProfileId);
  if (!resolvedId) return resolvedId;

  const profile = await tx.avatarProfile.findFirst({
    select: {
      id: true,
    },
    where: {
      id: resolvedId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });

  if (!profile) throw new Error("Appearance profile not found");
  return resolvedId;
}

async function ensureOwnedPromptTemplate(
  tx: Prisma.TransactionClient,
  promptTemplateId: string | null | undefined,
  userId: string,
) {
  const resolvedId = toDatabaseId(promptTemplateId);
  if (!resolvedId) return resolvedId;

  const prompt = await tx.promptTemplate.findFirst({
    select: {
      id: true,
    },
    where: {
      id: resolvedId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });

  if (!prompt) throw new Error("Persona prompt not found");
  return resolvedId;
}

async function ensureOwnedTTSProvider(
  tx: Prisma.TransactionClient,
  providerId: string | null | undefined,
  userId: string,
) {
  const resolvedId = toDatabaseId(providerId);
  if (!resolvedId) return resolvedId;

  const provider = await tx.providerConfig.findFirst({
    select: {
      id: true,
    },
    where: {
      id: resolvedId,
      type: "tts",
      userId,
    },
  });

  if (!provider) throw new Error("Voice provider not found");
  return resolvedId;
}

function createSearchWhere(input: CharacterListQuery, userId: string) {
  const where: Prisma.CharacterProfileWhereInput = {
    status: input.status ?? {
      not: "deleted",
    },
    userId,
  };

  if (input.roleType) where.roleType = input.roleType;

  if (input.q) {
    where.OR = [
      {
        name: {
          contains: input.q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: input.q,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
}

export async function listCharacters(
  input: CharacterListQuery = {},
  userId = DEFAULT_USER_ID,
) {
  await ensureDefaultUser();
  const prisma = getPrismaClient();

  return prisma.characterProfile.findMany({
    include: characterProfileInclude,
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: input.limit ?? 20,
    where: createSearchWhere(input, userId),
  });
}

export async function getCharacter(
  characterId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.characterProfile.findFirst({
    include: characterProfileInclude,
    where: {
      id: characterId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function createCharacter(
  input: CharacterWriteInput & { name: string },
): Promise<CharacterProfileRecord> {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  const characterId = await prisma.$transaction(async (tx) => {
    const appearanceProfileId = await ensureOwnedAppearanceProfile(
      tx,
      input.appearanceProfileId,
      user.id,
    );
    const personaPromptId = await ensureOwnedPromptTemplate(
      tx,
      input.personaPromptId,
      user.id,
    );
    const voiceProviderId = await ensureOwnedTTSProvider(
      tx,
      input.voiceProviderId,
      user.id,
    );

    const character = await tx.characterProfile.create({
      data: {
        appearanceProfileId,
        comfyWorkflowConfig: toInputJson(input.comfyWorkflowConfig),
        description: input.description,
        language: input.language,
        memoryPolicy: toInputJson(input.memoryPolicy),
        name: input.name,
        personaPromptId,
        roleType: input.roleType ?? "custom",
        runtimeConfig: toInputJson(input.runtimeConfig),
        status: input.status ?? "draft",
        tags: toInputJson(input.tags),
        userId: user.id,
        voice: input.voice,
        voiceProviderId,
        workflowPolicy: toInputJson(input.workflowPolicy),
      },
    });

    return character.id;
  });

  const character = await getCharacter(characterId, user.id);
  if (!character) throw new Error("Character was not found after create");
  return character;
}

export async function updateCharacter(
  characterId: string,
  input: CharacterWriteInput,
  userId = DEFAULT_USER_ID,
): Promise<CharacterProfileRecord | null> {
  const prisma = getPrismaClient();

  const updatedCharacterId = await prisma.$transaction(async (tx) => {
    const current = await tx.characterProfile.findFirst({
      select: {
        id: true,
      },
      where: {
        id: characterId,
        status: {
          not: "deleted",
        },
        userId,
      },
    });

    if (!current) return null;

    const appearanceProfileId = await ensureOwnedAppearanceProfile(
      tx,
      input.appearanceProfileId,
      userId,
    );
    const personaPromptId = await ensureOwnedPromptTemplate(
      tx,
      input.personaPromptId,
      userId,
    );
    const voiceProviderId = await ensureOwnedTTSProvider(
      tx,
      input.voiceProviderId,
      userId,
    );

    const character = await tx.characterProfile.update({
      data: {
        appearanceProfileId,
        comfyWorkflowConfig: toInputJson(input.comfyWorkflowConfig),
        description: input.description,
        language: input.language,
        memoryPolicy: toInputJson(input.memoryPolicy),
        name: input.name,
        personaPromptId,
        roleType: input.roleType,
        runtimeConfig: toInputJson(input.runtimeConfig),
        status: input.status,
        tags: toInputJson(input.tags),
        voice: input.voice,
        voiceProviderId,
        workflowPolicy: toInputJson(input.workflowPolicy),
      },
      include: characterProfileInclude,
      where: {
        id: characterId,
      },
    });

    return character.id;
  });

  if (!updatedCharacterId) return null;
  return getCharacter(updatedCharacterId, userId);
}

export async function deleteCharacter(
  characterId: string,
  userId = DEFAULT_USER_ID,
): Promise<CharacterProfileRecord | null> {
  const prisma = getPrismaClient();
  const result = await prisma.characterProfile.updateMany({
    data: {
      status: "deleted",
    },
    where: {
      id: characterId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });

  if (result.count === 0) return null;

  return prisma.characterProfile.findFirst({
    include: characterProfileInclude,
    where: {
      id: characterId,
      userId,
    },
  });
}
