import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import type { MemoryListQuery, MemoryWriteInput } from "./schema";

export const characterMemoryInclude = {
  sourceConversation: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
} as const satisfies Prisma.CharacterMemoryInclude;

export type CharacterMemoryRecord = Prisma.CharacterMemoryGetPayload<{
  include: typeof characterMemoryInclude;
}>;

function toInputJson(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function ensureOwnedCharacter(
  tx: Prisma.TransactionClient,
  characterId: string,
  userId: string,
) {
  const character = await tx.characterProfile.findFirst({
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

  if (!character) throw new Error("Character not found");
  return character.id;
}

async function ensureOwnedConversation(
  tx: Prisma.TransactionClient,
  conversationId: string | null | undefined,
  userId: string,
) {
  if (conversationId === undefined) return undefined;
  if (!conversationId) return null;

  const conversation = await tx.conversation.findFirst({
    select: {
      id: true,
    },
    where: {
      id: conversationId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });

  if (!conversation) throw new Error("Source conversation not found");
  return conversation.id;
}

function createMemoryWhere(
  characterId: string,
  input: MemoryListQuery,
  userId: string,
) {
  const where: Prisma.CharacterMemoryWhereInput = {
    characterId,
    status: input.status ?? {
      not: "deleted",
    },
    userId,
  };

  if (input.type) where.type = input.type;
  return where;
}

export async function listCharacterMemories(
  characterId: string,
  input: MemoryListQuery = {},
  userId = DEFAULT_USER_ID,
) {
  await ensureDefaultUser();
  const prisma = getPrismaClient();

  return prisma.characterMemory.findMany({
    include: characterMemoryInclude,
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: input.limit ?? 50,
    where: createMemoryWhere(characterId, input, userId),
  });
}

export async function createCharacterMemory(
  characterId: string,
  input: MemoryWriteInput & { content: string },
): Promise<CharacterMemoryRecord> {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  const memoryId = await prisma.$transaction(async (tx) => {
    await ensureOwnedCharacter(tx, characterId, user.id);
    const sourceConversationId = await ensureOwnedConversation(
      tx,
      input.sourceConversationId,
      user.id,
    );

    const memory = await tx.characterMemory.create({
      data: {
        characterId,
        confidence: input.confidence,
        content: input.content,
        expiresAt: input.expiresAt,
        metadata: toInputJson(input.metadata),
        source: input.source || "manual",
        sourceConversationId,
        status: input.status ?? "active",
        type: input.type ?? "long_term",
        userId: user.id,
      },
    });

    return memory.id;
  });

  const memory = await getCharacterMemory(characterId, memoryId, user.id);
  if (!memory) throw new Error("Memory was not found after create");
  return memory;
}

export async function getCharacterMemory(
  characterId: string,
  memoryId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.characterMemory.findFirst({
    include: characterMemoryInclude,
    where: {
      characterId,
      id: memoryId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function updateCharacterMemory(
  characterId: string,
  memoryId: string,
  input: MemoryWriteInput,
  userId = DEFAULT_USER_ID,
): Promise<CharacterMemoryRecord | null> {
  const prisma = getPrismaClient();

  const updatedMemoryId = await prisma.$transaction(async (tx) => {
    const current = await tx.characterMemory.findFirst({
      select: {
        id: true,
      },
      where: {
        character: {
          id: characterId,
          status: {
            not: "deleted",
          },
          userId,
        },
        id: memoryId,
        status: {
          not: "deleted",
        },
        userId,
      },
    });

    if (!current) return null;

    const sourceConversationId = await ensureOwnedConversation(
      tx,
      input.sourceConversationId,
      userId,
    );

    const memory = await tx.characterMemory.update({
      data: {
        confidence: input.confidence,
        content: input.content,
        expiresAt: input.expiresAt,
        metadata: toInputJson(input.metadata),
        source: input.source,
        sourceConversationId,
        status: input.status,
        type: input.type,
      },
      where: {
        id: memoryId,
      },
    });

    return memory.id;
  });

  if (!updatedMemoryId) return null;

  return prisma.characterMemory.findFirst({
    include: characterMemoryInclude,
    where: {
      characterId,
      id: updatedMemoryId,
      userId,
    },
  });
}

export async function deleteCharacterMemory(
  characterId: string,
  memoryId: string,
  userId = DEFAULT_USER_ID,
) {
  return updateCharacterMemory(
    characterId,
    memoryId,
    {
      status: "deleted",
    },
    userId,
  );
}

export async function listActiveCharacterMemoriesForPrompt(
  characterId: string | undefined,
  userId = DEFAULT_USER_ID,
) {
  if (!characterId) return [];

  const prisma = getPrismaClient();
  const now = new Date();

  return prisma.characterMemory.findMany({
    orderBy: [
      {
        confidence: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: 12,
    where: {
      character: {
        id: characterId,
        status: {
          not: "deleted",
        },
        userId,
      },
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: now,
          },
        },
      ],
      status: "active",
      userId,
    },
  });
}
