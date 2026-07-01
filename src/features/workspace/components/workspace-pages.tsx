"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  CloudUpload,
  Database,
  FileSearch,
  FileText,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";

interface ConversationItem {
  _count?: {
    messages: number;
  };
  id: string;
  isStarred?: boolean;
  title: string;
  lastMessageAt?: string | null;
  status?: string;
}

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description?: string | null;
  documentCount: number;
  chunkCount: number;
}

interface KnowledgeDocumentItem {
  chunkCount: number;
  id: string;
  mimeType?: string;
  name: string;
  originalName: string;
  size?: number;
  status: string;
  updatedAt?: string;
}

interface KnowledgeSearchResult {
  chunkId: string;
  content: string;
  documentId: string;
  documentName: string;
  metadata?: unknown;
  tokenCount?: number | null;
}

interface ProviderItem {
  id: string;
  type: string;
  provider: string;
  name: string;
  enabled: boolean;
  model?: string | null;
  source?: string;
}

interface WorkspaceSnapshot {
  conversations: ConversationItem[];
  knowledgeBases: KnowledgeBaseItem[];
  providers: ProviderItem[];
}

interface DashboardSummary {
  metrics: {
    activeProviderCount: number;
    avgLatencyMs: number;
    conversationCount: number;
    knowledgeChunkCount: number;
    knowledgeDocumentCount: number;
    providerCount: number;
    tokensToday: number;
  };
  recentConversations: ConversationItem[];
  runtimeStatus: Array<{
    id: string;
    lastTestAt?: string | null;
    model?: string | null;
    name: string;
    provider: string;
    status: string;
    type: string;
  }>;
  systemInfo: {
    environment: string;
    persistenceEnabled: boolean;
    uptimeSeconds: number;
    version: string;
  };
  tokenUsage: Array<{
    date: string;
    totalTokens: number;
  }>;
}

const emptySnapshot: WorkspaceSnapshot = {
  conversations: [],
  knowledgeBases: [],
  providers: [],
};

const emptyDashboardSummary: DashboardSummary = {
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

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function readWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
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

async function readKnowledgeBases() {
  const payload =
    await fetchJson<{ data?: { knowledgeBases?: KnowledgeBaseItem[] } }>(
      "/api/knowledge-bases",
    );
  return payload?.data?.knowledgeBases ?? [];
}

async function readKnowledgeDocuments(knowledgeBaseId: string) {
  const payload =
    await fetchJson<{ data?: { documents?: KnowledgeDocumentItem[] } }>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents`,
    );
  return payload?.data?.documents ?? [];
}

async function createKnowledgeBaseRequest(name: string) {
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

async function uploadKnowledgeDocumentRequest(knowledgeBaseId: string, file: File) {
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

async function searchKnowledgeBaseRequest(knowledgeBaseId: string, query: string) {
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

async function readConversations(input: {
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(size?: number) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function PageFrame({
  actions,
  children,
  eyebrow,
  title,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-indigo-600">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function RefreshButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm disabled:opacity-60"
      disabled={isLoading}
      onClick={onClick}
      type="button"
    >
      <RefreshCw className={isLoading ? "animate-spin" : ""} size={15} />
      刷新
    </button>
  );
}

function useWorkspaceSnapshot() {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSnapshot() {
    setIsLoading(true);
    setSnapshot(await readWorkspaceSnapshot());
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void readWorkspaceSnapshot().then((nextSnapshot) => {
      if (cancelled) return;
      setSnapshot(nextSnapshot);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    loadSnapshot,
    snapshot,
  };
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSummary() {
    setIsLoading(true);
    const payload =
      await fetchJson<{ data?: DashboardSummary }>("/api/dashboard/summary");

    setSummary(payload?.data ?? emptyDashboardSummary);
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void fetchJson<{ data?: DashboardSummary }>("/api/dashboard/summary").then(
      (payload) => {
        if (cancelled) return;
        setSummary(payload?.data ?? emptyDashboardSummary);
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = [
    {
      label: "Conversations",
      value: summary.metrics.conversationCount.toLocaleString("zh-CN"),
      helper: "Active sessions",
    },
    {
      label: "Knowledge Docs",
      value: summary.metrics.knowledgeDocumentCount.toLocaleString("zh-CN"),
      helper: `${summary.metrics.knowledgeChunkCount.toLocaleString("zh-CN")} chunks`,
    },
    {
      label: "Providers",
      value: summary.metrics.activeProviderCount.toLocaleString("zh-CN"),
      helper: `${summary.metrics.providerCount.toLocaleString("zh-CN")} configured`,
    },
    {
      label: "Tokens Today",
      value: summary.metrics.tokensToday.toLocaleString("zh-CN"),
      helper: `Avg latency ${summary.metrics.avgLatencyMs} ms`,
    },
  ];

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadSummary} />}
      eyebrow="Overview"
      title="运行概览"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Panel key={metric.label} className="p-4">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Panel>
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Runtime Status
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {summary.runtimeStatus.map((provider) => (
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                key={provider.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {provider.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {provider.type} · {provider.model ?? provider.provider}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  {provider.status}
                </span>
              </div>
            ))}
            {summary.runtimeStatus.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">
                暂无 Provider 配置
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Recent Conversations
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {summary.recentConversations.map((conversation) => (
              <Link
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                href="/conversation"
                key={conversation.id}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {conversation.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(conversation.lastMessageAt)}
                  </span>
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
            {summary.recentConversations.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">暂无会话</div>
            ) : null}
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}

export function HistoryPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [starredOnly, setStarredOnly] = useState(false);

  async function loadHistory() {
    setIsLoading(true);
    setConversations(
      await readConversations({
        q: query.trim() || undefined,
        starred: starredOnly,
        status,
      }),
    );
    setIsLoading(false);
  }

  async function updateHistoryConversation(
    conversationId: string,
    body: Record<string, boolean | string>,
  ) {
    await fetch(`/api/conversations/${conversationId}`, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    await loadHistory();
  }

  async function deleteHistoryConversation(conversationId: string) {
    await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
    await loadHistory();
  }

  useEffect(() => {
    let cancelled = false;

    void readConversations({
      q: query.trim() || undefined,
      starred: starredOnly,
      status,
    }).then((nextConversations) => {
      if (cancelled) return;
      setConversations(nextConversations);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [query, starredOnly, status]);

  const statusTabs = useMemo(
    () => [
      { label: "Active", value: "active" },
      { label: "Archived", value: "archived" },
      { label: "Deleted", value: "deleted" },
    ],
    [],
  );

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadHistory} />}
      eyebrow="Sessions"
      title="会话历史"
    >
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 lg:max-w-md"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索会话"
            value={query}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {statusTabs.map((tab) => (
                <button
                  className={`h-8 rounded px-3 text-xs font-medium ${
                    status === tab.value
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm ${
                starredOnly
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => setStarredOnly((current) => !current)}
              type="button"
            >
              <Star size={15} />
              Starred
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td className="max-w-md truncate px-4 py-3 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      {conversation.isStarred ? (
                        <Star
                          className="shrink-0 fill-indigo-500 text-indigo-500"
                          size={14}
                        />
                      ) : null}
                      <span className="truncate">{conversation.title}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {conversation._count?.messages ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(conversation.lastMessageAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {conversation.status ?? status}
                    </span>
                  </td>
                  <td className="flex gap-2 px-4 py-3">
                    <Link
                      className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                      href="/conversation"
                      title="打开"
                    >
                      <ArrowRight size={13} />
                    </Link>
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                      onClick={() =>
                        void updateHistoryConversation(conversation.id, {
                          isStarred: !conversation.isStarred,
                        })
                      }
                      title={conversation.isStarred ? "取消收藏" : "收藏"}
                      type="button"
                    >
                      <Star size={13} />
                    </button>
                    {status === "archived" || status === "deleted" ? (
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                        onClick={() =>
                          void updateHistoryConversation(conversation.id, {
                            status: "active",
                          })
                        }
                        title="恢复"
                        type="button"
                      >
                        <RotateCcw size={13} />
                      </button>
                    ) : (
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                        onClick={() =>
                          void updateHistoryConversation(conversation.id, {
                            status: "archived",
                          })
                        }
                        title="归档"
                        type="button"
                      >
                        <Archive size={13} />
                      </button>
                    )}
                    {status !== "deleted" ? (
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md border border-red-200 text-red-600"
                        onClick={() => void deleteHistoryConversation(conversation.id)}
                        title="删除"
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {conversations.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={5}>
                    暂无会话
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageFrame>
  );
}

export function KnowledgePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState("");
  const [knowledgeName, setKnowledgeName] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [statusText, setStatusText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedKnowledgeBase = knowledgeBases.find(
    (item) => item.id === selectedKnowledgeBaseId,
  );
  const documentCount = knowledgeBases.reduce(
    (total, item) => total + item.documentCount,
    0,
  );
  const chunkCount = knowledgeBases.reduce(
    (total, item) => total + item.chunkCount,
    0,
  );

  async function loadKnowledgeWorkspace(nextSelectedId = selectedKnowledgeBaseId) {
    setIsLoading(true);
    const nextKnowledgeBases = await readKnowledgeBases();
    const resolvedSelectedId =
      nextSelectedId &&
      nextKnowledgeBases.some((item) => item.id === nextSelectedId)
        ? nextSelectedId
        : (nextKnowledgeBases[0]?.id ?? "");
    const nextDocuments = resolvedSelectedId
      ? await readKnowledgeDocuments(resolvedSelectedId)
      : [];

    setKnowledgeBases(nextKnowledgeBases);
    setSelectedKnowledgeBaseId(resolvedSelectedId);
    setDocuments(nextDocuments);
    setIsLoading(false);
  }

  async function createKnowledgeBase() {
    const name = knowledgeName.trim();
    if (!name) return;

    setIsLoading(true);
    try {
      const knowledgeBase = await createKnowledgeBaseRequest(name);
      setKnowledgeName("");
      setStatusText("知识库已创建");
      await loadKnowledgeWorkspace(knowledgeBase.id);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "创建知识库失败");
      setIsLoading(false);
    }
  }

  async function uploadDocument(file: File) {
    if (!selectedKnowledgeBaseId) return;

    setIsUploading(true);
    try {
      await uploadKnowledgeDocumentRequest(selectedKnowledgeBaseId, file);
      setStatusText("文档已上传");
      await loadKnowledgeWorkspace(selectedKnowledgeBaseId);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "上传文档失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function runSearch() {
    const trimmedQuery = query.trim();
    if (!selectedKnowledgeBaseId || !trimmedQuery) return;

    setIsSearching(true);
    try {
      const results = await searchKnowledgeBaseRequest(
        selectedKnowledgeBaseId,
        trimmedQuery,
      );
      setSearchResults(results);
      setStatusText(results.length > 0 ? "检索完成" : "未命中文档切片");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "检索失败");
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void readKnowledgeBases().then(async (nextKnowledgeBases) => {
      if (cancelled) return;
      const nextSelectedId = nextKnowledgeBases[0]?.id ?? "";
      const nextDocuments = nextSelectedId
        ? await readKnowledgeDocuments(nextSelectedId)
        : [];
      if (cancelled) return;
      setKnowledgeBases(nextKnowledgeBases);
      setSelectedKnowledgeBaseId(nextSelectedId);
      setDocuments(nextDocuments);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selectedKnowledgeBaseId) {
      void Promise.resolve().then(() => {
        if (!cancelled) setDocuments([]);
      });
      return () => {
        cancelled = true;
      };
    }

    void readKnowledgeDocuments(selectedKnowledgeBaseId).then((nextDocuments) => {
      if (cancelled) return;
      setDocuments(nextDocuments);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedKnowledgeBaseId]);

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isLoading}
          onClick={() => void loadKnowledgeWorkspace()}
        />
      }
      eyebrow="RAG"
      title="知识库"
    >
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel>
          <div className="border-b border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Knowledge Bases</h3>
            <div className="mt-3 flex gap-2">
              <input
                className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                onChange={(event) => setKnowledgeName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void createKnowledgeBase();
                }}
                placeholder="新知识库名称"
                value={knowledgeName}
              />
              <button
                className="flex size-9 items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-60"
                disabled={!knowledgeName.trim() || isLoading}
                onClick={() => void createKnowledgeBase()}
                title="创建知识库"
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {knowledgeBases.map((item) => (
              <button
                className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                  selectedKnowledgeBaseId === item.id
                    ? "bg-indigo-50"
                    : "hover:bg-slate-50"
                }`}
                key={item.id}
                onClick={() => {
                  setSelectedKnowledgeBaseId(item.id);
                  setSearchResults([]);
                }}
                type="button"
              >
                <Database className="mt-0.5 shrink-0 text-indigo-600" size={16} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {item.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.documentCount} docs · {item.chunkCount} chunks
                  </span>
                </span>
              </button>
            ))}
            {knowledgeBases.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">暂无知识库</div>
            ) : null}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Knowledge Bases</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {knowledgeBases.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Documents</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {documentCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Chunks</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {chunkCount}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-950">
                  {selectedKnowledgeBase?.name ?? "未选择知识库"}
                </h3>
                <p className="text-xs text-slate-500">
                  {statusText || "支持 txt、md、json 等文本类文件，当前限制 2MB"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadDocument(file);
                  }}
                  type="file"
                />
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3 text-sm text-white disabled:opacity-60"
                  disabled={!selectedKnowledgeBaseId || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <CloudUpload size={15} />
                  {isUploading ? "上传中" : "上传文档"}
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-950">Documents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Chunks</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="max-w-md truncate px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="shrink-0 text-slate-500" size={14} />
                          <span className="truncate font-medium text-slate-900">
                            {document.name || document.originalName}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {document.mimeType ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatFileSize(document.size)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          {document.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {document.chunkCount}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(document.updatedAt)}
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-slate-500" colSpan={6}>
                        暂无文档
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-950">Retrieval Test</h3>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
              <div className="flex flex-col gap-3">
                <textarea
                  className="min-h-32 resize-none rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入检索问题"
                  value={query}
                />
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
                  disabled={!selectedKnowledgeBaseId || !query.trim() || isSearching}
                  onClick={() => void runSearch()}
                  type="button"
                >
                  {isSearching ? <RefreshCw className="animate-spin" size={15} /> : <Search size={15} />}
                  检索
                </button>
              </div>
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    key={result.chunkId}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {result.documentName}
                      </p>
                      <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs text-slate-500">
                        {result.tokenCount ?? 0} tokens
                      </span>
                    </div>
                    <p className="line-clamp-4 text-sm leading-6 text-slate-600">
                      {result.content}
                    </p>
                  </div>
                ))}
                {searchResults.length === 0 ? (
                  <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
                    <FileSearch className="mr-2" size={16} />
                    暂无检索结果
                  </div>
                ) : null}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}

export function ModelsPage() {
  const { isLoading, loadSnapshot, snapshot } = useWorkspaceSnapshot();

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadSnapshot} />}
      eyebrow="Providers"
      title="模型配置"
    >
      <Panel>
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-4">
          {["llm", "embedding", "tts", "asr"].map((type) => (
            <div className="rounded-md bg-slate-50 p-3" key={type}>
              <p className="text-xs uppercase text-slate-500">{type}</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {snapshot.providers.filter((item) => item.type === type).length}
              </p>
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {snapshot.providers.map((provider) => (
            <div
              className="grid gap-2 px-4 py-3 md:grid-cols-[160px_minmax(0,1fr)_140px_100px]"
              key={provider.id}
            >
              <span className="text-sm font-medium text-slate-900">
                {provider.name}
              </span>
              <span className="truncate text-sm text-slate-500">
                {provider.model ?? provider.provider}
              </span>
              <span className="text-sm text-slate-500">{provider.type}</span>
              <span className="text-sm text-emerald-700">
                {provider.enabled ? "Active" : "Disabled"}
              </span>
            </div>
          ))}
          {snapshot.providers.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">
              暂无 Provider 配置
            </div>
          ) : null}
        </div>
      </Panel>
    </PageFrame>
  );
}

export function WorkspacePlaceholderPage({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <PageFrame eyebrow="Planned" title={title}>
      <Panel className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              className="flex min-h-20 items-start gap-3 rounded-md bg-slate-50 p-3"
              key={item}
            >
              <Database className="mt-0.5 text-indigo-600" size={17} />
              <p className="text-sm text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </Panel>
    </PageFrame>
  );
}
