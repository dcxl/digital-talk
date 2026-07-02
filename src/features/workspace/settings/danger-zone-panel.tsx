import { Trash2 } from "lucide-react";

export function DangerZonePanel() {
  return (
    <section className="rounded-lg border border-red-200 bg-white shadow-sm">
      <div className="border-b border-red-100 p-4">
        <h3 className="text-sm font-semibold text-red-700">危险操作</h3>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-950">删除工作台</p>
          <p className="mt-1 text-xs text-slate-500">MVP 阶段暂未启用</p>
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm text-red-400 disabled:opacity-60"
          disabled
          type="button"
        >
          <Trash2 size={15} />
          删除
        </button>
      </div>
    </section>
  );
}
