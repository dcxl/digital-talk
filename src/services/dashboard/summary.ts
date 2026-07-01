import type { Message } from "@/generated/prisma/client";
import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { getPrismaClient, isDatabaseConfigured } from "@/services/database/prisma";
import { getEnvLLMProvider } from "@/services/providers/env-provider";
import { sanitizeProviderConfig } from "@/services/providers/provider-presenter";

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface RuntimeProviderSummary {
  id: string;
  type: string;
  provider: string;
  name: string;
  enabled: boolean;
  model?: string | null;
  lastTestAt?: Date | string | null;
  lastTestStatus?: string | null;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readTokenUsage(message: Pick<Message, "metadata">): TokenUsage {
  if (!message.metadata || typeof message.metadata !== "object") {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
  }

  const metadata = message.metadata as Record<string, unknown>;

  return {
    inputTokens: toNumber(metadata.inputTokens),
    outputTokens: toNumber(metadata.outputTokens),
    totalTokens: toNumber(metadata.totalTokens),
  };
}

function toRuntimeStatus(
  provider: RuntimeProviderSummary,
) {
  const status =
    provider.enabled && provider.lastTestStatus !== "failed" ? "online" : "offline";

  return {
    id: provider.id,
    type: provider.type,
    name: provider.name,
    model: provider.model,
    provider: provider.provider,
    status,
    lastTestAt: provider.lastTestAt ?? null,
  };
}

function emptySummary() {
  const envProvider = getEnvLLMProvider();

  return {
    metrics: {
      activeProviderCount: 1,
      avgLatencyMs: 0,
      conversationCount: 0,
      knowledgeChunkCount: 0,
      knowledgeDocumentCount: 0,
      providerCount: 1,
      tokensToday: 0,
    },
    runtimeStatus: [toRuntimeStatus(envProvider)],
    recentConversations: [],
    tokenUsage: [
      {
        date: formatLocalDate(getStartOfToday()),
        totalTokens: 0,
      },
    ],
    systemInfo: {
      environment: process.env.NODE_ENV ?? "development",
      persistenceEnabled: false,
      uptimeSeconds: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? "0.1.0",
    },
  };
}

export async function getDashboardSummary(userId = DEFAULT_USER_ID) {
  if (!isDatabaseConfigured()) return emptySummary();

  const prisma = getPrismaClient();
  const todayStart = getStartOfToday();
  const envProvider = getEnvLLMProvider();

  const [
    conversationCount,
    recentConversations,
    knowledgeAggregate,
    providerConfigs,
    todayMessages,
  ] = await Promise.all([
    prisma.conversation.count({
      where: {
        status: "active",
        userId,
      },
    }),
    prisma.conversation.findMany({
      orderBy: {
        lastMessageAt: "desc",
      },
      select: {
        id: true,
        lastMessageAt: true,
        title: true,
      },
      take: 6,
      where: {
        status: "active",
        userId,
      },
    }),
    prisma.knowledgeBase.aggregate({
      _sum: {
        chunkCount: true,
        documentCount: true,
      },
      where: {
        status: {
          not: "deleted",
        },
        userId,
      },
    }),
    prisma.providerConfig.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        userId,
      },
    }),
    prisma.message.findMany({
      select: {
        metadata: true,
      },
      where: {
        createdAt: {
          gte: todayStart,
        },
        role: "assistant",
        status: "completed",
        conversation: {
          userId,
        },
      },
    }),
  ]);

  const providers = [envProvider, ...providerConfigs.map(sanitizeProviderConfig)];
  const tokensToday = todayMessages.reduce(
    (total, message) => total + readTokenUsage(message).totalTokens,
    0,
  );

  return {
    metrics: {
      activeProviderCount: providers.filter((provider) => provider.enabled).length,
      avgLatencyMs: 0,
      conversationCount,
      knowledgeChunkCount: knowledgeAggregate._sum.chunkCount ?? 0,
      knowledgeDocumentCount: knowledgeAggregate._sum.documentCount ?? 0,
      providerCount: providers.length,
      tokensToday,
    },
    runtimeStatus: providers.map(toRuntimeStatus),
    recentConversations,
    tokenUsage: [
      {
        date: formatLocalDate(todayStart),
        totalTokens: tokensToday,
      },
    ],
    systemInfo: {
      environment: process.env.NODE_ENV ?? "development",
      persistenceEnabled: true,
      uptimeSeconds: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? "0.1.0",
    },
  };
}
