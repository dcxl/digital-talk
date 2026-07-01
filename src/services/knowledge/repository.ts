import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/services/database/prisma";
import { DEFAULT_USER_ID, ensureDefaultUser } from "@/services/conversations/repository";

export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
}

export interface CreateDocumentInput {
  knowledgeBaseId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  content?: string;
  metadata?: Prisma.InputJsonValue;
}

export function estimateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.length / 4));
}

export async function listKnowledgeBases(userId = DEFAULT_USER_ID) {
  const prisma = getPrismaClient();

  return prisma.knowledgeBase.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function createKnowledgeBase(input: CreateKnowledgeBaseInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  return prisma.knowledgeBase.create({
    data: {
      description: input.description,
      name: input.name,
      userId: user.id,
    },
  });
}

export async function getKnowledgeBase(
  knowledgeBaseId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.knowledgeBase.findFirst({
    where: {
      id: knowledgeBaseId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function listDocuments(knowledgeBaseId: string) {
  const prisma = getPrismaClient();

  return prisma.document.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      knowledgeBaseId,
    },
  });
}

export async function createDocument(input: CreateDocumentInput) {
  const prisma = getPrismaClient();
  const content = input.content?.trim();

  return prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        chunkCount: content ? 1 : 0,
        knowledgeBaseId: input.knowledgeBaseId,
        mimeType: input.mimeType,
        name: input.name,
        originalName: input.originalName,
        size: input.size,
        status: content ? "chunked" : "uploaded",
        storageKey: input.storageKey,
      },
    });

    if (content) {
      await tx.documentChunk.create({
        data: {
          chunkIndex: 0,
          content,
          documentId: document.id,
          knowledgeBaseId: input.knowledgeBaseId,
          metadata: input.metadata,
          tokenCount: estimateTokenCount(content),
        },
      });
    }

    await tx.knowledgeBase.update({
      data: {
        chunkCount: {
          increment: content ? 1 : 0,
        },
        documentCount: {
          increment: 1,
        },
      },
      where: {
        id: input.knowledgeBaseId,
      },
    });

    return document;
  });
}

export async function searchDocumentChunks(input: {
  knowledgeBaseId: string;
  limit?: number;
  query: string;
}) {
  const prisma = getPrismaClient();
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 20);

  return prisma.documentChunk.findMany({
    include: {
      document: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    where: {
      content: {
        contains: input.query,
        mode: "insensitive",
      },
      knowledgeBaseId: input.knowledgeBaseId,
    },
  });
}
