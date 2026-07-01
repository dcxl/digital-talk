"use client";

import {
  BookOpen,
  Bot,
  BrainCircuit,
  CircleStop,
  CheckCircle2,
  FolderPlus,
  History,
  Mic,
  Plus,
  Play,
  RefreshCw,
  Save,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, RuntimeEvent, RuntimeState } from "./types";

const suggestions = [
  "介绍一下 Next Digital Human",
  "如何接入一个新的 LLM Provider？",
  "MVP 第一阶段应该先做什么？",
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 Next Digital Human 的原型助手。现在可以先体验文本对话、流式输出和 Avatar 状态变化。",
  status: "completed",
};

interface ProviderSummary {
  id: string;
  type: string;
  provider: string;
  name: string;
  enabled: boolean;
  baseUrl?: string | null;
  model?: string | null;
  hasApiKey: boolean;
  source?: string;
}

interface ProviderFormState {
  id?: string;
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  lastMessageAt?: string | null;
}

interface PersistedMessage {
  id: string;
  role: string;
  content: string;
  status: ChatMessage["status"];
}

interface ConversationDetail extends ConversationSummary {
  knowledgeBaseId?: string | null;
  messages: PersistedMessage[];
}

interface KnowledgeBaseSummary {
  id: string;
  name: string;
  description?: string | null;
  documentCount: number;
  chunkCount: number;
}

interface KnowledgeDocumentSummary {
  id: string;
  name: string;
  originalName: string;
  status: string;
  chunkCount: number;
}

const stateLabel: Record<RuntimeState, string> = {
  idle: "待机",
  listening: "录音中",
  transcribing: "转写中",
  thinking: "思考中",
  streaming: "生成中",
  synthesizing: "合成语音",
  speaking: "说话中",
  interrupted: "已打断",
  error: "异常",
};

const stateTone: Record<RuntimeState, string> = {
  idle: "bg-slate-100 text-slate-700",
  listening: "bg-violet-100 text-violet-800",
  transcribing: "bg-fuchsia-100 text-fuchsia-800",
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
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyStatus, setHistoryStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseSummary[]>(
    [],
  );
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState("");
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<
    KnowledgeDocumentSummary[]
  >([]);
  const [knowledgeName, setKnowledgeName] = useState("");
  const [knowledgeStatus, setKnowledgeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [knowledgeStatusText, setKnowledgeStatusText] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [providerForm, setProviderForm] = useState<ProviderFormState>({
    name: "DeepSeek",
    provider: "openai-compatible",
    baseUrl: "",
    model: "",
    apiKey: "",
  });
  const [providerStatus, setProviderStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [providerStatusText, setProviderStatusText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const abortRef = useRef<AbortController | null>(null);
  const activeAssistantRef = useRef<string | null>(null);
  const persistedAssistantRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const knowledgeFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const canSend = state === "idle" || state === "speaking" || state === "error";
  const isBusy = ["thinking", "streaming", "synthesizing", "transcribing"].includes(
    state,
  );
  const selectedKnowledgeBase = knowledgeBases.find(
    (knowledgeBase) => knowledgeBase.id === selectedKnowledgeBaseId,
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    void loadConversations();
    void loadKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKnowledgeBaseId) {
      void loadKnowledgeDocuments(selectedKnowledgeBaseId);
    } else {
      setKnowledgeDocuments([]);
    }
  }, [selectedKnowledgeBaseId]);

  const latestStatus = useMemo(() => {
    if (state === "speaking") return "Avatar 正在播报回复";
    if (state === "listening") return "正在接收麦克风输入";
    if (state === "transcribing") return "ASR 正在转写语音";
    if (state === "streaming") return "LLM 正在流式生成";
    if (state === "thinking") return "请求已提交，等待首包";
    if (state === "error") return "服务端调用异常，可重试";
    return "准备接收新的问题";
  }, [state]);

  async function loadProviders() {
    setProviderStatus("loading");

    try {
      const response = await fetch("/api/providers");
      const payload = (await response.json()) as {
        data?: {
          providers?: ProviderSummary[];
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      const nextProviders = payload.data?.providers ?? [];
      const editableProvider =
        nextProviders.find((provider) => provider.source !== "env") ??
        nextProviders[0];

      setProviders(nextProviders);
      if (editableProvider) {
        setProviderForm((current) => ({
          id:
            editableProvider.source === "env" ? undefined : editableProvider.id,
          name:
            editableProvider.source === "env"
              ? "DeepSeek"
              : editableProvider.name || current.name,
          provider:
            editableProvider.provider === "openai"
              ? "openai-compatible"
              : editableProvider.provider || current.provider,
          baseUrl: editableProvider.baseUrl ?? current.baseUrl,
          model: editableProvider.model ?? current.model,
          apiKey: "",
        }));
      }
      setProviderStatus("success");
      setProviderStatusText("配置已加载");
    } catch (error) {
      setProviderStatus("error");
      setProviderStatusText(
        error instanceof Error ? error.message : "加载 Provider 失败",
      );
    }
  }

  async function loadConversations() {
    setHistoryStatus("loading");

    try {
      const response = await fetch("/api/conversations");
      const payload = (await response.json()) as {
        data?: {
          conversations?: ConversationSummary[];
        };
      };

      if (!response.ok) throw new Error("Failed to load conversations");

      setConversations(payload.data?.conversations ?? []);
      setHistoryStatus("idle");
    } catch {
      setHistoryStatus("error");
    }
  }

  async function loadKnowledgeBases() {
    setKnowledgeStatus("loading");

    try {
      const response = await fetch("/api/knowledge-bases");
      const payload = (await response.json()) as {
        data?: {
          knowledgeBases?: KnowledgeBaseSummary[];
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setKnowledgeBases(payload.data?.knowledgeBases ?? []);
      setKnowledgeStatus("success");
      setKnowledgeStatusText("知识库已同步");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "加载知识库失败",
      );
    }
  }

  async function loadKnowledgeDocuments(knowledgeBaseId: string) {
    setKnowledgeStatus("loading");

    try {
      const response = await fetch(
        `/api/knowledge-bases/${knowledgeBaseId}/documents`,
      );
      const payload = (await response.json()) as {
        data?: {
          documents?: KnowledgeDocumentSummary[];
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setKnowledgeDocuments(payload.data?.documents ?? []);
      setKnowledgeStatus("success");
      setKnowledgeStatusText("文档已同步");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "加载文档失败",
      );
    }
  }

  async function createKnowledgeBase() {
    const name = knowledgeName.trim();
    if (!name) return;

    setKnowledgeStatus("loading");

    try {
      const response = await fetch("/api/knowledge-bases", {
        body: JSON.stringify({
          name,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          knowledgeBase?: KnowledgeBaseSummary;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok || !payload.data?.knowledgeBase) {
        throw new Error(payload.error?.message);
      }

      setKnowledgeBases((current) => [payload.data!.knowledgeBase!, ...current]);
      setSelectedKnowledgeBaseId(payload.data.knowledgeBase.id);
      setKnowledgeName("");
      setKnowledgeStatus("success");
      setKnowledgeStatusText("知识库已创建");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "创建知识库失败",
      );
    }
  }

  async function uploadKnowledgeDocument(file: File) {
    if (!selectedKnowledgeBaseId) return;

    setKnowledgeStatus("loading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/knowledge-bases/${selectedKnowledgeBaseId}/documents`,
        {
          body: formData,
          method: "POST",
        },
      );
      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      await loadKnowledgeBases();
      await loadKnowledgeDocuments(selectedKnowledgeBaseId);
      setKnowledgeStatus("success");
      setKnowledgeStatusText("文档已上传");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "上传文档失败",
      );
    } finally {
      if (knowledgeFileInputRef.current) {
        knowledgeFileInputRef.current.value = "";
      }
    }
  }

  async function openConversation(nextConversationId: string) {
    if (!canSend) return;

    stopAudio();
    setHistoryStatus("loading");

    try {
      const response = await fetch(`/api/conversations/${nextConversationId}`);
      const payload = (await response.json()) as {
        data?: {
          conversation?: ConversationDetail | null;
        };
      };

      if (!response.ok || !payload.data?.conversation) {
        throw new Error("Conversation not found");
      }

      setConversationId(payload.data.conversation.id);
      setSelectedKnowledgeBaseId(payload.data.conversation.knowledgeBaseId ?? "");
      setMessages(
        payload.data.conversation.messages
          .filter(
            (message) => message.role === "user" || message.role === "assistant",
          )
          .map((message) => ({
            id: message.id,
            role: message.role as ChatMessage["role"],
            content: message.content,
            status: message.status,
          })),
      );
      setState("idle");
      setHistoryStatus("idle");
    } catch {
      setHistoryStatus("error");
    }
  }

  function startNewConversation() {
    if (!canSend) return;

    stopAudio();
    setConversationId(undefined);
    setMessages([welcomeMessage]);
    setState("idle");
  }

  async function deleteCurrentConversation() {
    if (!conversationId || !canSend) return;

    setHistoryStatus("loading");

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setConversationId(undefined);
      setMessages([welcomeMessage]);
      setHistoryStatus("idle");
      await loadConversations();
    } catch {
      setHistoryStatus("error");
    }
  }

  async function transcribeAudio(audio: Blob) {
    setState("transcribing");

    try {
      const formData = new FormData();
      formData.append("audio", audio, "recording.webm");
      formData.append("language", "zh");

      const response = await fetch("/api/asr", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          text?: string;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setInput(payload.data?.text ?? "");
      setState("idle");
    } catch (error) {
      setState("error");
      setInput(error instanceof Error ? error.message : "ASR 转写失败");
    }
  }

  async function startListening() {
    if (state === "speaking") stopAudio();

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        const audio = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];

        if (audio.size > 0) {
          void transcribeAudio(audio);
        } else {
          setState("idle");
        }
      };

      recorder.start();
      setState("listening");
    } catch {
      setState("error");
    }
  }

  function stopListening() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.stop();
  }

  function toggleListening() {
    if (state === "listening") {
      stopListening();
      return;
    }

    if (canSend) void startListening();
  }

  async function testProvider() {
    setProviderStatus("loading");

    try {
      const endpoint = providerForm.id
        ? `/api/providers/${providerForm.id}/test`
        : "/api/providers/test";
      const response = await fetch(endpoint, {
        body: JSON.stringify(
          providerForm.id
            ? {
                input: "回复 provider ok",
              }
            : {
                apiKey: providerForm.apiKey,
                baseUrl: providerForm.baseUrl,
                message: "回复 provider ok",
                model: providerForm.model,
                provider: providerForm.provider,
                type: "llm",
              },
        ),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          result?: {
            latencyMs: number;
            sample: string;
          };
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setProviderStatus("success");
      setProviderStatusText(
        `测试通过 ${payload.data?.result?.latencyMs ?? 0}ms`,
      );
    } catch (error) {
      setProviderStatus("error");
      setProviderStatusText(
        error instanceof Error ? error.message : "Provider 测试失败",
      );
    }
  }

  async function saveProvider() {
    setProviderStatus("loading");

    try {
      const response = await fetch("/api/providers", {
        body: JSON.stringify({
          id: providerForm.id,
          type: "llm",
          provider: providerForm.provider,
          name: providerForm.name,
          baseUrl: providerForm.baseUrl,
          model: providerForm.model,
          apiKey: providerForm.apiKey,
          enabled: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          provider?: ProviderSummary;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setProviderForm((current) => ({
        ...current,
        id: payload.data?.provider?.id ?? current.id,
        apiKey: "",
      }));
      setProviderStatus("success");
      setProviderStatusText("配置已保存");
      await loadProviders();
    } catch (error) {
      setProviderStatus("error");
      setProviderStatusText(
        error instanceof Error ? error.message : "Provider 保存失败",
      );
    }
  }

  useEffect(() => {
    if (isSettingsOpen) void loadProviders();
  }, [isSettingsOpen]);

  function stopAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  async function playAudio(audioUrl: string) {
    const audio = audioRef.current;
    if (!audio) {
      setState("speaking");
      window.setTimeout(() => setState("idle"), 1200);
      return;
    }

    audio.src = audioUrl;
    setState("speaking");

    try {
      await audio.play();
    } catch {
      setState("idle");
    }
  }

  function applyRuntimeEvent(event: RuntimeEvent, assistantId: string) {
    if (event.type === "assistant.created") {
      persistedAssistantRef.current = event.message.id;
      return;
    }

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
      if (event.audioUrl) {
        void playAudio(event.audioUrl);
      } else {
        setState("speaking");
        window.setTimeout(() => {
          setState((current) => (current === "speaking" ? "idle" : current));
        }, event.durationMs ?? 1200);
      }
      return;
    }

    if (event.type === "tts.failed") {
      setState("idle");
      return;
    }

    if (event.type === "avatar.state") {
      setState(event.state);
      return;
    }

    if (event.type === "rag.retrieve.started") {
      setKnowledgeStatus("loading");
      setKnowledgeStatusText("知识库检索中");
      return;
    }

    if (event.type === "rag.retrieve.completed") {
      setKnowledgeStatus("success");
      setKnowledgeStatusText(`命中 ${event.chunks.length} 个片段`);
      return;
    }

    if (event.type === "rag.retrieve.empty") {
      setKnowledgeStatus("success");
      setKnowledgeStatusText("知识库无命中");
      return;
    }

    if (event.type === "rag.retrieve.failed") {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(event.message);
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
      return;
    }

    if (event.type === "done") {
      if (event.conversationId) setConversationId(event.conversationId);
      void loadConversations();
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

    if (state === "speaking") stopAudio();
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
        body: JSON.stringify({
          conversationId,
          knowledgeBaseId: selectedKnowledgeBaseId || undefined,
          message: content,
        }),
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
      persistedAssistantRef.current = null;
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
    stopAudio();
    if (state === "listening") {
      stopListening();
      return;
    }
    abortRef.current?.abort();
    if (conversationId || persistedAssistantRef.current) {
      void fetch("/api/chat/interrupt", {
        body: JSON.stringify({
          conversationId,
          messageId: persistedAssistantRef.current,
          reason: "user_interrupt",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    }
    markInterrupted(activeAssistantRef.current ?? undefined);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => setState((current) => (current === "speaking" ? "idle" : current))}
        onError={() => setState((current) => (current === "speaking" ? "idle" : current))}
      />
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
            <button
              className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm"
              onClick={() => setIsSettingsOpen(true)}
              title="设置"
            >
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Conversation
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {conversationId ? "已保存会话" : "新会话"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
                  disabled={!canSend}
                  onClick={startNewConversation}
                  title="新建会话"
                >
                  <Plus size={16} />
                </button>
                <button
                  className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
                  disabled={!conversationId || !canSend}
                  onClick={deleteCurrentConversation}
                  title="删除当前会话"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
                  disabled={historyStatus === "loading"}
                  onClick={loadConversations}
                  title="刷新历史"
                >
                  <RefreshCw
                    size={16}
                    className={historyStatus === "loading" ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {conversations.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`flex max-w-56 shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs disabled:opacity-50 ${
                      conversation.id === conversationId
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    disabled={!canSend}
                    onClick={() => openConversation(conversation.id)}
                    title={conversation.title}
                  >
                    <History size={14} />
                    <span className="truncate">{conversation.title}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <BookOpen size={15} className="shrink-0 text-slate-500" />
                  <select
                    className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                    disabled={!canSend}
                    value={selectedKnowledgeBaseId}
                    onChange={(event) =>
                      setSelectedKnowledgeBaseId(event.target.value)
                    }
                  >
                    <option value="">不使用知识库</option>
                    {knowledgeBases.map((knowledgeBase) => (
                      <option key={knowledgeBase.id} value={knowledgeBase.id}>
                        {knowledgeBase.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    disabled={knowledgeStatus === "loading"}
                    onClick={loadKnowledgeBases}
                    title="刷新知识库"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        knowledgeStatus === "loading" ? "animate-spin" : ""
                      }
                    />
                  </button>
                  <button
                    className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                    disabled={!selectedKnowledgeBaseId || !canSend}
                    onClick={() => knowledgeFileInputRef.current?.click()}
                    title="上传文档"
                  >
                    <Upload size={15} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-slate-400"
                  disabled={!canSend}
                  placeholder="新知识库名称"
                  value={knowledgeName}
                  onChange={(event) => setKnowledgeName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void createKnowledgeBase();
                    }
                  }}
                />
                <button
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-40"
                  disabled={!knowledgeName.trim() || knowledgeStatus === "loading"}
                  onClick={createKnowledgeBase}
                  title="创建知识库"
                >
                  <FolderPlus size={15} />
                </button>
              </div>

              <input
                ref={knowledgeFileInputRef}
                accept=".csv,.json,.md,.markdown,.txt,text/*"
                className="hidden"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadKnowledgeDocument(file);
                }}
              />

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  {selectedKnowledgeBase
                    ? `${selectedKnowledgeBase.documentCount} docs · ${selectedKnowledgeBase.chunkCount} chunks`
                    : "未选择"}
                </span>
                <span>{knowledgeStatusText || "知识库待同步"}</span>
                {knowledgeDocuments.slice(0, 2).map((document) => (
                  <span
                    key={document.id}
                    className="max-w-44 truncate rounded bg-white px-2 py-1 text-slate-600"
                    title={document.originalName}
                  >
                    {document.name}
                  </span>
                ))}
              </div>
            </div>
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
                className={`flex size-11 shrink-0 items-center justify-center rounded-md border disabled:opacity-40 ${
                  state === "listening"
                    ? "border-violet-200 bg-violet-600 text-white"
                    : "border-slate-200 text-slate-600"
                }`}
                disabled={!canSend && state !== "listening"}
                onClick={toggleListening}
                title={state === "listening" ? "停止录音" : "语音输入"}
              >
                {state === "listening" ? (
                  <CircleStop size={18} />
                ) : (
                  <Mic size={18} />
                )}
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

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/30">
          <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Provider Settings
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  当前 LLM 配置与连通性
                </p>
              </div>
              <button
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600"
                onClick={() => setIsSettingsOpen(false)}
                title="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <section className="rounded-lg border border-slate-200 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    LLM Provider
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    保存到数据库；API Key 只会加密存储
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-medium text-slate-600">
                    名称
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                      value={providerForm.name}
                      onChange={(event) =>
                        setProviderForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    Provider
                    <select
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                      value={providerForm.provider}
                      onChange={(event) =>
                        setProviderForm((current) => ({
                          ...current,
                          provider: event.target.value,
                        }))
                      }
                    >
                      <option value="openai-compatible">OpenAI Compatible</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    Base URL
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                      placeholder="https://api.deepseek.com/v1"
                      value={providerForm.baseUrl}
                      onChange={(event) =>
                        setProviderForm((current) => ({
                          ...current,
                          baseUrl: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    Model
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                      placeholder="deepseek-chat"
                      value={providerForm.model}
                      onChange={(event) =>
                        setProviderForm((current) => ({
                          ...current,
                          model: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    API Key
                    <input
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                      placeholder="留空则不保存新密钥"
                      type="password"
                      value={providerForm.apiKey}
                      onChange={(event) =>
                        setProviderForm((current) => ({
                          ...current,
                          apiKey: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </section>

              {providers.map((provider) => (
                <section
                  key={provider.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        {provider.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {provider.provider} · {provider.model ?? "未配置模型"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      {provider.enabled ? "启用" : "停用"}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-slate-500">类型</dt>
                      <dd className="mt-1 font-medium text-slate-800">
                        {provider.type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">API Key</dt>
                      <dd className="mt-1 font-medium text-slate-800">
                        {provider.hasApiKey ? "已配置" : "未配置"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Base URL</dt>
                      <dd className="mt-1 break-all font-medium text-slate-800">
                        {provider.baseUrl ?? "未配置"}
                      </dd>
                    </div>
                  </dl>
                </section>
              ))}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  {providerStatus === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : providerStatus === "error" ? (
                    <XCircle size={16} className="text-red-600" />
                  ) : (
                    <RefreshCw
                      size={16}
                      className={providerStatus === "loading" ? "animate-spin" : ""}
                    />
                  )}
                  <span>{providerStatusText || "等待操作"}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 p-4">
              <button
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
                disabled={providerStatus === "loading"}
                onClick={saveProvider}
              >
                <Save size={16} />
                保存
              </button>
              <button
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
                disabled={providerStatus === "loading"}
                onClick={loadProviders}
              >
                <RefreshCw size={16} />
                刷新
              </button>
              <button
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 text-sm text-white disabled:opacity-50"
                disabled={providerStatus === "loading"}
                onClick={testProvider}
              >
                <Play size={16} />
                测试
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
