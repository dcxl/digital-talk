import type { PlaygroundEventLog } from "./types";

interface RuntimeEventsPanelProps {
  events: PlaygroundEventLog[];
}

export function RuntimeEventsPanel({ events }: RuntimeEventsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Runtime Events</h3>
        <p className="mt-1 text-xs text-slate-500">SSE event stream</p>
      </div>
      <div className="max-h-[520px] divide-y divide-slate-100 overflow-auto">
        {events.map((entry) => (
          <details className="group px-4 py-3" key={entry.id}>
            <summary className="cursor-pointer list-none">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-900">
                  {entry.event.type}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(entry.at).toLocaleTimeString("zh-CN")}
                </span>
              </span>
            </summary>
            <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
              {JSON.stringify(entry.event, null, 2)}
            </pre>
          </details>
        ))}
        {events.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">暂无事件</div>
        ) : null}
      </div>
    </section>
  );
}
