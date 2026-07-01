import { RefreshCw } from "lucide-react";

export function PageFrame({
  actions,
  children,
  eyebrow,
  title,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-indigo-600">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

export function RefreshButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm disabled:opacity-60"
      disabled={isLoading}
      onClick={onClick}
      type="button"
    >
      <RefreshCw className={isLoading ? "animate-spin" : ""} size={15} />
      刷新
    </button>
  );
}
