import {
  Prisma,
  type ConversationStatus,
  type MessageRole,
  type MessageStatus,
  type ProviderType,
  type TestStatus,
} from "@/generated/prisma/client";
import { getPrismaClient } from "@/services/database/prisma";

export const DEFAULT_USER_ID = "default-user";

export interface CreateConversationInput {
  knowledgeBaseId?: string;
  message: string;
  messageMetadata?: Prisma.InputJsonValue;
  modelProviderId?: string;
}

export interface ListConversationsInput {
  limit?: number;
  q?: string;
  starred?: boolean;
  status?: ConversationStatus;
  userId?: string;
}

export interface AppendMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  audioUrl?: string;
  metadata?: Prisma.InputJsonValue;
  parentMessageId?: string;
}

export interface UpdateMessageInput {
  messageId: string;
  content?: string;
  status?: MessageStatus;
  audioUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateConversationInput {
  conversationId: string;
  isStarred?: boolean;
  status?: ConversationStatus;
  title?: string;
  userId?: string;
}

export interface UpsertProviderConfigInput {
  id?: string;
  type: ProviderType;
  provider: string;
  name: string;
  enabled?: boolean;
  baseUrl?: string;
  apiKeyEncrypted?: string;
  model?: string;
  options?: Prisma.InputJsonValue;
}

export interface ListProviderConfigsInput {
  type?: ProviderType;
  enabled?: boolean;
}

export interface UpdateProviderConfigInput {
  id: string;
  type?: ProviderType;
  provider?: string;
  name?: string;
  enabled?: boolean;
  baseUrl?: string | null;
  apiKeyEncrypted?: string | null;
  model?: string | null;
  options?: Prisma.InputJsonValue;
}

export async function ensureDefaultUser() {
  const prisma = getPrismaClient();

  const existing = await prisma.user.findUnique({
    where: {
      id: DEFAULT_USER_ID,
    },
  });

  if (existing) return existing;

  try {
    return await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        name: "Default User",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const user = await prisma.user.findUnique({
        where: {
          id: DEFAULT_USER_ID,
        },
      });
      if (user) return user;
    }

    throw error;
  }
}

export function createConversationTitle(message: string) {
  const title = message.trim().replace(/\s+/g, " ").slice(0, 28);
  return title || "新会话";
}

export async function createConversationWithUserMessage(
  input: CreateConversationInput,
) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();
  const now = new Date();

  return prisma.conversation.create({
    data: {
      knowledgeBaseId: input.knowledgeBaseId,
      lastMessageAt: now,
      modelProviderId: input.modelProviderId,
      title: createConversationTitle(input.message),
      userId: user.id,
      messages: {
        create: {
          content: input.message,
          metadata: input.messageMetadata,
          role: "user",
          status: "completed",
        },
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function appendMessage(input: AppendMessageInput) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        audioUrl: input.audioUrl,
        content: input.content,
        conversationId: input.conversationId,
        metadata: input.metadata,
        parentMessageId: input.parentMessageId,
        role: input.role,
        status: input.status ?? "completed",
      },
    });

    await tx.conversation.update({
      data: {
        lastMessageAt: message.createdAt,
      },
      where: {
        id: input.conversationId,
      },
    });

    return message;
  });
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
) {
  const prisma = getPrismaClient();

  return prisma.message.update({
    data: {
      status,
    },
    where: {
      id: messageId,
    },
  });
}

export async function interruptAssistantMessage(input: {
  conversationId?: string;
  messageId?: string;
}) {
  const prisma = getPrismaClient();

  if (input.messageId) {
    return prisma.message.update({
      data: {
        status: "interrupted",
      },
      where: {
        id: input.messageId,
      },
    });
  }

  if (!input.conversationId) return null;

  const message = await prisma.message.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      conversationId: input.conversationId,
      role: "assistant",
      status: {
        in: ["pending", "streaming"],
      },
    },
  });

  if (!message) return null;

  return prisma.message.update({
    data: {
      status: "interrupted",
    },
    where: {
      id: message.id,
    },
  });
}

export async function updateMessage(input: UpdateMessageInput) {
  const prisma = getPrismaClient();

  return prisma.message.update({
    data: {
      audioUrl: input.audioUrl,
      content: input.content,
      metadata: input.metadata,
      status: input.status,
    },
    where: {
      id: input.messageId,
    },
  });
}

export async function listConversations(input: ListConversationsInput = {}) {
  const prisma = getPrismaClient();
  const keyword = input.q?.trim();
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);

  return prisma.conversation.findMany({
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    take: limit,
    where: {
      isStarred: input.starred,
      status: input.status ?? "active",
      title: keyword
        ? {
            contains: keyword,
            mode: "insensitive",
          }
        : undefined,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}

export async function listActiveConversations(userId = DEFAULT_USER_ID) {
  return listConversations({
    status: "active",
    userId,
  });
}

export async function getConversationWithMessages(
  conversationId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.conversation.findFirst({
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    where: {
      id: conversationId,
      status: {
        not: "deleted",
      },
      userId,
    },
  });
}

export async function getConversation(
  conversationId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });
}

export async function updateConversation(input: UpdateConversationInput) {
  const prisma = getPrismaClient();
  const status = input.status;
  const data: Prisma.ConversationUpdateInput = {};

  if (input.title !== undefined) data.title = input.title.trim() || "新会话";
  if (input.isStarred !== undefined) data.isStarred = input.isStarred;
  if (status !== undefined) {
    data.status = status;
    if (status === "active") {
      data.archivedAt = null;
      data.deletedAt = null;
    }
    if (status === "archived") {
      data.archivedAt = new Date();
      data.deletedAt = null;
    }
    if (status === "deleted") {
      data.deletedAt = new Date();
    }
  }

  return prisma.conversation.update({
    data,
    where: {
      id: input.conversationId,
      userId: input.userId ?? DEFAULT_USER_ID,
    },
  });
}

export async function deleteConversation(
  conversationId: string,
  userId = DEFAULT_USER_ID,
) {
  return updateConversation({
    conversationId,
    status: "deleted",
    userId,
  });
}

export async function createProviderConfig(input: UpsertProviderConfigInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();

  if (input.id) {
    return prisma.providerConfig.update({
      data: {
        apiKeyEncrypted: input.apiKeyEncrypted,
        baseUrl: input.baseUrl,
        enabled: input.enabled ?? true,
        model: input.model,
        name: input.name,
        options: input.options,
        provider: input.provider,
        type: input.type,
      },
      where: {
        id: input.id,
        userId: user.id,
      },
    });
  }

  return prisma.providerConfig.create({
    data: {
      apiKeyEncrypted: input.apiKeyEncrypted,
      baseUrl: input.baseUrl,
      enabled: input.enabled ?? true,
      model: input.model,
      name: input.name,
      options: input.options,
      provider: input.provider,
      type: input.type,
      userId: user.id,
    },
  });
}

export async function getProviderConfig(
  providerId: string,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.providerConfig.findFirst({
    where: {
      id: providerId,
      userId,
    },
  });
}

export async function updateProviderConfig(input: UpdateProviderConfigInput) {
  const prisma = getPrismaClient();
  const user = await ensureDefaultUser();
  const data: Prisma.ProviderConfigUpdateInput = {};

  if (input.type !== undefined) data.type = input.type;
  if (input.provider !== undefined) data.provider = input.provider;
  if (input.name !== undefined) data.name = input.name;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.baseUrl !== undefined) data.baseUrl = input.baseUrl;
  if (input.apiKeyEncrypted !== undefined) {
    data.apiKeyEncrypted = input.apiKeyEncrypted;
  }
  if (input.model !== undefined) data.model = input.model;
  if (input.options !== undefined) data.options = input.options;

  return prisma.providerConfig.update({
    data,
    where: {
      id: input.id,
      userId: user.id,
    },
  });
}

export async function updateProviderTestStatus(
  providerId: string,
  status: TestStatus,
  userId = DEFAULT_USER_ID,
) {
  const prisma = getPrismaClient();

  return prisma.providerConfig.update({
    data: {
      lastTestAt: new Date(),
      lastTestStatus: status,
    },
    where: {
      id: providerId,
      userId,
    },
  });
}

export async function listProviderConfigs(input: ListProviderConfigsInput = {}) {
  const prisma = getPrismaClient();

  return prisma.providerConfig.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    where: {
      enabled: input.enabled,
      type: input.type,
      userId: DEFAULT_USER_ID,
    },
  });
}
