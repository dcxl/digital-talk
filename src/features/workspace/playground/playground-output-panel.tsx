interface PlaygroundOutputPanelProps {
  assistantText: string;
  isRunning: boolean;
}

export function PlaygroundOutputPanel({
  assistantText,
  isRunning,
}: PlaygroundOutputPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">输出</h3>
          <p className="mt-1 text-xs text-slate-500">助手流式文本</p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            isRunning ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isRunning ? "运行中" : "待机"}
        </span>
      </div>
      <div className="min-h-56 whitespace-pre-wrap p-4 text-sm leading-6 text-slate-800">
        {assistantText || (
          <span className="text-slate-400">等待运行结果</span>
        )}
      </div>
    </section>
  );
}
