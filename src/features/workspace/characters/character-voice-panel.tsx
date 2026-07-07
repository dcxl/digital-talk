import { Volume2 } from "lucide-react";
import type { CharacterFormState, ProviderItem } from "../types";

interface CharacterVoicePanelProps {
  form: CharacterFormState;
  onChange: (patch: Partial<CharacterFormState>) => void;
  voiceProviders: ProviderItem[];
}

export function CharacterVoicePanel({
  form,
  onChange,
  voiceProviders,
}: CharacterVoicePanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
          <Volume2 size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">声音</h3>
          <p className="mt-1 text-xs text-slate-500">
            {form.voice || "未配置音色"}
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <label className="block text-xs font-medium text-slate-600">
          Provider
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ voiceProviderId: event.target.value })}
            value={form.voiceProviderId}
          >
            <option value="">环境默认</option>
            {voiceProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          音色
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ voice: event.target.value })}
            value={form.voice}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          语言
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ language: event.target.value })}
            value={form.language}
          />
        </label>
      </div>
    </section>
  );
}

