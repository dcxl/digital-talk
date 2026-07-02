"use client";

import { RefreshButton } from "../components/page-frame";
import { PageFrame } from "../components/page-frame";
import { PlaygroundControlPanel } from "../playground/playground-control-panel";
import { PlaygroundLogsPanel } from "../playground/playground-logs-panel";
import { PlaygroundMetricsPanel } from "../playground/playground-metrics-panel";
import { PlaygroundOutputPanel } from "../playground/playground-output-panel";
import { RuntimeEventsPanel } from "../playground/runtime-events-panel";
import { usePlaygroundRun } from "../playground/use-playground-run";

export function PlaygroundPage() {
  const {
    assistantText,
    clearRun,
    eventLogs,
    form,
    isRunning,
    knowledgeBases,
    llmProviders,
    loadOptions,
    logs,
    metrics,
    runPlayground,
    stopPlayground,
    updateForm,
  } = usePlaygroundRun();

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isRunning}
          onClick={() => void loadOptions()}
        />
      }
      eyebrow="调试"
      title="调试中心"
    >
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <PlaygroundControlPanel
            form={form}
            isRunning={isRunning}
            knowledgeBases={knowledgeBases}
            llmProviders={llmProviders}
            onChange={updateForm}
            onClear={clearRun}
            onRun={() => void runPlayground()}
            onStop={stopPlayground}
          />
          <PlaygroundMetricsPanel metrics={metrics} />
          <PlaygroundLogsPanel logs={logs} />
        </div>
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <PlaygroundOutputPanel
            assistantText={assistantText}
            isRunning={isRunning}
          />
          <RuntimeEventsPanel events={eventLogs} />
        </div>
      </div>
    </PageFrame>
  );
}
