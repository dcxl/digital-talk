import { FileText, Plus } from "lucide-react";
import { formatDate } from "../lib/format";
import type { PromptTemplateItem, PromptType } from "../types";

interface PromptListProps {
  activeType: PromptType;
  isBusy: boolean;
  onCreate: (type: PromptType) => void;
  onSelect: (prompt: PromptTemplateItem) => void;
  prompts: PromptTemplateItem[];
  selectedPromptId: string;
}

export function PromptList({
  activeType,
  isBusy,
  onCreate,
  onSelect,
  prompts,
  selectedPromptId,
}: PromptListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">提示词</h3>
          <p className="mt-1 text-xs text-slate-500">{activeType}</p>
        </div>
        <button
          className="inline-flex size-9 items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onCreate(activeType)}
          title="新建提示词"
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {prompts.map((prompt) => {
          const isSelected = selectedPromptId === prompt.id;

          return (
            <button
              className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
              key={prompt.id}
              onClick={() => onSelect(prompt)}
              type="button"
            >
              <FileText
                className={`mt-0.5 shrink-0 ${
                  isSelected ? "text-indigo-600" : "text-slate-400"
                }`}
                size={17}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {prompt.name}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  v{prompt.currentVersion?.version ?? "-"} ·{" "}
                  {prompt.description || "无描述"}
                </span>
                <span className="mt-2 block text-xs text-slate-400">
                  {formatDate(prompt.updatedAt)}
                </span>
              </span>
            </button>
          );
        })}
        {prompts.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">
            暂无 {activeType} 提示词
          </div>
        ) : null}
      </div>
    </section>
  );
}
