import {
  CheckCircle2,
  Play,
  Save,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from "lucide-react";
import type { AsyncStatus, ProviderFormState } from "../types";
import { providerOptionsByType } from "./constants";

interface ProviderConfigFormProps {
  form: ProviderFormState;
  isBusy: boolean;
  onChange: (patch: Partial<ProviderFormState>) => void;
  onSave: () => void;
  onTest: () => void;
  status: AsyncStatus;
  statusText: string;
}

function getProviderOptions(form: ProviderFormState) {
  const options = providerOptionsByType[form.type] ?? [];
  if (!form.provider || options.some((option) => option.value === form.provider)) {
    return options;
  }

  return [{ label: form.provider, value: form.provider }, ...options];
}

function StatusIcon({ status }: { status: AsyncStatus }) {
  if (status === "success") {
    return <CheckCircle2 className="text-emerald-600" size={16} />;
  }

  if (status === "error") {
    return <XCircle className="text-red-600" size={16} />;
  }

  return null;
}

export function ProviderConfigForm({
  form,
  isBusy,
  onChange,
  onSave,
  onTest,
  status,
  statusText,
}: ProviderConfigFormProps) {
  const providerOptions = getProviderOptions(form);
  const canSave = Boolean(form.name.trim() && form.provider.trim()) && !isBusy;
  const canTest = (form.type === "llm" || form.type === "tts") && !isBusy;
  const isTTS = form.type === "tts";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Provider 配置
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {form.source === "env" ? "ENV 来源，保存后生成数据库配置" : form.type}
            </p>
          </div>
          <button
            aria-checked={form.enabled}
            className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium ${
              form.enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
            onClick={() => onChange({ enabled: !form.enabled })}
            role="switch"
            type="button"
          >
            {form.enabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
            {form.enabled ? "启用" : "停用"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          名称
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="DeepSeek Production"
            value={form.name}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Provider
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ provider: event.target.value })}
            value={form.provider}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Base URL
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ baseUrl: event.target.value })}
            placeholder={
              isTTS ? "https://api.openai.com/v1" : "https://api.deepseek.com/v1"
            }
            value={form.baseUrl}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Model
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ model: event.target.value })}
            placeholder={isTTS ? "tts-1" : "deepseek-chat"}
            value={form.model}
          />
        </label>

        {isTTS ? (
          <>
            <label className="block text-xs font-medium text-slate-600">
              Voice
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                onChange={(event) => onChange({ voice: event.target.value })}
                placeholder="alloy"
                value={form.voice ?? ""}
              />
            </label>

            <label className="block text-xs font-medium text-slate-600">
              Format
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                onChange={(event) =>
                  onChange({
                    format: event.target.value === "wav" ? "wav" : "mp3",
                  })
                }
                value={form.format ?? "mp3"}
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
              </select>
            </label>
          </>
        ) : null}

        <label className="block text-xs font-medium text-slate-600 lg:col-span-2">
          API Key
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ apiKey: event.target.value })}
            placeholder={form.hasApiKey ? "已配置，留空不更新" : "输入 API Key"}
            type="password"
            value={form.apiKey}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-h-5 text-sm text-slate-600">
          {statusText ? (
            <span className="inline-flex items-center gap-2">
              <StatusIcon status={status} />
              {statusText}
            </span>
          ) : (
            "等待操作"
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-60"
            disabled={!canSave}
            onClick={onSave}
            type="button"
          >
            <Save size={15} />
            保存
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
            disabled={!canTest}
            onClick={onTest}
            title={
              form.type === "llm" || form.type === "tts"
                ? "测试 Provider"
                : "仅 LLM / TTS 支持测试"
            }
            type="button"
          >
            <Play size={15} />
            测试
          </button>
        </div>
      </div>
    </section>
  );
}
