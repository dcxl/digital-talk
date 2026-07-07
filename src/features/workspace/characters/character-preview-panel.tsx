import { MessageSquare, UserRound } from "lucide-react";
import type { CharacterItem } from "../types";
import { characterRoleLabels, characterStatusLabels } from "./constants";

export function CharacterPreviewPanel({
  character,
}: {
  character: CharacterItem | null;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">运行预览</h3>
        <p className="mt-1 text-xs text-slate-500">
          {character?.status
            ? characterStatusLabels[character.status] ?? character.status
            : "未保存"}
        </p>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
            {character?.appearance?.previewImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-full w-full object-cover"
                src={character.appearance.previewImageUrl}
              />
            ) : (
              <UserRound size={28} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">
              {character?.name ?? "未保存角色"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {character ? characterRoleLabels[character.roleType] : "自定义"}
            </p>
            <p className="mt-3 line-clamp-3 text-sm text-slate-600">
              {character?.description || "暂无角色简介"}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <MessageSquare size={14} />
            对话上下文
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {character?.defaultScene?.name ?? "普通角色对话"} ·{" "}
            {character?.voice.voice || "默认声音"}
          </p>
        </div>
      </div>
    </section>
  );
}

