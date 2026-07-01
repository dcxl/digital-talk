import { Save, ToggleLeft, ToggleRight } from "lucide-react";
import type { AvatarFormState, ProviderItem } from "../types";
import {
  avatarBackgroundOptions,
  avatarDriverOptions,
  avatarLanguageOptions,
} from "./constants";

interface AvatarConfigFormProps {
  avatarProviders: ProviderItem[];
  form: AvatarFormState;
  isBusy: boolean;
  onChange: (patch: Partial<AvatarFormState>) => void;
  onSave: () => void;
  statusText: string;
  voiceProviders: ProviderItem[];
}

export function AvatarConfigForm({
  avatarProviders,
  form,
  isBusy,
  onChange,
  onSave,
  statusText,
  voiceProviders,
}: AvatarConfigFormProps) {
  const canSave = Boolean(form.name.trim()) && form.driver === "static" && !isBusy;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Configuration</h3>
          <p className="mt-1 text-xs text-slate-500">
            {statusText || "Static Avatar 可配置，Live2D / VRM 暂未启用"}
          </p>
        </div>
        <button
          aria-checked={form.isDefault}
          className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium ${
            form.isDefault
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
          onClick={() => onChange({ isDefault: !form.isDefault })}
          role="switch"
          type="button"
        >
          {form.isDefault ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          Default
        </button>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          名称
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ name: event.target.value })}
            value={form.name}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Driver
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) =>
              onChange({ driver: event.target.value as AvatarFormState["driver"] })
            }
            value={form.driver}
          >
            {avatarDriverOptions.map((option) => (
              <option
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                {option.label}
                {option.disabled ? " (disabled)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Avatar Provider
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ providerConfigId: event.target.value })}
            value={form.providerConfigId}
          >
            <option value="">Static built-in</option>
            {avatarProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Voice Provider
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ voiceProviderId: event.target.value })}
            value={form.voiceProviderId}
          >
            <option value="">Mock TTS</option>
            {voiceProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Voice
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ voice: event.target.value })}
            value={form.voice}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Language
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ language: event.target.value })}
            value={form.language}
          >
            {avatarLanguageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Background
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ background: event.target.value })}
            value={form.background}
          >
            {avatarBackgroundOptions.map((background) => (
              <option key={background} value={background}>
                {background}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Status
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) =>
              onChange({ status: event.target.value as AvatarFormState["status"] })
            }
            value={form.status}
          >
            <option value="active">active</option>
            <option value="disabled">disabled</option>
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-600 md:col-span-2">
          Preview Image URL
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ previewImageUrl: event.target.value })}
            placeholder="https://..."
            value={form.previewImageUrl}
          />
        </label>
      </div>

      <div className="flex justify-end border-t border-slate-200 p-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
          disabled={!canSave}
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
