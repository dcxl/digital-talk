import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { getPrismaClient } from "@/services/database/prisma";
import { getGeneralSettings } from "./repository";

export async function buildWorkspaceExport(userId = DEFAULT_USER_ID) {
  const prisma = getPrismaClient();
  const [settings, conversations, knowledgeBases] = await Promise.all([
    getGeneralSettings(userId),
    prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            audioUrl: true,
            content: true,
            createdAt: true,
            id: true,
            metadata: true,
            role: true,
            status: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        userId,
      },
    }),
    prisma.knowledgeBase.findMany({
      include: {
        documents: {
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            chunkCount: true,
            createdAt: true,
            errorMessage: true,
            id: true,
            mimeType: true,
            name: true,
            originalName: true,
            size: true,
            status: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        userId,
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    settings,
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      summary: conversation.summary,
      status: conversation.status,
      isStarred: conversation.isStarred,
      modelProviderId: conversation.modelProviderId,
      knowledgeBaseId: conversation.knowledgeBaseId,
      messageCount: conversation._count.messages,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      })),
    })),
    knowledgeBases: knowledgeBases.map((knowledgeBase) => ({
      id: knowledgeBase.id,
      name: knowledgeBase.name,
      description: knowledgeBase.description,
      status: knowledgeBase.status,
      documentCount: knowledgeBase.documentCount,
      chunkCount: knowledgeBase.chunkCount,
      createdAt: knowledgeBase.createdAt.toISOString(),
      updatedAt: knowledgeBase.updatedAt.toISOString(),
      documents: knowledgeBase.documents.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      })),
    })),
  };
}
