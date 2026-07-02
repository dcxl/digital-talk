import { useEffect, useMemo, useRef, useState } from "react";
import type { RuntimeEvent } from "@/core/runtime/events";
import {
  readKnowledgeBases,
  readProviders,
} from "../lib/api";
import type { KnowledgeBaseItem, ProviderItem } from "../types";
import type {
  PlaygroundEventLog,
  PlaygroundFormState,
  PlaygroundLogLine,
  PlaygroundMetrics,
} from "./types";
import {
  consumePlaygroundStream,
  createLogLine,
  initialForm,
  initialMetrics,
} from "./runtime-stream";

export function usePlaygroundRun() {
  const [assistantText, setAssistantText] = useState("");
  const [eventLogs, setEventLogs] = useState<PlaygroundEventLog[]>([]);
  const [form, setForm] = useState<PlaygroundFormState>(initialForm);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [logs, setLogs] = useState<PlaygroundLogLine[]>([]);
  const [metrics, setMetrics] = useState<PlaygroundMetrics>(initialMetrics);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef(0);
  const ttsStartedAtRef = useRef<number | null>(null);

  const llmProviders = useMemo(
    () => providers.filter((provider) => provider.type === "llm"),
    [providers],
  );

  function updateForm(patch: Partial<PlaygroundFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function loadOptions() {
    const [nextProviders, nextKnowledgeBases] = await Promise.all([
      readProviders(),
      readKnowledgeBases(),
    ]);

    setProviders(nextProviders);
    setKnowledgeBases(nextKnowledgeBases);
    setForm((current) => ({
      ...current,
      modelProviderId:
        current.modelProviderId ||
        nextProviders.find((provider) => provider.type === "llm")?.id ||
        "",
      knowledgeBaseId:
        current.knowledgeBaseId && nextKnowledgeBases.some((item) => {
          return item.id === current.knowledgeBaseId;
        })
          ? current.knowledgeBaseId
          : "",
    }));
  }

  function applyRuntimeEvent(event: RuntimeEvent) {
    const at = new Date().toISOString();

    setEventLogs((current) => [
      {
        at,
        event,
        id: crypto.randomUUID(),
      },
      ...current,
    ]);
    setMetrics((current) => ({
      ...current,
      eventCount: current.eventCount + 1,
    }));

    if (event.type === "text.delta") {
      setAssistantText((current) => current + event.text);
      setMetrics((current) => ({
        ...current,
        firstTokenMs: current.firstTokenMs ?? Date.now() - startedAtRef.current,
      }));
      return;
    }

    if (event.type === "usage") {
      setMetrics((current) => ({
        ...current,
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        totalTokens: event.totalTokens,
      }));
      return;
    }

    if (event.type === "rag.retrieve.completed") {
      setMetrics((current) => ({
        ...current,
        ragHitCount: event.chunks.length,
      }));
      return;
    }

    if (event.type === "tts.started") {
      ttsStartedAtRef.current = Date.now();
      return;
    }

    if (event.type === "tts.done" && ttsStartedAtRef.current) {
      setMetrics((current) => ({
        ...current,
        ttsLatencyMs: Date.now() - (ttsStartedAtRef.current ?? Date.now()),
      }));
      return;
    }

    if (event.type === "done") {
      setMetrics((current) => ({
        ...current,
        totalLatencyMs: Date.now() - startedAtRef.current,
      }));
      setLogs((current) => [
        createLogLine("运行完成", "success"),
        ...current,
      ]);
      return;
    }

    if (event.type === "error") {
      setLogs((current) => [
        createLogLine(event.message, "error"),
        ...current,
      ]);
    }
  }

  async function runPlayground() {
    const message = form.message.trim();
    if (!message || isRunning) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    startedAtRef.current = Date.now();
    ttsStartedAtRef.current = null;

    setAssistantText("");
    setEventLogs([]);
    setMetrics(initialMetrics);
    setLogs([createLogLine("运行请求已开始")]);
    setIsRunning(true);

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          enableTTS: form.enableTTS,
          knowledgeBaseId: form.knowledgeBaseId || undefined,
          message,
          modelProviderId: form.modelProviderId || undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`请求失败：${response.status}`);

      await consumePlaygroundStream(response, applyRuntimeEvent);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLogs((current) => [
          createLogLine(
            error instanceof Error ? error.message : "运行请求失败",
            "error",
          ),
          ...current,
        ]);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsRunning(false);
    }
  }

  function stopPlayground() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
    setLogs((current) => [createLogLine("运行已中断"), ...current]);
  }

  function clearRun() {
    setAssistantText("");
    setEventLogs([]);
    setLogs([]);
    setMetrics(initialMetrics);
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) return;
      await loadOptions();
    });

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  return {
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
  };
}
