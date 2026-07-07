import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_USER_ID,
  ensureDefaultUser,
} from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import type {
  WorkflowListQuery,
  WorkflowRunInput,
  WorkflowWriteInput,
} from "./schema";

export const characterWorkflowInclude = {
  executions: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  },
} as const satisfies Prisma.CharacterWorkflowInclude;

export type CharacterWorkflowRecord = Prisma.CharacterWorkflowGetPayload<{
  include: typeof characterWorkflowInclude;
}>;

export type CharacterWorkflowExecutionRecord =
  Prisma.CharacterWorkflowExecutionGetPayload<object>;

function toInputJson(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toRequiredInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? [])) as Prisma.InputJsonValue;
}

function requiresConfirmation(permission: unknown) {
  return Boolean(
    permission &&
      typeof permission === "object" &&
      (permission as Record<string, unknown>).requiresConfirmation === true,
  );
}

function hasRunnableSteps(steps: unknown) {
  return Array.isArray(steps) && steps.length > 0;
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

  if (!conversation) throw new Error("Conversation not found");
  return conversation.id;
}

export async function listCharacterWorkflows(
  characterId: string,
  input: WorkflowListQuery = {},
  userId = DEFAULT_USER_ID,
) {
  await ensureDefaultUser();
  const prisma = getPrismaClient();

  return prisma.characterWorkflow.findMany({
    include: characterWorkflowInclude,
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: input.limit ?? 50,
    where: {
      characterId,
      status: input.status ?? {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function createCharacterWorkflow(
  characterId: string,
  input: WorkflowWriteInput & { name: string; steps: unknown },
): Promise<CharacterWorkflowRecord> {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  const workflowId = await prisma.$transaction(async (tx) => {
    await ensureOwnedCharacter(tx, characterId, user.id);

    const workflow = await tx.characterWorkflow.create({
      data: {
        characterId,
        description: input.description,
        name: input.name,
        permission: toInputJson(input.permission),
        status: input.status ?? "active",
        steps: toRequiredInputJson(input.steps),
        trigger: toInputJson(input.trigger),
        userId: user.id,
      },
    });

    return workflow.id;
  });

  const workflow = await getCharacterWorkflow(characterId, workflowId, user.id);
  if (!workflow) throw new Error("Workflow was not found after create");
  return workflow;
}

export async function getCharacterWorkflow(
  characterId: string,
  workflowId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.characterWorkflow.findFirst({
    include: characterWorkflowInclude,
    where: {
      characterId,
      id: workflowId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function updateCharacterWorkflow(
  characterId: string,
  workflowId: string,
  input: WorkflowWriteInput,
  userId = DEFAULT_USER_ID,
): Promise<CharacterWorkflowRecord | null> {
  const prisma = getPrismaClient();
  const updated = await prisma.characterWorkflow.updateMany({
    data: {
      description: input.description,
      name: input.name,
      permission: toInputJson(input.permission),
      status: input.status,
      steps:
        input.steps === undefined || input.steps === null
          ? undefined
          : toRequiredInputJson(input.steps),
      trigger: toInputJson(input.trigger),
    },
    where: {
      character: {
        id: characterId,
        status: {
          not: "deleted",
        },
        userId,
      },
      id: workflowId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });

  if (updated.count === 0) return null;

  return prisma.characterWorkflow.findFirst({
    include: characterWorkflowInclude,
    where: {
      characterId,
      id: workflowId,
      userId,
    },
  });
}

export async function runCharacterWorkflow(
  characterId: string,
  workflowId: string,
  input: WorkflowRunInput,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  return prisma.$transaction(async (tx) => {
    const workflow = await tx.characterWorkflow.findFirst({
      where: {
        character: {
          id: characterId,
          status: {
            not: "deleted",
          },
          userId,
        },
        id: workflowId,
        status: "active",
        userId,
      },
    });

    if (!workflow) return null;

    const conversationId = await ensureOwnedConversation(
      tx,
      input.conversationId,
      user.id,
    );
    const confirmationRequired = requiresConfirmation(workflow.permission);

    if (confirmationRequired && !input.confirm) {
      return tx.characterWorkflowExecution.create({
        data: {
          characterId,
          conversationId,
          input: toInputJson(input.input),
          requiresConfirmation: true,
          status: "waiting_confirmation",
          userId: user.id,
          workflowId,
        },
      });
    }

    const startedAt = new Date();

    if (!hasRunnableSteps(workflow.steps)) {
      return tx.characterWorkflowExecution.create({
        data: {
          characterId,
          completedAt: new Date(),
          conversationId,
          errorMessage: "Workflow has no runnable steps",
          input: toInputJson(input.input),
          requiresConfirmation: confirmationRequired,
          startedAt,
          status: "failed",
          userId: user.id,
          workflowId,
        },
      });
    }

    return tx.characterWorkflowExecution.create({
      data: {
        characterId,
        completedAt: new Date(),
        conversationId,
        input: toInputJson(input.input),
        output: toInputJson({
          mode: "manual",
          message: "Workflow execution recorded",
          stepCount: Array.isArray(workflow.steps) ? workflow.steps.length : 0,
        }),
        requiresConfirmation: confirmationRequired,
        startedAt,
        status: "success",
        userId: user.id,
        workflowId,
      },
    });
  });
}
