import { Bot, Plus } from "lucide-react";
import type { AvatarProfileItem } from "../types";
import { avatarBackgroundLabels, avatarStatusLabels } from "./constants";

interface AvatarListProps {
  isBusy: boolean;
  onCreate: () => void;
  onSelect: (profile: AvatarProfileItem) => void;
  profiles: AvatarProfileItem[];
  selectedProfileId: string;
}

export function AvatarList({
  isBusy,
  onCreate,
  onSelect,
  profiles,
  selectedProfileId,
}: AvatarListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">AI 角色</h3>
          <p className="mt-1 text-xs text-slate-500">{profiles.length} 个角色</p>
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
        {profiles.map((profile) => {
          const isSelected = selectedProfileId === profile.id;

          return (
            <button
              className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
              key={profile.id}
              onClick={() => onSelect(profile)}
              type="button"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Bot size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {profile.name}
                  </span>
                  {profile.isDefault ? (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      默认
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {profile.driver} · {profile.language ?? "未配置语言"}
                </span>
                <span className="mt-2 block text-xs text-slate-400">
                  {avatarBackgroundLabels[profile.background ?? "studio"] ??
                    profile.background ??
                    "影棚"}{" "}
                  · {avatarStatusLabels[profile.status] ?? profile.status}
                </span>
              </span>
            </button>
          );
        })}
        {profiles.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">暂无 AI 角色</div>
        ) : null}
      </div>
    </section>
  );
}
