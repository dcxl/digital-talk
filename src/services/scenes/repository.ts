import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import type {
  SceneBindingWriteInput,
  SceneListQuery,
  SceneWriteInput,
} from "./schema";

export const characterSceneInclude = {
  _count: {
    select: {
      bindings: true,
      conversations: true,
    },
  },
  knowledgeBase: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  promptTemplate: {
    select: {
      id: true,
      name: true,
      status: true,
      type: true,
    },
  },
} as const satisfies Prisma.CharacterSceneInclude;

export const characterSceneBindingInclude = {
  scene: {
    include: characterSceneInclude,
  },
} as const satisfies Prisma.CharacterSceneBindingInclude;

export type CharacterSceneRecord = Prisma.CharacterSceneGetPayload<{
  include: typeof characterSceneInclude;
}>;

export type CharacterSceneBindingRecord =
  Prisma.CharacterSceneBindingGetPayload<{
    include: typeof characterSceneBindingInclude;
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

  if (!prompt) throw new Error("Prompt template not found");
  return resolvedId;
}

async function ensureOwnedKnowledgeBase(
  tx: Prisma.TransactionClient,
  knowledgeBaseId: string | null | undefined,
  userId: string,
) {
  const resolvedId = toDatabaseId(knowledgeBaseId);
  if (!resolvedId) return resolvedId;

  const knowledgeBase = await tx.knowledgeBase.findFirst({
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

  if (!knowledgeBase) throw new Error("Knowledge base not found");
  return resolvedId;
}

function createSceneSearchWhere(input: SceneListQuery, userId: string) {
  const where: Prisma.CharacterSceneWhereInput = {
    status: input.status ?? {
      not: "deleted",
    },
    userId,
  };

  if (input.type) where.type = input.type;

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

export async function listScenes(
  input: SceneListQuery = {},
  userId = DEFAULT_USER_ID,
) {
  await ensureDefaultUser();
  const prisma = getPrismaClient();

  return prisma.characterScene.findMany({
    include: characterSceneInclude,
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: input.limit ?? 50,
    where: createSceneSearchWhere(input, userId),
  });
}

export async function getScene(sceneId: string, userId = DEFAULT_USER_ID) {
  const prisma = getPrismaClient();

  return prisma.characterScene.findFirst({
    include: characterSceneInclude,
    where: {
      id: sceneId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function createScene(
  input: SceneWriteInput & { name: string },
): Promise<CharacterSceneRecord> {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  const sceneId = await prisma.$transaction(async (tx) => {
    const promptTemplateId = await ensureOwnedPromptTemplate(
      tx,
      input.promptTemplateId,
      user.id,
    );
    const knowledgeBaseId = await ensureOwnedKnowledgeBase(
      tx,
      input.knowledgeBaseId,
      user.id,
    );

    const scene = await tx.characterScene.create({
      data: {
        description: input.description,
        inputMode: input.inputMode || "text",
        knowledgeBaseId,
        name: input.name,
        outputMode: input.outputMode || "text",
        promptTemplateId,
        status: input.status ?? "active",
        type: input.type ?? "custom",
        userId: user.id,
        workflowPolicy: toInputJson(input.workflowPolicy),
      },
    });

    return scene.id;
  });

  const scene = await getScene(sceneId, user.id);
  if (!scene) throw new Error("Scene was not found after create");
  return scene;
}

export async function updateScene(
  sceneId: string,
  input: SceneWriteInput,
  userId = DEFAULT_USER_ID,
): Promise<CharacterSceneRecord | null> {
  const prisma = getPrismaClient();

  const updatedSceneId = await prisma.$transaction(async (tx) => {
    const current = await tx.characterScene.findFirst({
      select: {
        id: true,
      },
      where: {
        id: sceneId,
        status: {
          not: "deleted",
        },
        userId,
      },
    });

    if (!current) return null;

    const promptTemplateId = await ensureOwnedPromptTemplate(
      tx,
      input.promptTemplateId,
      userId,
    );
    const knowledgeBaseId = await ensureOwnedKnowledgeBase(
      tx,
      input.knowledgeBaseId,
      userId,
    );

    const scene = await tx.characterScene.update({
      data: {
        description: input.description,
        inputMode: input.inputMode,
        knowledgeBaseId,
        name: input.name,
        outputMode: input.outputMode,
        promptTemplateId,
        status: input.status,
        type: input.type,
        workflowPolicy: toInputJson(input.workflowPolicy),
      },
      where: {
        id: sceneId,
      },
    });

    return scene.id;
  });

  if (!updatedSceneId) return null;
  return prisma.characterScene.findFirst({
    include: characterSceneInclude,
    where: {
      id: updatedSceneId,
      userId,
    },
  });
}

export async function bindSceneToCharacter(
  characterId: string,
  sceneId: string,
  input: SceneBindingWriteInput,
  userId = DEFAULT_USER_ID,
): Promise<CharacterSceneBindingRecord | null> {
  const prisma = getPrismaClient();

  const bindingId = await prisma.$transaction(async (tx) => {
    const [character, scene] = await Promise.all([
      tx.characterProfile.findFirst({
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
      }),
      tx.characterScene.findFirst({
        select: {
          id: true,
        },
        where: {
          id: sceneId,
          status: {
            not: "deleted",
          },
          userId,
        },
      }),
    ]);

    if (!character || !scene) return null;

    if (input.isDefault) {
      await tx.characterSceneBinding.updateMany({
        data: {
          isDefault: false,
        },
        where: {
          characterId,
        },
      });
    }

    const binding = await tx.characterSceneBinding.upsert({
      create: {
        characterId,
        config: toInputJson(input.config),
        enabled: input.enabled ?? true,
        isDefault: input.isDefault ?? false,
        sceneId,
      },
      update: {
        config: toInputJson(input.config),
        enabled: input.enabled,
        isDefault: input.isDefault,
      },
      where: {
        characterId_sceneId: {
          characterId,
          sceneId,
        },
      },
    });

    return binding.id;
  });

  if (!bindingId) return null;

  return prisma.characterSceneBinding.findUnique({
    include: characterSceneBindingInclude,
    where: {
      id: bindingId,
    },
  });
}

export async function unbindSceneFromCharacter(
  characterId: string,
  sceneId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();
  const binding = await prisma.characterSceneBinding.findFirst({
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
      scene: {
        id: sceneId,
        userId,
      },
    },
  });

  if (!binding) return false;

  await prisma.characterSceneBinding.delete({
    where: {
      id: binding.id,
    },
  });

  return true;
}
