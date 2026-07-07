import { GitBranch } from "lucide-react";
import type { CharacterItem } from "../types";

export function CharacterWorkflowPanel({
  character,
}: {
  character: CharacterItem | null;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <GitBranch size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">工作流</h3>
          <p className="mt-1 text-xs text-slate-500">
            {character ? `${character.counts.workflows} 个` : "未选择角色"}
          </p>
        </div>
      </div>
      <div className="p-4 text-sm text-slate-500">
        手动工作流将在 M41 接入。
      </div>
    </section>
  );
}

