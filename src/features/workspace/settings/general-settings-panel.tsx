import { Save } from "lucide-react";
import type { GeneralSettingsState } from "../types";

interface GeneralSettingsPanelProps {
  form: GeneralSettingsState;
  isLoading: boolean;
  onChange: (patch: Partial<GeneralSettingsState>) => void;
  onSave: () => void;
  statusText: string;
}

export function GeneralSettingsPanel({
  form,
  isLoading,
  onChange,
  onSave,
  statusText,
}: GeneralSettingsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">通用设置</h3>
        <p className="mt-1 text-xs text-slate-500">{statusText || "工作台"}</p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          工作台名称
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ workspaceName: event.target.value })}
            value={form.workspaceName}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          语言
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ language: event.target.value })}
            value={form.language}
          >
            <option value="zh-CN">zh-CN</option>
            <option value="en-US">en-US</option>
            <option value="ja-JP">ja-JP</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          主题
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) =>
              onChange({
                theme: event.target.value as GeneralSettingsState["theme"],
              })
            }
            value={form.theme}
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          时区
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ timeZone: event.target.value })}
            value={form.timeZone}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={form.autoSave}
            onChange={(event) => onChange({ autoSave: event.target.checked })}
            type="checkbox"
          />
          自动保存
        </label>
      </div>
      <div className="flex justify-end border-t border-slate-200 p-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
          disabled={isLoading}
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
