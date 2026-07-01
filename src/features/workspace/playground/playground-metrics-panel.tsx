import type { PlaygroundMetrics } from "./types";

interface PlaygroundMetricsPanelProps {
  metrics: PlaygroundMetrics;
}

export function PlaygroundMetricsPanel({ metrics }: PlaygroundMetricsPanelProps) {
  const items = [
    {
      label: "Latency",
      value: metrics.totalLatencyMs ? `${metrics.totalLatencyMs}ms` : "-",
    },
    {
      label: "First Token",
      value: metrics.firstTokenMs ? `${metrics.firstTokenMs}ms` : "-",
    },
    {
      label: "Tokens",
      value: metrics.totalTokens || "-",
    },
    {
      label: "Events",
      value: metrics.eventCount,
    },
    {
      label: "RAG Hits",
      value: metrics.ragHitCount,
    },
    {
      label: "TTS",
      value: metrics.ttsLatencyMs ? `${metrics.ttsLatencyMs}ms` : "-",
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">Metrics</h3>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div className="rounded-md bg-slate-50 p-3" key={item.label}>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
