import { KeyRound, Plus, ServerCog } from "lucide-react";
import { formatDate } from "../lib/format";
import type { ProviderItem, ProviderType } from "../types";

interface ProviderListProps {
  activeType: ProviderType;
  isBusy: boolean;
  onCreate: (type: ProviderType) => void;
  onSelect: (provider: ProviderItem) => void;
  providers: ProviderItem[];
  selectedProviderId: string;
}

function getTestStatusClass(status?: string | null) {
  if (status === "success") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function getTestStatusLabel(status?: string | null) {
  if (status === "success") return "测试通过";
  if (status === "failed") return "测试失败";
  return "未测试";
}

export function ProviderList({
  activeType,
  isBusy,
  onCreate,
  onSelect,
  providers,
  selectedProviderId,
}: ProviderListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Providers</h3>
          <p className="mt-1 text-xs text-slate-500">{activeType}</p>
        </div>
        <button
          className="inline-flex size-9 items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onCreate(activeType)}
          title="新建 Provider"
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {providers.map((provider) => {
          const isSelected = selectedProviderId === provider.id;

          return (
            <button
              className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
              key={provider.id}
              onClick={() => onSelect(provider)}
              type="button"
            >
              <ServerCog
                className={`mt-0.5 shrink-0 ${
                  isSelected ? "text-indigo-600" : "text-slate-400"
                }`}
                size={17}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {provider.name}
                  </span>
                  {provider.source === "env" ? (
                    <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      ENV
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {provider.provider} · {provider.model ?? "未配置模型"}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-md px-2 py-0.5 ${getTestStatusClass(
                      provider.lastTestStatus,
                    )}`}
                  >
                    {getTestStatusLabel(provider.lastTestStatus)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <KeyRound size={12} />
                    {provider.hasApiKey ? "已配置" : "未配置"}
                  </span>
                  {provider.lastTestAt ? (
                    <span className="text-slate-400">
                      {formatDate(provider.lastTestAt)}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
        {providers.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">
            暂无 {activeType} Provider
          </div>
        ) : null}
      </div>
    </section>
  );
}
