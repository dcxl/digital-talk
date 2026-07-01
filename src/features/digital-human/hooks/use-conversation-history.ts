"use client";

import { useCallback, useState } from "react";
import { welcomeMessage } from "../constants";
import type {
  AsyncStatus,
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
  RuntimeState,
} from "../types";

interface UseConversationHistoryInput {
  canSend: boolean;
  setSelectedKnowledgeBaseId: (knowledgeBaseId: string) => void;
  setState: React.Dispatch<React.SetStateAction<RuntimeState>>;
  stopAudio: () => void;
}

export function useConversationHistory({
  canSend,
  setSelectedKnowledgeBaseId,
  setState,
  stopAudio,
}: UseConversationHistoryInput) {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyStatus, setHistoryStatus] =
    useState<Exclude<AsyncStatus, "success">>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);

  const loadConversations = useCallback(async () => {
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
  }, []);

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

  return {
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
  };
}
