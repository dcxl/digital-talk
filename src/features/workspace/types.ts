export interface ConversationItem {
  _count?: {
    messages: number;
  };
  id: string;
  isStarred?: boolean;
  title: string;
  lastMessageAt?: string | null;
  status?: string;
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description?: string | null;
  documentCount: number;
  chunkCount: number;
}

export interface KnowledgeDocumentItem {
  chunkCount: number;
  id: string;
  mimeType?: string;
  name: string;
  originalName: string;
  size?: number;
  status: string;
  updatedAt?: string;
}

export interface KnowledgeSearchResult {
  chunkId: string;
  content: string;
  documentId: string;
  documentName: string;
  metadata?: unknown;
  tokenCount?: number | null;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type ProviderType = "llm" | "embedding" | "tts" | "asr" | "avatar";

export interface ProviderItem {
  id: string;
  type: ProviderType;
  provider: string;
  name: string;
  enabled: boolean;
  baseUrl?: string | null;
  createdAt?: string;
  hasApiKey?: boolean;
  lastTestAt?: string | null;
  lastTestStatus?: string | null;
  model?: string | null;
  options?: unknown;
  source?: string;
  updatedAt?: string;
}

export interface ProviderFormState {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  hasApiKey?: boolean;
  id?: string;
  model: string;
  name: string;
  provider: string;
  source?: string;
  type: ProviderType;
}

export interface ProviderTestResult {
  latencyMs: number;
  providerId?: string;
  providerName?: string;
  sample?: string;
  success: boolean;
}

export interface WorkspaceSnapshot {
  conversations: ConversationItem[];
  knowledgeBases: KnowledgeBaseItem[];
  providers: ProviderItem[];
}

export interface DashboardSummary {
  metrics: {
    activeProviderCount: number;
    avgLatencyMs: number;
    conversationCount: number;
    knowledgeChunkCount: number;
    knowledgeDocumentCount: number;
    providerCount: number;
    tokensToday: number;
  };
  recentConversations: ConversationItem[];
  runtimeStatus: Array<{
    id: string;
    lastTestAt?: string | null;
    model?: string | null;
    name: string;
    provider: string;
    status: string;
    type: string;
  }>;
  systemInfo: {
    environment: string;
    persistenceEnabled: boolean;
    uptimeSeconds: number;
    version: string;
  };
  tokenUsage: Array<{
    date: string;
    totalTokens: number;
  }>;
}
