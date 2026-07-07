import { Bot, BrainCircuit, Play } from "lucide-react";
import { AvatarRuntimeStage } from "@/features/avatar-runtime/components/avatar-runtime-stage";
import type { RuntimeState } from "@/core/runtime/events";
import type {
  AvatarFormState,
  AvatarPreviewResult,
  AvatarPreviewState,
} from "../types";
import {
  avatarBackgroundLabels,
  avatarDriverLabels,
  avatarPreviewStateLabels,
  avatarPreviewStates,
} from "./constants";

interface AvatarPreviewStageProps {
  form: AvatarFormState;
  isBusy: boolean;
  onPreview: (state: AvatarPreviewState) => void;
  preview: AvatarPreviewResult | null;
}

function getStateTone(state: AvatarPreviewState) {
  if (state === "speaking") return "bg-emerald-50 text-emerald-700";
  if (state === "thinking") return "bg-amber-50 text-amber-700";
  if (state === "interrupted") return "bg-violet-50 text-violet-700";
  if (state === "error") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export function AvatarPreviewStage({
  form,
  isBusy,
  onPreview,
  preview,
}: AvatarPreviewStageProps) {
  const state = preview?.state ?? "idle";
  const driverLabel = avatarDriverLabels[form.driver];
  const runtimeState = state as RuntimeState;
  const previewMouthOpen = state === "speaking" ? 0.7 : 0;
  const previewVolume = state === "speaking" ? 0.7 : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">预览舞台</h3>
          <p className="mt-1 text-xs text-slate-500">
            {driverLabel} · {avatarBackgroundLabels[form.background] ?? "影棚"}
          </p>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-medium ${getStateTone(state)}`}>
          {avatarPreviewStateLabels[state]}
        </span>
      </div>

      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 p-4">
        {form.id ? (
          <div className="w-full max-w-[520px]">
            <AvatarRuntimeStage
              avatarId={form.id}
              avatarImageUrl={form.previewImageUrl}
              avatarName={form.name}
              driver={form.driver}
              mouthOpen={previewMouthOpen}
              showDiagnostics
              state={runtimeState}
              volume={previewVolume}
            />
          </div>
        ) : (
          <>
            <div
              className={`relative flex size-56 items-center justify-center rounded-full border border-slate-200 bg-slate-50 ${
                state === "thinking" || state === "speaking" ? "avatar-ring" : ""
              }`}
            >
              {form.previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={form.name}
                  className="size-44 rounded-full object-cover"
                  src={form.previewImageUrl}
                />
              ) : (
                <div className="flex size-40 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl">
                  {state === "thinking" ? (
                    <BrainCircuit size={64} />
                  ) : (
                    <Bot size={72} />
                  )}
                </div>
              )}
            </div>

            <div className="flex h-12 items-end gap-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  className={`w-2 rounded-full bg-slate-900 ${
                    state === "speaking" ? "speak-bar" : "h-3 opacity-25"
                  }`}
                  key={item}
                  style={{ animationDelay: `${item * 90}ms` }}
                />
              ))}
            </div>
          </>
        )}

        <p className="min-h-6 text-center text-sm text-slate-600">
          {preview?.text ?? `你好，我是 ${form.name}`}
        </p>

        {preview?.runtime ? (
          <p className="text-xs text-slate-500">
            {preview.runtime.adapterName}
            {preview.runtime.fallbackDriver
              ? ` · 降级到 ${avatarDriverLabels[preview.runtime.fallbackDriver]}`
              : ""}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2">
          {avatarPreviewStates.map((previewState) => (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-60"
              disabled={!form.id || isBusy}
              key={previewState}
              onClick={() => onPreview(previewState)}
              type="button"
            >
              <Play size={14} />
              {avatarPreviewStateLabels[previewState]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
