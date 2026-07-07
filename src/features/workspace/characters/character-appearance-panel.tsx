import { ImageIcon } from "lucide-react";
import type { AvatarProfileItem, CharacterFormState } from "../types";

interface CharacterAppearancePanelProps {
  appearanceProfiles: AvatarProfileItem[];
  form: CharacterFormState;
  onChange: (patch: Partial<CharacterFormState>) => void;
}

export function CharacterAppearancePanel({
  appearanceProfiles,
  form,
  onChange,
}: CharacterAppearancePanelProps) {
  const selected = appearanceProfiles.find(
    (profile) => profile.id === form.appearanceProfileId,
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">外观资产</h3>
        <p className="mt-1 text-xs text-slate-500">
          {selected?.name ?? "未绑定外观"}
        </p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {selected?.previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover"
              src={selected.previewImageUrl}
            />
          ) : (
            <ImageIcon className="text-slate-400" size={28} />
          )}
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-slate-600">
            已有外观
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
              onChange={(event) =>
                onChange({ appearanceProfileId: event.target.value })
              }
              value={form.appearanceProfileId}
            >
              <option value="">不绑定</option>
              {appearanceProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
            ComfyUI 生成入口将在 Provider 边界完成后接入。
          </div>
        </div>
      </div>
    </section>
  );
}

