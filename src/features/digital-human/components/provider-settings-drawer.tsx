import {
  CheckCircle2,
  Play,
  RefreshCw,
  Save,
  X,
  XCircle,
} from "lucide-react";
import type { AsyncStatus, ProviderFormState, ProviderSummary } from "../types";

interface ProviderSettingsDrawerProps {
  onClose: () => void;
  onFormChange: (patch: Partial<ProviderFormState>) => void;
  onLoadProviders: () => void;
  onSaveProvider: () => void;
  onTestProvider: () => void;
  providerForm: ProviderFormState;
  providers: ProviderSummary[];
  providerStatus: AsyncStatus;
  providerStatusText: string;
}

export function ProviderSettingsDrawer({
  onClose,
  onFormChange,
  onLoadProviders,
  onSaveProvider,
  onTestProvider,
  providerForm,
  providers,
  providerStatus,
  providerStatusText,
}: ProviderSettingsDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              服务商设置
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              当前 LLM 配置与连通性
            </p>
          </div>
          <button
            className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600"
            onClick={onClose}
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <section className="rounded-lg border border-slate-200 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                LLM 服务商
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                保存到数据库；API Key 只会加密存储
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                名称
                <input
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  value={providerForm.name}
                  onChange={(event) => onFormChange({ name: event.target.value })}
                />
              </label>

              <label className="block text-xs font-medium text-slate-600">
                服务商
                <select
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  value={providerForm.provider}
                  onChange={(event) =>
                    onFormChange({ provider: event.target.value })
                  }
                >
                  <option value="openai-compatible">OpenAI 兼容</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="custom">自定义</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-600">
                Base URL
                <input
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="https://api.deepseek.com/v1"
                  value={providerForm.baseUrl}
                  onChange={(event) =>
                    onFormChange({ baseUrl: event.target.value })
                  }
                />
              </label>

              <label className="block text-xs font-medium text-slate-600">
                Model
                <input
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="deepseek-chat"
                  value={providerForm.model}
                  onChange={(event) => onFormChange({ model: event.target.value })}
                />
              </label>

              <label className="block text-xs font-medium text-slate-600">
                API Key
                <input
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="留空则不保存新密钥"
                  type="password"
                  value={providerForm.apiKey}
                  onChange={(event) => onFormChange({ apiKey: event.target.value })}
                />
              </label>
            </div>
          </section>

          {providers.map((provider) => (
            <section
              key={provider.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {provider.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {provider.provider} · {provider.model ?? "未配置模型"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  {provider.enabled ? "启用" : "停用"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-500">类型</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {provider.type}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">API Key</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {provider.hasApiKey ? "已配置" : "未配置"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">基础 URL</dt>
                  <dd className="mt-1 break-all font-medium text-slate-800">
                    {provider.baseUrl ?? "未配置"}
                  </dd>
                </div>
              </dl>
            </section>
          ))}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              {providerStatus === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : providerStatus === "error" ? (
                <XCircle size={16} className="text-red-600" />
              ) : (
                <RefreshCw
                  size={16}
                  className={providerStatus === "loading" ? "animate-spin" : ""}
                />
              )}
              <span>{providerStatusText || "等待操作"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-4">
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
            disabled={providerStatus === "loading"}
            onClick={onSaveProvider}
          >
            <Save size={16} />
            保存
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
            disabled={providerStatus === "loading"}
            onClick={onLoadProviders}
          >
            <RefreshCw size={16} />
            刷新
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 text-sm text-white disabled:opacity-50"
            disabled={providerStatus === "loading"}
            onClick={onTestProvider}
          >
            <Play size={16} />
            测试
          </button>
        </div>
      </aside>
    </div>
  );
}
