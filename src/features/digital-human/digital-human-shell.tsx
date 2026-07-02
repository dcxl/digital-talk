"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/app-header";
import { AvatarStage } from "./components/avatar-stage";
import { ConversationPanel } from "./components/conversation-panel";
import { ProviderSettingsDrawer } from "./components/provider-settings-drawer";
import { useAvatarProfile } from "./hooks/use-avatar-profile";
import { useAudioAnalyser } from "./hooks/use-audio-analyser";
import { useAudioPlayback } from "./hooks/use-audio-playback";
import { useConversationHistory } from "./hooks/use-conversation-history";
import { useKnowledgeBases } from "./hooks/use-knowledge-bases";
import { useProviderSettings } from "./hooks/use-provider-settings";
import { useVoiceInput } from "./hooks/use-voice-input";
import { parseRuntimeEvent } from "./runtime-stream";
import type { ChatMessage, RuntimeEvent, RuntimeState } from "./types";

interface DigitalHumanShellProps {
  embedded?: boolean;
}

interface SendMessageOptions {
  conversationId?: string | null;
  userMessageId?: string | null;
}

export function DigitalHumanShell({ embedded = false }: DigitalHumanShellProps) {
  const [state, setState] = useState<RuntimeState>("idle");
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { avatarProfile, loadAvatarProfile } = useAvatarProfile();
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
  const canSend = state === "idle" || state === "speaking" || state === "error";
  const isBusy = ["thinking", "streaming", "synthesizing", "transcribing"].includes(
    state,
  );
  const {
    audioRef,
    handleAudioEnded,
    playAudio,
    queueAudioChunk,
    stopAudio,
  } = useAudioPlayback({
    setState,
  });
  const audioAnalysis = useAudioAnalyser(audioRef, state === "speaking");
  const {
    conversationId,
    conversations,
    deleteCurrentConversation,
    historyStatus,
    loadConversations,
    messages,
    openConversation,
    setConversationId,
    setMessages,
    startNewConversation,
  } = useConversationHistory({
    canSend,
    setSelectedKnowledgeBaseId,
    setState,
    stopAudio,
  });
  const { interruptRealtimeSession, stopListening, toggleListening } =
    useVoiceInput({
      avatarProfileId: avatarProfile?.id,
      canSend,
      conversationId,
      knowledgeBaseId: selectedKnowledgeBaseId,
      onBargeIn: (reason) => interrupt(reason),
      onTranscriptFinal: (result) =>
        void sendMessage(result.text, {
          conversationId: result.conversationId,
          userMessageId: result.messageId,
        }),
      setInput,
      setState,
      state,
      stopAudio,
    });
  const abortRef = useRef<AbortController | null>(null);
  const activeAssistantRef = useRef<string | null>(null);
  const persistedAssistantRef = useRef<string | null>(null);
  const speakingAssistantRef = useRef<string | null>(null);
  const chunkedTTSMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (state !== "speaking") speakingAssistantRef.current = null;
  }, [state]);

  useEffect(() => {
    void loadConversations();
    void loadKnowledgeBases();
    void loadAvatarProfile();
  }, [loadAvatarProfile, loadConversations, loadKnowledgeBases]);

  useEffect(() => {
    if (selectedKnowledgeBaseId) {
      void loadKnowledgeDocuments(selectedKnowledgeBaseId);
    } else {
      setKnowledgeDocuments([]);
    }
  }, [loadKnowledgeDocuments, selectedKnowledgeBaseId, setKnowledgeDocuments]);

  const latestStatus = useMemo(() => {
    if (state === "speaking") return "数字人正在播报回复";
    if (state === "listening") return "正在接收麦克风输入";
    if (state === "transcribing") return "ASR 正在转写语音";
    if (state === "streaming") return "LLM 正在流式生成";
    if (state === "thinking") return "请求已提交，等待首包";
    if (state === "error") return "服务端调用异常，可重试";
    return "准备接收新的问题";
  }, [state]);

  useEffect(() => {
    if (isSettingsOpen) void loadProviders();
  }, [isSettingsOpen, loadProviders]);

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

    if (event.type === "tts.chunk") {
      speakingAssistantRef.current = event.messageId;
      chunkedTTSMessagesRef.current.add(event.messageId);
      queueAudioChunk(event.audioUrl);
      return;
    }

    if (event.type === "tts.done") {
      speakingAssistantRef.current = event.messageId;
      const hasChunks = chunkedTTSMessagesRef.current.has(event.messageId);
      chunkedTTSMessagesRef.current.delete(event.messageId);
      if (hasChunks) return;

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

  async function sendMessage(text: string, options: SendMessageOptions = {}) {
    const content = text.trim();
    if (!content || !canSend) return;

    const targetConversationId = options.conversationId ?? conversationId;
    const userMessageId = options.userMessageId ?? crypto.randomUUID();

    if (state === "speaking") stopAudio();
    abortRef.current?.abort();
    setInput("");
    if (targetConversationId && targetConversationId !== conversationId) {
      setConversationId(targetConversationId);
    }

    const userMessage: ChatMessage = {
      id: userMessageId,
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
          conversationId: targetConversationId,
          knowledgeBaseId: selectedKnowledgeBaseId || undefined,
          message: content,
          userMessageId: options.userMessageId ?? undefined,
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
                  error instanceof Error ? error.message : "运行请求失败",
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
    window.setTimeout(
      () => setState((current) => (current === "interrupted" ? "idle" : current)),
      500,
    );
  }

  function interrupt(reason = "user_interrupt") {
    const assistantMessageId =
      activeAssistantRef.current ??
      persistedAssistantRef.current ??
      speakingAssistantRef.current ??
      undefined;

    stopAudio();
    interruptRealtimeSession(reason);
    if (state === "listening") {
      stopListening();
      return;
    }
    abortRef.current?.abort();
    if (conversationId || assistantMessageId) {
      void fetch("/api/chat/interrupt", {
        body: JSON.stringify({
          conversationId,
          messageId: assistantMessageId,
          reason,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    }
    markInterrupted(assistantMessageId);
  }

  return (
    <main
      className={
        embedded ? "min-h-full bg-[#f7f8fb]" : "min-h-screen bg-[#f7f8fb]"
      }
    >
      <audio
        ref={audioRef}
        className="hidden"
        onEnded={handleAudioEnded}
        onError={handleAudioEnded}
      />

      {embedded ? null : (
        <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />
      )}

      <section
        className={
          embedded
            ? "grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]"
            : "mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]"
        }
      >
        <AvatarStage
          avatarImageUrl={avatarProfile?.previewImageUrl}
          avatarName={avatarProfile?.name}
          latestStatus={latestStatus}
          mouthOpen={audioAnalysis.mouthOpen}
          state={state}
          volume={audioAnalysis.volume}
        />
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
