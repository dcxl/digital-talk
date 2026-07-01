"use client";

import { PageFrame, Panel, RefreshButton } from "../components/page-frame";
import { useWorkspaceSnapshot } from "../hooks/use-workspace-snapshot";

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
