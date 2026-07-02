import { Eraser, Play, Square } from "lucide-react";
import type { KnowledgeBaseItem, ProviderItem } from "../types";
import type { PlaygroundFormState } from "./types";

interface PlaygroundControlPanelProps {
  form: PlaygroundFormState;
  isRunning: boolean;
  knowledgeBases: KnowledgeBaseItem[];
  llmProviders: ProviderItem[];
  onChange: (patch: Partial<PlaygroundFormState>) => void;
  onClear: () => void;
  onRun: () => void;
  onStop: () => void;
}

export function PlaygroundControlPanel({
  form,
  isRunning,
  knowledgeBases,
  llmProviders,
  onChange,
  onClear,
  onRun,
  onStop,
}: PlaygroundControlPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Chat 调试</h3>
        <p className="mt-1 text-xs text-slate-500">
          复用 /api/chat，实时解析 Runtime SSE 事件
        </p>
      </div>
      <div className="space-y-4 p-4">
        <label className="block text-xs font-medium text-slate-600">
          用户输入
          <textarea
            className="mt-1 min-h-36 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ message: event.target.value })}
            value={form.message}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600">
            LLM Provider
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
              onChange={(event) =>
                onChange({ modelProviderId: event.target.value })
              }
              value={form.modelProviderId}
            >
              <option value="">默认 Provider</option>
              {llmProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-600">
            知识库
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
              onChange={(event) =>
                onChange({ knowledgeBaseId: event.target.value })
              }
              value={form.knowledgeBaseId}
            >
              <option value="">不使用 RAG</option>
              {knowledgeBases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={form.enableTTS}
            onChange={(event) => onChange({ enableTTS: event.target.checked })}
            type="checkbox"
          />
          启用 TTS
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3 text-sm text-white disabled:opacity-60"
          disabled={isRunning || !form.message.trim()}
          onClick={onRun}
          type="button"
        >
          <Play size={15} />
          运行
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-60"
          disabled={!isRunning}
          onClick={onStop}
          type="button"
        >
          <Square size={15} />
          停止
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          onClick={onClear}
          type="button"
        >
          <Eraser size={15} />
          清空
        </button>
      </div>
    </section>
  );
}
