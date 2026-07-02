"use client";

import type { AvatarRuntimeSnapshot } from "../types";

interface RuntimeDiagnosticsProps {
  renderError?: null | string;
  runtime: AvatarRuntimeSnapshot;
}

function formatValue(value?: null | number | string) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export function RuntimeDiagnostics({
  renderError,
  runtime,
}: RuntimeDiagnosticsProps) {
  const errors = [
    ...(runtime.diagnostics?.errors ?? []),
    ...(renderError ? [renderError] : []),
  ];
  const warnings = runtime.diagnostics?.warnings ?? [];

  return (
    <div className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="grid gap-2 sm:grid-cols-4">
        <div>
          <p className="font-medium text-slate-900">驱动</p>
          <p>{runtime.driver}</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">资产</p>
          <p>{formatValue(runtime.asset?.id)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">降级</p>
          <p>{formatValue(runtime.fallbackDriver)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">耗时</p>
          <p>{runtime.loadLatencyMs} ms</p>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-red-700">
          {errors.slice(0, 3).join("；")}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-700">
          {warnings.slice(0, 3).join("；")}
        </div>
      ) : null}
    </div>
  );
}
