import { Database } from "lucide-react";
import type { CharacterItem } from "../types";

export function CharacterMemoryPanel({
  character,
}: {
  character: CharacterItem | null;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Database size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">记忆</h3>
          <p className="mt-1 text-xs text-slate-500">
            {character ? `${character.counts.memories} 条` : "未选择角色"}
          </p>
        </div>
      </div>
      <div className="p-4 text-sm text-slate-500">
        手动记忆管理将在 M40 接入。
      </div>
    </section>
  );
}

