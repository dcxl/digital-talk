import { Plus, UserRound } from "lucide-react";
import type { CharacterItem } from "../types";
import { characterRoleLabels, characterStatusLabels } from "./constants";

interface CharacterListProps {
  characters: CharacterItem[];
  isBusy: boolean;
  onCreate: () => void;
  onSelect: (character: CharacterItem) => void;
  selectedCharacterId: string;
}

export function CharacterList({
  characters,
  isBusy,
  onCreate,
  onSelect,
  selectedCharacterId,
}: CharacterListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">AI 角色</h3>
          <p className="mt-1 text-xs text-slate-500">
            {characters.length} 个角色
          </p>
        </div>
        <button
          className="inline-flex size-9 items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-60"
          disabled={isBusy}
          onClick={onCreate}
          title="新建 AI 角色"
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {characters.map((character) => {
          const isSelected = selectedCharacterId === character.id;

          return (
            <button
              className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
              key={character.id}
              onClick={() => onSelect(character)}
              type="button"
            >
              {character.appearance?.previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-10 shrink-0 rounded-md object-cover"
                  src={character.appearance.previewImageUrl}
                />
              ) : (
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <UserRound size={18} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="truncate text-sm font-medium text-slate-900">
                  {character.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {characterRoleLabels[character.roleType]} ·{" "}
                  {character.defaultScene?.name ?? "未绑定场景"}
                </span>
                <span className="mt-2 block text-xs text-slate-400">
                  {characterStatusLabels[character.status] ?? character.status} ·{" "}
                  {character.counts.memories} 条记忆
                </span>
              </span>
            </button>
          );
        })}
        {characters.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">暂无 AI 角色</div>
        ) : null}
      </div>
    </section>
  );
}

