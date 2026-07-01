"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  Database,
  RefreshCw,
  RotateCcw,
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
  const { isLoading, loadSnapshot, snapshot } = useWorkspaceSnapshot();

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadSnapshot} />}
      eyebrow="RAG"
      title="知识库"
    >
      <Panel>
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Knowledge Bases</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {snapshot.knowledgeBases.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Documents</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {snapshot.knowledgeBases.reduce(
                (total, item) => total + item.documentCount,
                0,
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Chunks</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {snapshot.knowledgeBases.reduce(
                (total, item) => total + item.chunkCount,
                0,
              )}
            </p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {snapshot.knowledgeBases.map((item) => (
            <div
              className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_120px]"
              key={item.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {item.description ?? "No description"}
                </p>
              </div>
              <p className="text-sm text-slate-600">{item.documentCount} docs</p>
              <p className="text-sm text-slate-600">{item.chunkCount} chunks</p>
            </div>
          ))}
          {snapshot.knowledgeBases.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">暂无知识库</div>
          ) : null}
        </div>
      </Panel>
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
