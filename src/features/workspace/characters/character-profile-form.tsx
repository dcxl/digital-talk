import { Save, Trash2 } from "lucide-react";
import type { CharacterFormState } from "../types";
import {
  characterRoleOptions,
  characterStatusLabels,
} from "./constants";

interface CharacterProfileFormProps {
  form: CharacterFormState;
  isBusy: boolean;
  onChange: (patch: Partial<CharacterFormState>) => void;
  onDelete: () => void;
  onSave: () => void;
  statusText: string;
}

export function CharacterProfileForm({
  form,
  isBusy,
  onChange,
  onDelete,
  onSave,
  statusText,
}: CharacterProfileFormProps) {
  const canSave = Boolean(form.name.trim()) && !isBusy;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">角色资料</h3>
        <p className="mt-1 text-xs text-slate-500">
          {statusText || "配置角色身份、用途和状态"}
        </p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
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
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) =>
              onChange({
                roleType: event.target.value as CharacterFormState["roleType"],
              })
            }
            value={form.roleType}
          >
            {characterRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600 md:col-span-2">
          简介
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ description: event.target.value })}
            value={form.description}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          标签
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ tagsText: event.target.value })}
            value={form.tagsText}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          状态
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) =>
              onChange({
                status: event.target.value as CharacterFormState["status"],
              })
            }
            value={form.status}
          >
            <option value="draft">{characterStatusLabels.draft}</option>
            <option value="active">{characterStatusLabels.active}</option>
            <option value="disabled">{characterStatusLabels.disabled}</option>
          </select>
        </label>
      </div>

      <div className="flex justify-between gap-3 border-t border-slate-200 p-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm text-red-700 disabled:opacity-50"
          disabled={isBusy || !form.id}
          onClick={onDelete}
          type="button"
        >
          <Trash2 size={15} />
          删除
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
          disabled={!canSave}
          onClick={onSave}
          type="button"
        >
          <Save size={15} />
          保存
        </button>
      </div>
    </section>
  );
}

