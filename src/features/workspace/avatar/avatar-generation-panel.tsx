import { RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import type { AvatarGenerationJobItem } from "../types";

interface AvatarGenerationPanelProps {
  isBusy: boolean;
  lastJob: AvatarGenerationJobItem | null;
  onGenerate: (input: {
    negativePrompt?: string;
    prompt: string;
    style?: string;
  }) => void;
  onRetry: (job: AvatarGenerationJobItem) => void;
}

const styleOptions = ["portrait", "studio", "half-body", "anime", "realistic"];
const styleLabels: Record<string, string> = {
  anime: "动漫",
  "half-body": "半身像",
  portrait: "头像",
  realistic: "写实",
  studio: "影棚",
};

function getJobTone(job: AvatarGenerationJobItem) {
  if (job.status === "completed") return "bg-emerald-50 text-emerald-700";
  if (job.status === "failed") return "bg-red-50 text-red-700";
  if (job.status === "running") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function AvatarGenerationPanel({
  isBusy,
  lastJob,
  onGenerate,
  onRetry,
}: AvatarGenerationPanelProps) {
  const [negativePrompt, setNegativePrompt] = useState("");
  const [prompt, setPrompt] = useState("生成一个适合作为 AI 数字人的头像");
  const [style, setStyle] = useState(styleOptions[0]);
  const canGenerate = Boolean(prompt.trim()) && !isBusy;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">生成数字人</h3>
          <p className="mt-1 text-xs text-slate-500">
            静态数字人生成
          </p>
        </div>
        {lastJob ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${getJobTone(
              lastJob,
            )}`}
          >
            {lastJob.status}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px]">
        <label className="block text-xs font-medium text-slate-600 lg:col-span-2">
          提示词
          <textarea
            className="mt-1 min-h-24 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy}
            maxLength={1000}
            onChange={(event) => setPrompt(event.target.value)}
            value={prompt}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          负向提示词
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy}
            onChange={(event) => setNegativePrompt(event.target.value)}
            value={negativePrompt}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          风格
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy}
            onChange={(event) => setStyle(event.target.value)}
            value={style}
          >
            {styleOptions.map((option) => (
              <option key={option} value={option}>
                {styleLabels[option] ?? option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
        <p className="truncate text-xs text-slate-500">
          {lastJob?.errorMessage ?? lastJob?.resultAsset?.name ?? lastJob?.id ?? ""}
        </p>
        <div className="flex gap-2">
          {lastJob?.status === "failed" ? (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-60"
              disabled={isBusy}
              onClick={() => onRetry(lastJob)}
              type="button"
            >
              <RotateCcw size={15} />
              重试
            </button>
          ) : null}
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
            disabled={!canGenerate}
            onClick={() =>
              onGenerate({
                negativePrompt,
                prompt,
                style,
              })
            }
            type="button"
          >
            {isBusy ? (
              <RefreshCw className="animate-spin" size={15} />
            ) : (
              <Sparkles size={15} />
            )}
            生成并绑定
          </button>
        </div>
      </div>
    </section>
  );
}
