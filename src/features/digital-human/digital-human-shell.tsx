"use client";

import {
  Bot,
  BrainCircuit,
  CircleStop,
  Mic,
  Play,
  Send,
  Settings,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, RuntimeEvent, RuntimeState } from "./types";

const suggestions = [
  "介绍一下 Next Digital Human",
  "如何接入一个新的 LLM Provider？",
  "MVP 第一阶段应该先做什么？",
];

const stateLabel: Record<RuntimeState, string> = {
  idle: "待机",
  thinking: "思考中",
  streaming: "生成中",
  synthesizing: "合成语音",
  speaking: "说话中",
  interrupted: "已打断",
  error: "异常",
};

const stateTone: Record<RuntimeState, string> = {
  idle: "bg-slate-100 text-slate-700",
  thinking: "bg-amber-100 text-amber-800",
  streaming: "bg-blue-100 text-blue-800",
  synthesizing: "bg-cyan-100 text-cyan-800",
  speaking: "bg-emerald-100 text-emerald-800",
  interrupted: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-800",
};

function parseRuntimeEvent(block: string): RuntimeEvent | null {
  const dataLines = block
    .replaceAll("\r", "")
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) return null;

  try {
    return JSON.parse(dataLines.join("\n")) as RuntimeEvent;
  } catch {
    return null;
  }
}

export function DigitalHumanShell() {
  const [state, setState] = useState<RuntimeState>("idle");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "你好，我是 Next Digital Human 的原型助手。现在可以先体验文本对话、流式输出和 Avatar 状态变化。",
      status: "completed",
    },
  ]);
  const abortRef = useRef<AbortController | null>(null);
  const activeAssistantRef = useRef<string | null>(null);

  const canSend = state === "idle" || state === "speaking" || state === "error";
  const isBusy = ["thinking", "streaming", "synthesizing"].includes(state);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const latestStatus = useMemo(() => {
    if (state === "speaking") return "Avatar 正在播报回复";
    if (state === "streaming") return "LLM 正在流式生成";
    if (state === "thinking") return "请求已提交，等待首包";
    if (state === "error") return "服务端调用异常，可重试";
    return "准备接收新的问题";
  }, [state]);

  function applyRuntimeEvent(event: RuntimeEvent, assistantId: string) {
    if (event.type === "text.delta") {
      setState("streaming");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: message.content + event.text,
                status: "streaming",
              }
            : message,
        ),
      );
      return;
    }

    if (event.type === "text.done") {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, status: "completed" }
            : message,
        ),
      );
      return;
    }

    if (event.type === "tts.started") {
      setState("synthesizing");
      return;
    }

    if (event.type === "tts.done") {
      setState("speaking");
      window.setTimeout(() => {
        setState((current) => (current === "speaking" ? "idle" : current));
      }, 1800);
      return;
    }

    if (event.type === "avatar.state") {
      setState(event.state);
      return;
    }

    if (event.type === "error") {
      setState("error");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: message.content || event.message,
                status: "failed",
              }
            : message,
        ),
      );
    }
  }

  async function consumeRuntimeStream(response: Response, assistantId: string) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is empty");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const event = parseRuntimeEvent(block);
        if (event) applyRuntimeEvent(event, assistantId);
      }
    }

    buffer += decoder.decode();
    const event = parseRuntimeEvent(buffer);
    if (event) applyRuntimeEvent(event, assistantId);
  }

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || !canSend) return;

    abortRef.current?.abort();
    setInput("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      status: "completed",
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      status: "pending",
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setState("thinking");
    activeAssistantRef.current = assistantId;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({ message: content }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      await consumeRuntimeStream(response, assistantId);
    } catch (error) {
      if (controller.signal.aborted) {
        markInterrupted(assistantId);
        return;
      }

      setState("error");
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  error instanceof Error ? error.message : "Runtime request failed",
                status: "failed",
              }
            : message,
        ),
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      if (activeAssistantRef.current === assistantId) {
        activeAssistantRef.current = null;
      }
    }
  }

  function markInterrupted(messageId?: string) {
    setMessages((current) =>
      current.map((message) =>
        message.role === "assistant" &&
        (messageId
          ? message.id === messageId
          : message.status === "pending" || message.status === "streaming")
          ? { ...message, status: "interrupted" }
          : message,
      ),
    );
    setState("interrupted");
    window.setTimeout(() => setState("idle"), 500);
  }

  function interrupt() {
    abortRef.current?.abort();
    markInterrupted(activeAssistantRef.current ?? undefined);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-950">
                Next Digital Human
              </h1>
              <p className="text-xs text-slate-500">Open source AI avatar runtime</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm sm:flex">
              <Sparkles size={16} />
              OpenAI Compatible
            </button>
            <button className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Avatar Stage</h2>
              <p className="mt-1 text-xs text-slate-500">{latestStatus}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${stateTone[state]}`}
            >
              {stateLabel[state]}
            </span>
          </div>

          <div className="flex min-h-[410px] flex-col items-center justify-center gap-6">
            <div
              className={`relative flex size-56 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 ${
                state === "thinking" || state === "speaking" ? "avatar-ring" : ""
              }`}
            >
              <div className="relative z-10 flex size-40 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl">
                {state === "thinking" || state === "streaming" ? (
                  <BrainCircuit size={64} />
                ) : (
                  <Bot size={72} />
                )}
              </div>
            </div>

            <div className="flex h-12 items-end gap-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={`w-2 rounded-full bg-slate-900 ${
                    state === "speaking" ? "speak-bar" : "h-3 opacity-25"
                  }`}
                  style={{ animationDelay: `${item * 90}ms` }}
                />
              ))}
            </div>

            <div className="grid w-full grid-cols-3 gap-2 text-center text-xs text-slate-500">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-800">LLM</p>
                <p>server stream</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-800">TTS</p>
                <p>event mock</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-800">Avatar</p>
                <p>static</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[520px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-950">Conversation</h2>
            <p className="mt-1 text-xs text-slate-500">
              MVP preview: API stream, text delta, TTS state, avatar events.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  {message.status === "streaming" ? (
                    <span className="mt-2 inline-flex text-xs text-blue-600">
                      generating...
                    </span>
                  ) : null}
                  {message.status === "interrupted" ? (
                    <span className="mt-2 inline-flex text-xs text-orange-600">
                      interrupted
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  disabled={!canSend}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
                disabled={state !== "idle"}
                title="语音输入"
              >
                <Mic size={18} />
              </button>
              <textarea
                className="min-h-11 flex-1 resize-none rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
                placeholder="输入一个问题，体验数字人对话闭环"
                rows={1}
                value={input}
                disabled={!canSend}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
              {isBusy || state === "speaking" ? (
                <button
                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-orange-600 text-white"
                  onClick={interrupt}
                  title="停止"
                >
                  <CircleStop size={18} />
                </button>
              ) : (
                <button
                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-40"
                  disabled={!input.trim() || !canSend}
                  onClick={() => sendMessage(input)}
                  title="发送"
                >
                  <Send size={18} />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Play size={14} /> stream
              </span>
              <span className="inline-flex items-center gap-1">
                <Volume2 size={14} /> tts
              </span>
              <span>Enter 发送，Shift + Enter 换行</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
