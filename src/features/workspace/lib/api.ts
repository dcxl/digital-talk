import type {
  ConversationItem,
  DashboardSummary,
  KnowledgeBaseItem,
  KnowledgeDocumentItem,
  KnowledgeSearchResult,
  ProviderItem,
  WorkspaceSnapshot,
} from "../types";

export const emptySnapshot: WorkspaceSnapshot = {
  conversations: [],
  knowledgeBases: [],
  providers: [],
};

export const emptyDashboardSummary: DashboardSummary = {
  metrics: {
    activeProviderCount: 0,
    avgLatencyMs: 0,
    conversationCount: 0,
    knowledgeChunkCount: 0,
    knowledgeDocumentCount: 0,
    providerCount: 0,
    tokensToday: 0,
  },
  recentConversations: [],
  runtimeStatus: [],
  systemInfo: {
    environment: "development",
    persistenceEnabled: false,
    uptimeSeconds: 0,
    version: "0.1.0",
  },
  tokenUsage: [],
};

export async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function readWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const [conversationPayload, knowledgePayload, providerPayload] =
    await Promise.all([
      fetchJson<{ data?: { conversations?: ConversationItem[] } }>(
        "/api/conversations",
      ),
      fetchJson<{ data?: { knowledgeBases?: KnowledgeBaseItem[] } }>(
        "/api/knowledge-bases",
      ),
      fetchJson<{ data?: { providers?: ProviderItem[] } }>("/api/providers"),
    ]);

  return {
    conversations: conversationPayload?.data?.conversations ?? [],
    knowledgeBases: knowledgePayload?.data?.knowledgeBases ?? [],
    providers: providerPayload?.data?.providers ?? [],
  };
}

export async function readDashboardSummary() {
  const payload =
    await fetchJson<{ data?: DashboardSummary }>("/api/dashboard/summary");

  return payload?.data ?? emptyDashboardSummary;
}

export async function readConversations(input: {
  q?: string;
  starred?: boolean;
  status: string;
}) {
  const params = new URLSearchParams({
    limit: "100",
    status: input.status,
  });
  if (input.q) params.set("q", input.q);
  if (input.starred) params.set("starred", "true");

  const payload = await fetchJson<{ data?: { conversations?: ConversationItem[] } }>(
    `/api/conversations?${params.toString()}`,
  );

  return payload?.data?.conversations ?? [];
}

export async function readKnowledgeBases() {
  const payload =
    await fetchJson<{ data?: { knowledgeBases?: KnowledgeBaseItem[] } }>(
      "/api/knowledge-bases",
    );
  return payload?.data?.knowledgeBases ?? [];
}

export async function readKnowledgeDocuments(knowledgeBaseId: string) {
  const payload =
    await fetchJson<{ data?: { documents?: KnowledgeDocumentItem[] } }>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents`,
    );
  return payload?.data?.documents ?? [];
}

export async function createKnowledgeBaseRequest(name: string) {
  const response = await fetch("/api/knowledge-bases", {
    body: JSON.stringify({ name }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      knowledgeBase?: KnowledgeBaseItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.knowledgeBase) {
    throw new Error(payload.error?.message ?? "创建知识库失败");
  }

  return payload.data.knowledgeBase;
}

export async function uploadKnowledgeDocumentRequest(
  knowledgeBaseId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents`, {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "上传文档失败");
  }
}

export async function searchKnowledgeBaseRequest(
  knowledgeBaseId: string,
  query: string,
) {
  const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/search`, {
    body: JSON.stringify({
      limit: 8,
      query,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      results?: KnowledgeSearchResult[];
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "检索失败");
  }

  return payload.data?.results ?? [];
}
