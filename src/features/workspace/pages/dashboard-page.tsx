"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageFrame, Panel, RefreshButton } from "../components/page-frame";
import { emptyDashboardSummary, readDashboardSummary } from "../lib/api";
import { formatDate } from "../lib/format";
import type { DashboardSummary } from "../types";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSummary() {
    setIsLoading(true);
    setSummary(await readDashboardSummary());
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void readDashboardSummary().then((nextSummary) => {
      if (cancelled) return;
      setSummary(nextSummary);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = [
    {
      label: "会话数",
      value: summary.metrics.conversationCount.toLocaleString("zh-CN"),
      helper: "活跃会话",
    },
    {
      label: "知识文档",
      value: summary.metrics.knowledgeDocumentCount.toLocaleString("zh-CN"),
      helper: `${summary.metrics.knowledgeChunkCount.toLocaleString("zh-CN")} 个切片`,
    },
    {
      label: "服务商",
      value: summary.metrics.activeProviderCount.toLocaleString("zh-CN"),
      helper: `已配置 ${summary.metrics.providerCount.toLocaleString("zh-CN")} 个`,
    },
    {
      label: "今日 Token",
      value: summary.metrics.tokensToday.toLocaleString("zh-CN"),
      helper: `平均延迟 ${summary.metrics.avgLatencyMs} ms`,
    },
  ];

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadSummary} />}
      eyebrow="概览"
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
              运行状态
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
              最近会话
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
