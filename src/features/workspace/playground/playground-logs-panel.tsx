import type { PlaygroundLogLine } from "./types";

interface PlaygroundLogsPanelProps {
  logs: PlaygroundLogLine[];
}

function getTone(level: PlaygroundLogLine["level"]) {
  if (level === "error") return "text-red-600";
  if (level === "success") return "text-emerald-700";
  return "text-slate-600";
}

export function PlaygroundLogsPanel({ logs }: PlaygroundLogsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">日志</h3>
      </div>
      <div className="max-h-64 divide-y divide-slate-100 overflow-auto">
        {logs.map((log) => (
          <div className="px-4 py-3" key={log.id}>
            <p className={`text-sm ${getTone(log.level)}`}>{log.message}</p>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(log.at).toLocaleTimeString("zh-CN")}
            </p>
          </div>
        ))}
        {logs.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">暂无日志</div>
        ) : null}
      </div>
    </section>
  );
}
