import type { PromptType } from "../types";
import { promptTypeTabs } from "./constants";

interface PromptTypeTabsProps {
  activeType: PromptType;
  counts: Record<string, number>;
  onChange: (type: PromptType) => void;
}

export function PromptTypeTabs({
  activeType,
  counts,
  onChange,
}: PromptTypeTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
      {promptTypeTabs.map((tab) => {
        const isActive = activeType === tab.value;

        return (
          <button
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm ${
              isActive
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            type="button"
          >
            {tab.label}
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                isActive ? "bg-indigo-600 text-white" : "bg-slate-100"
              }`}
            >
              {counts[tab.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
