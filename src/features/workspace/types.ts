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
  format?: "mp3" | "wav";
  hasApiKey?: boolean;
  id?: string;
  model: string;
  name: string;
  provider: string;
  source?: string;
  type: ProviderType;
  voice?: string;
}

export interface ProviderTestResult {
  audioUrl?: string;
  durationMs?: number;
  latencyMs: number;
  mimeType?: string;
  providerId?: string;
  providerName?: string;
  sample?: string;
  success: boolean;
}

export type PromptType = "system" | "chat" | "summary" | "translate" | "custom";

export interface PromptVariable {
  defaultValue?: string;
  name: string;
  required?: boolean;
}

export interface PromptVersionItem {
  changelog?: string | null;
  content: string;
  createdAt: string;
  createdByUserId?: string | null;
  id: string;
  promptTemplateId: string;
  variables?: PromptVariable[] | null;
  version: number;
}

export interface PromptTemplateItem {
  createdAt: string;
  currentVersion?: PromptVersionItem | null;
  currentVersionId?: string | null;
  description?: string | null;
  id: string;
  name: string;
  status: string;
  type: PromptType;
  updatedAt: string;
  variables?: PromptVariable[] | null;
  versions: PromptVersionItem[];
}

export interface PromptFormState {
  changelog: string;
  content: string;
  description: string;
  id?: string;
  name: string;
  testMessage: string;
  type: PromptType;
  variableValues: Record<string, string>;
  variables: PromptVariable[];
}

export interface PromptTestResult {
  latencyMs: number;
  output: string;
  renderedPrompt: string;
  usage?: {
    totalTokens?: number;
  };
}

export type AvatarDriver = "static" | "live2d" | "vrm";
export type AvatarProfileStatus = "active" | "disabled" | "deleted";
export type AvatarPreviewState = "idle" | "thinking" | "speaking" | "error";

export interface AvatarProfileItem {
  background?: string | null;
  config?: unknown;
  createdAt: string;
  driver: AvatarDriver;
  id: string;
  isDefault: boolean;
  language?: string | null;
  name: string;
  previewImageUrl?: string | null;
  providerConfig?: ProviderItem | null;
  providerConfigId?: string | null;
  status: AvatarProfileStatus;
  updatedAt: string;
  voice?: string | null;
  voiceProvider?: ProviderItem | null;
  voiceProviderId?: string | null;
}

export interface AvatarFormState {
  background: string;
  driver: AvatarDriver;
  id?: string;
  isDefault: boolean;
  language: string;
  name: string;
  previewImageUrl: string;
  providerConfigId: string;
  status: AvatarProfileStatus;
  voice: string;
  voiceProviderId: string;
}

export interface AvatarPreviewResult {
  state: AvatarPreviewState;
  text: string;
  updatedAt: string;
}

export interface GeneralSettingsState {
  autoSave: boolean;
  language: string;
  theme: "dark" | "light" | "system";
  timeZone: string;
  workspaceName: string;
}

export interface WorkspaceExportSummary {
  conversationCount: number;
  documentCount: number;
  knowledgeBaseCount: number;
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
