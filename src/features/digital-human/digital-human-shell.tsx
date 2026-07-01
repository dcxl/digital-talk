"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/app-header";
import { AvatarStage } from "./components/avatar-stage";
import { ConversationPanel } from "./components/conversation-panel";
import { ProviderSettingsDrawer } from "./components/provider-settings-drawer";
import { welcomeMessage } from "./constants";
import { useKnowledgeBases } from "./hooks/use-knowledge-bases";
import { useProviderSettings } from "./hooks/use-provider-settings";
import { parseRuntimeEvent } from "./runtime-stream";
import type {
  AsyncStatus,
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
  RuntimeEvent,
  RuntimeState,
} from "./types";

export function DigitalHumanShell() {
  const [state, setState] = useState<RuntimeState>("idle");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyStatus, setHistoryStatus] =
    useState<Exclude<AsyncStatus, "success">>("idle");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const {
    createKnowledgeBase,
    knowledgeBases,
    knowledgeDocuments,
    knowledgeFileInputRef,
    knowledgeName,
    knowledgeStatus,
    knowledgeStatusText,
    loadKnowledgeBases,
    loadKnowledgeDocuments,
    selectedKnowledgeBase,
    selectedKnowledgeBaseId,
    setKnowledgeDocuments,
    setKnowledgeName,
    setKnowledgeStatus,
    setKnowledgeStatusText,
    setSelectedKnowledgeBaseId,
    uploadKnowledgeDocument,
  } = useKnowledgeBases();
  const {
    loadProviders,
    providerForm,
    providers,
    providerStatus,
    providerStatusText,
    saveProvider,
    testProvider,
    updateProviderForm,
  } = useProviderSettings();
  const abortRef = useRef<AbortController | null>(null);
  const activeAssistantRef = useRef<string | null>(null);
  const persistedAssistantRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const canSend = state === "idle" || state === "speaking" || state === "error";
  const isBusy = ["thinking", "streaming", "synthesizing", "transcribing"].includes(
    state,
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
  }, [loadKnowledgeBases]);

  useEffect(() => {
    if (selectedKnowledgeBaseId) {
      void loadKnowledgeDocuments(selectedKnowledgeBaseId);
    } else {
      setKnowledgeDocuments([]);
    }
  }, [loadKnowledgeDocuments, selectedKnowledgeBaseId, setKnowledgeDocuments]);

  const latestStatus = useMemo(() => {
    if (state === "speaking") return "Avatar 正在播报回复";
    if (state === "listening") return "正在接收麦克风输入";
    if (state === "transcribing") return "ASR 正在转写语音";
    if (state === "streaming") return "LLM 正在流式生成";
    if (state === "thinking") return "请求已提交，等待首包";
    if (state === "error") return "服务端调用异常，可重试";
    return "准备接收新的问题";
  }, [state]);

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

  useEffect(() => {
    if (isSettingsOpen) void loadProviders();
  }, [isSettingsOpen, loadProviders]);

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
        onEnded={() =>
          setState((current) => (current === "speaking" ? "idle" : current))
        }
        onError={() =>
          setState((current) => (current === "speaking" ? "idle" : current))
        }
      />

      <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <AvatarStage latestStatus={latestStatus} state={state} />
        <ConversationPanel
          canSend={canSend}
          conversationId={conversationId}
          conversations={conversations}
          historyStatus={historyStatus}
          input={input}
          isBusy={isBusy}
          knowledgeBases={knowledgeBases}
          knowledgeDocuments={knowledgeDocuments}
          knowledgeFileInputRef={knowledgeFileInputRef}
          knowledgeName={knowledgeName}
          knowledgeStatus={knowledgeStatus}
          knowledgeStatusText={knowledgeStatusText}
          messages={messages}
          onCreateKnowledgeBase={() => void createKnowledgeBase()}
          onDeleteCurrentConversation={() => void deleteCurrentConversation()}
          onInputChange={setInput}
          onInterrupt={interrupt}
          onKnowledgeNameChange={setKnowledgeName}
          onLoadConversations={() => void loadConversations()}
          onLoadKnowledgeBases={() => void loadKnowledgeBases()}
          onOpenConversation={(nextConversationId) =>
            void openConversation(nextConversationId)
          }
          onSelectKnowledgeBase={setSelectedKnowledgeBaseId}
          onSendMessage={(text) => void sendMessage(text)}
          onStartNewConversation={startNewConversation}
          onToggleListening={toggleListening}
          onUploadKnowledgeDocument={(file) => void uploadKnowledgeDocument(file)}
          selectedKnowledgeBase={selectedKnowledgeBase}
          selectedKnowledgeBaseId={selectedKnowledgeBaseId}
          state={state}
        />
      </section>

      {isSettingsOpen ? (
        <ProviderSettingsDrawer
          onClose={() => setIsSettingsOpen(false)}
          onFormChange={updateProviderForm}
          onLoadProviders={() => void loadProviders()}
          onSaveProvider={() => void saveProvider()}
          onTestProvider={() => void testProvider()}
          providerForm={providerForm}
          providers={providers}
          providerStatus={providerStatus}
          providerStatusText={providerStatusText}
        />
      ) : null}
    </main>
  );
}
