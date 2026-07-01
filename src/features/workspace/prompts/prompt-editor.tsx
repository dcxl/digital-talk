import { Plus, Save, Trash2 } from "lucide-react";
import type { PromptFormState, PromptVariable } from "../types";

interface PromptEditorProps {
  form: PromptFormState;
  isBusy: boolean;
  onAddVariable: () => void;
  onChange: (patch: Partial<PromptFormState>) => void;
  onRemoveVariable: (index: number) => void;
  onSave: () => void;
  onVariableChange: (index: number, patch: Partial<PromptVariable>) => void;
}

export function PromptEditor({
  form,
  isBusy,
  onAddVariable,
  onChange,
  onRemoveVariable,
  onSave,
  onVariableChange,
}: PromptEditorProps) {
  const canSave = Boolean(form.name.trim() && form.content.trim()) && !isBusy;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Prompt Editor</h3>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          名称
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ name: event.target.value })}
            value={form.name}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          类型
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
            readOnly
            value={form.type}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600 lg:col-span-2">
          描述
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ description: event.target.value })}
            value={form.description}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600 lg:col-span-2">
          Prompt 内容
          <textarea
            className="mt-1 min-h-64 w-full resize-y rounded-md border border-slate-200 p-3 font-mono text-sm leading-6 outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ content: event.target.value })}
            value={form.content}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600 lg:col-span-2">
          版本说明
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ changelog: event.target.value })}
            placeholder="例如：优化角色约束"
            value={form.changelog}
          />
        </label>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-slate-950">Variables</h4>
          <button
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
            onClick={onAddVariable}
            title="添加变量"
            type="button"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {form.variables.map((variable, index) => (
            <div
              className="grid gap-2 rounded-md bg-slate-50 p-2 md:grid-cols-[1fr_1fr_92px_36px]"
              key={`${variable.name}-${index}`}
            >
              <input
                className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                onChange={(event) =>
                  onVariableChange(index, { name: event.target.value })
                }
                placeholder="变量名"
                value={variable.name}
              />
              <input
                className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                onChange={(event) =>
                  onVariableChange(index, { defaultValue: event.target.value })
                }
                placeholder="默认值"
                value={variable.defaultValue ?? ""}
              />
              <label className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
                <input
                  checked={Boolean(variable.required)}
                  onChange={(event) =>
                    onVariableChange(index, { required: event.target.checked })
                  }
                  type="checkbox"
                />
                必填
              </label>
              <button
                className="inline-flex size-9 items-center justify-center rounded-md border border-red-200 text-red-600"
                onClick={() => onRemoveVariable(index)}
                title="删除变量"
                type="button"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {form.variables.length === 0 ? (
            <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">
              暂无变量
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 p-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
          disabled={!canSave}
          onClick={onSave}
          type="button"
        >
          <Save size={15} />
          保存版本
        </button>
      </div>
    </section>
  );
}
