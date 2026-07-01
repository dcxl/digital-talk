import { Download } from "lucide-react";

interface DataExportPanelProps {
  isLoading: boolean;
  onExport: () => void;
}

export function DataExportPanel({
  isLoading,
  onExport,
}: DataExportPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Data Export</h3>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Conversations</p>
          <p className="mt-1 text-sm font-medium text-slate-900">JSON</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Knowledge</p>
          <p className="mt-1 text-sm font-medium text-slate-900">Metadata</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Settings</p>
          <p className="mt-1 text-sm font-medium text-slate-900">Included</p>
        </div>
      </div>
      <div className="flex justify-end border-t border-slate-200 p-4">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-60"
          disabled={isLoading}
          onClick={onExport}
          type="button"
        >
          <Download size={15} />
          Export
        </button>
      </div>
    </section>
  );
}
