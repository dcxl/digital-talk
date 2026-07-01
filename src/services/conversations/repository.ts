import type {
  MessageRole,
  MessageStatus,
  Prisma,
  ProviderType,
} from "@/generated/prisma/client";
import { prisma } from "@/services/database/prisma";

export const DEFAULT_USER_ID = "default-user";

export interface CreateConversationInput {
  message: string;
  modelProviderId?: string;
  knowledgeBaseId?: string;
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

export interface UpsertProviderConfigInput {
  type: ProviderType;
  provider: string;
  name: string;
  enabled?: boolean;
  baseUrl?: string;
  apiKeyEncrypted?: string;
  model?: string;
  options?: Prisma.InputJsonValue;
}

export async function ensureDefaultUser() {
  return prisma.user.upsert({
    create: {
      id: DEFAULT_USER_ID,
      name: "Default User",
    },
    update: {},
    where: {
      id: DEFAULT_USER_ID,
    },
  });
}

export function createConversationTitle(message: string) {
  const title = message.trim().replace(/\s+/g, " ").slice(0, 28);
  return title || "新会话";
}

export async function createConversationWithUserMessage(
  input: CreateConversationInput,
) {
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
  return prisma.message.update({
    data: {
      status,
    },
    where: {
      id: messageId,
    },
  });
}

export async function listActiveConversations(userId = DEFAULT_USER_ID) {
  return prisma.conversation.findMany({
    orderBy: {
      lastMessageAt: "desc",
    },
    take: 30,
    where: {
      status: "active",
      userId,
    },
  });
}

export async function createProviderConfig(input: UpsertProviderConfigInput) {
  const user = await ensureDefaultUser();

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
