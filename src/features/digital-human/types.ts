export type {
  ChatMessage,
  ChatMessageStatus,
  ChatRole,
  RuntimeEvent,
  RuntimeState,
} from "@/core/runtime/events";

import type { ChatMessage as CoreChatMessage } from "@/core/runtime/events";

export interface ProviderSummary {
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

export interface ProviderFormState {
  id?: string;
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface ConversationSummary {
  _count?: {
    messages: number;
  };
  archivedAt?: string | null;
  deletedAt?: string | null;
  id: string;
  isStarred?: boolean;
  title: string;
  lastMessageAt?: string | null;
  status?: string;
}

export interface PersistedMessage {
  id: string;
  role: string;
  content: string;
  status: CoreChatMessage["status"];
}

export interface ConversationDetail extends ConversationSummary {
  knowledgeBaseId?: string | null;
  messages: PersistedMessage[];
}

export interface KnowledgeBaseSummary {
  id: string;
  name: string;
  description?: string | null;
  documentCount: number;
  chunkCount: number;
}

export interface KnowledgeDocumentSummary {
  id: string;
  name: string;
  originalName: string;
  status: string;
  chunkCount: number;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";
