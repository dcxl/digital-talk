import { Database, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import type {
  CharacterItem,
  CharacterMemoryFormState,
  CharacterMemoryItem,
  CharacterMemoryStatus,
} from "../types";
import {
  characterMemoryStatusLabels,
  characterMemoryTypeLabels,
  characterMemoryTypeOptions,
  createBlankCharacterMemoryForm,
} from "./constants";

export function CharacterMemoryPanel({
  character,
  isBusy,
  memories,
  onCreateMemory,
  onDeleteMemory,
  onUpdateMemoryStatus,
}: {
  character: CharacterItem | null;
  isBusy: boolean;
  memories: CharacterMemoryItem[];
  onCreateMemory: (input: CharacterMemoryFormState) => void;
  onDeleteMemory: (memoryId: string) => void;
  onUpdateMemoryStatus: (
    memoryId: string,
    status: CharacterMemoryStatus,
  ) => void;
}) {
  const [form, setForm] = useState<CharacterMemoryFormState>(
    createBlankCharacterMemoryForm(),
  );

  function updateForm(patch: Partial<CharacterMemoryFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function submitMemory() {
    if (!character || !form.content.trim()) return;
    onCreateMemory(form);
    setForm(createBlankCharacterMemoryForm());
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Database size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">记忆</h3>
          <p className="mt-1 text-xs text-slate-500">
            {character ? `${memories.length} 条` : "未选择角色"}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3">
          <select
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy || !character}
            onChange={(event) =>
              updateForm({
                type: event.target.value as CharacterMemoryFormState["type"],
              })
            }
            value={form.type}
          >
            {characterMemoryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy || !character}
            onChange={(event) => updateForm({ content: event.target.value })}
            placeholder="手动写入这名角色需要记住的信息"
            value={form.content}
          />
          <label className="grid gap-2 text-xs text-slate-500">
            置信度 {form.confidence.toFixed(2)}
            <input
              disabled={isBusy || !character}
              max={1}
              min={0}
              onChange={(event) =>
                updateForm({ confidence: Number(event.target.value) })
              }
              step={0.05}
              type="range"
              value={form.confidence}
            />
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isBusy || !character || !form.content.trim()}
            onClick={submitMemory}
            type="button"
          >
            <Plus size={15} />
            新增记忆
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 border-t border-slate-100">
        {memories.map((memory) => {
          const nextStatus = memory.status === "active" ? "disabled" : "active";

          return (
            <div className="space-y-3 p-4" key={memory.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {characterMemoryTypeLabels[memory.type]}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {memory.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {characterMemoryStatusLabels[memory.status]} · 置信度{" "}
                    {(memory.confidence ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:cursor-not-allowed"
                    disabled={isBusy}
                    onClick={() => onUpdateMemoryStatus(memory.id, nextStatus)}
                    title={nextStatus === "active" ? "启用记忆" : "禁用记忆"}
                    type="button"
                  >
                    <Power size={15} />
                  </button>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:cursor-not-allowed"
                    disabled={isBusy}
                    onClick={() => onDeleteMemory(memory.id)}
                    title="删除记忆"
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {character && memories.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">暂无手动记忆</div>
        ) : null}
        {!character ? (
          <div className="p-4 text-sm text-slate-500">请选择角色后管理记忆</div>
        ) : null}
      </div>
    </section>
  );
}
