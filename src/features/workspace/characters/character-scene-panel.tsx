import { BookOpen, Link2 } from "lucide-react";
import type { CharacterItem } from "../types";

export function CharacterScenePanel({
  character,
}: {
  character: CharacterItem | null;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Link2 size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">场景</h3>
          <p className="mt-1 text-xs text-slate-500">
            {character?.defaultScene?.name ?? "未绑定默认场景"}
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {character?.sceneBindings.map((binding) => (
          <div className="flex items-start gap-3 p-4" key={binding.id}>
            <BookOpen className="mt-0.5 text-slate-400" size={16} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {binding.scene.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {binding.scene.type} · {binding.scene.inputMode}/
                {binding.scene.outputMode}
              </p>
            </div>
          </div>
        ))}
        {!character?.sceneBindings.length ? (
          <div className="p-4 text-sm text-slate-500">暂无场景绑定</div>
        ) : null}
      </div>
    </section>
  );
}

