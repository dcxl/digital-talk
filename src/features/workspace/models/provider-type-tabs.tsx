import type { ProviderType } from "../types";
import { providerTypeTabs } from "./constants";

interface ProviderTypeTabsProps {
  activeType: ProviderType;
  counts: Record<string, number>;
  onChange: (type: ProviderType) => void;
}

export function ProviderTypeTabs({
  activeType,
  counts,
  onChange,
}: ProviderTypeTabsProps) {
  return (
    <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-4">
      {providerTypeTabs.map((tab) => {
        const isActive = activeType === tab.value;

        return (
          <button
            className={`rounded-md border p-3 text-left transition ${
              isActive
                ? "border-indigo-200 bg-indigo-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            type="button"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {tab.label}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[tab.value] ?? 0}
              </span>
            </span>
            <span className="mt-2 block text-sm text-slate-700">
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
