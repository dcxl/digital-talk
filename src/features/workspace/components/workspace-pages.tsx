"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Database, RefreshCw } from "lucide-react";

interface ConversationItem {
  id: string;
  title: string;
  lastMessageAt?: string | null;
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

const emptySnapshot: WorkspaceSnapshot = {
  conversations: [],
  knowledgeBases: [],
  providers: [],
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
  const { isLoading, loadSnapshot, snapshot } = useWorkspaceSnapshot();
  const documentCount = snapshot.knowledgeBases.reduce(
    (total, item) => total + item.documentCount,
    0,
  );
  const chunkCount = snapshot.knowledgeBases.reduce(
    (total, item) => total + item.chunkCount,
    0,
  );
  const activeProviders = snapshot.providers.filter((item) => item.enabled);

  const metrics = [
    {
      label: "Conversations",
      value: snapshot.conversations.length.toLocaleString("zh-CN"),
      helper: "Active sessions",
    },
    {
      label: "Knowledge Docs",
      value: documentCount.toLocaleString("zh-CN"),
      helper: `${chunkCount.toLocaleString("zh-CN")} chunks`,
    },
    {
      label: "Providers",
      value: activeProviders.length.toLocaleString("zh-CN"),
      helper: `${snapshot.providers.length.toLocaleString("zh-CN")} configured`,
    },
    {
      label: "Tokens Today",
      value: "0",
      helper: "Metric table pending",
    },
  ];

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadSnapshot} />}
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
            {snapshot.providers.map((provider) => (
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
                  {provider.enabled ? "Online" : "Disabled"}
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

        <Panel>
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Recent Conversations
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {snapshot.conversations.slice(0, 6).map((conversation) => (
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
            {snapshot.conversations.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">暂无会话</div>
            ) : null}
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}

export function HistoryPage() {
  const { isLoading, loadSnapshot, snapshot } = useWorkspaceSnapshot();
  const [query, setQuery] = useState("");
  const conversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return snapshot.conversations;
    return snapshot.conversations.filter((item) =>
      item.title.toLowerCase().includes(keyword),
    );
  }, [query, snapshot.conversations]);

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadSnapshot} />}
      eyebrow="Sessions"
      title="会话历史"
    >
      <Panel>
        <div className="border-b border-slate-200 p-4">
          <input
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索会话"
            value={query}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td className="max-w-md truncate px-4 py-3 font-medium text-slate-900">
                    {conversation.title}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(conversation.lastMessageAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-2 text-xs text-slate-700"
                      href="/conversation"
                    >
                      打开
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
              {conversations.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={4}>
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
