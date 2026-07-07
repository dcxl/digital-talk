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
export type AvatarPreviewState =
  | "error"
  | "idle"
  | "interrupted"
  | "speaking"
  | "thinking";

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
  config?: unknown;
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
  runtime?: {
    adapterName: string;
    asset?: {
      id: string;
      type: "image" | "live2d" | "vrm";
    };
    diagnostics?: {
      errors: string[];
      warnings: string[];
    };
    driver: AvatarDriver;
    fallbackDriver?: AvatarDriver;
    loadLatencyMs?: number;
    status: "degraded" | "error" | "placeholder" | "ready";
  };
  state: AvatarPreviewState;
  text: string;
  updatedAt: string;
}

export interface AvatarAssetItem {
  createdAt: string;
  height?: number | null;
  id: string;
  metadata?: unknown;
  mimeType: string;
  name: string;
  profileId?: string | null;
  publicUrl?: string | null;
  size: number;
  source: "generated" | "remote" | "upload";
  status: "active" | "deleted" | "failed" | "processing";
  storageKey: string;
  type: "image" | "live2d" | "vrm";
  updatedAt: string;
  width?: number | null;
}

export type AvatarGenerationJobStatus =
  | "completed"
  | "failed"
  | "pending"
  | "running";

export interface AvatarGenerationJobItem {
  completedAt?: string | null;
  createdAt: string;
  errorMessage?: string | null;
  id: string;
  negativePrompt?: string | null;
  profileId?: string | null;
  prompt: string;
  providerConfigId?: string | null;
  resultAsset?: AvatarAssetItem | null;
  resultAssetId?: string | null;
  startedAt?: string | null;
  status: AvatarGenerationJobStatus;
  style?: string | null;
  updatedAt: string;
}

export type CharacterRoleType =
  | "business_assistant"
  | "chat_companion"
  | "custom"
  | "host"
  | "knowledge_assistant";

export type CharacterStatus = "active" | "deleted" | "disabled" | "draft";
export type CharacterSceneType = CharacterRoleType;
export type CharacterSceneStatus = "active" | "deleted" | "disabled";
export type CharacterMemoryType =
  | "character_fact"
  | "long_term"
  | "relationship_fact"
  | "session_summary"
  | "user_preference";
export type CharacterMemoryStatus = "active" | "deleted" | "disabled";
export type CharacterWorkflowStatus = "active" | "deleted" | "disabled";
export type CharacterWorkflowExecutionStatus =
  | "cancelled"
  | "failed"
  | "pending"
  | "running"
  | "success"
  | "waiting_confirmation";

export interface CharacterSceneSummary {
  id: string;
  name: string;
  type: CharacterSceneType;
}

export interface CharacterSceneItem {
  counts: {
    bindings: number;
    conversations: number;
  };
  createdAt: string;
  description?: string | null;
  id: string;
  inputMode: string;
  knowledgeBase?: {
    id: string;
    name: string;
    status: string;
  } | null;
  knowledgeBaseId?: string | null;
  name: string;
  outputMode: string;
  promptTemplate?: {
    id: string;
    name: string;
    status: string;
    type: string;
  } | null;
  promptTemplateId?: string | null;
  status: CharacterSceneStatus;
  type: CharacterSceneType;
  updatedAt: string;
  workflowPolicy?: unknown;
}

export interface CharacterSceneFormState {
  description: string;
  inputMode: string;
  name: string;
  outputMode: string;
  type: CharacterSceneType;
}

export interface CharacterMemoryItem {
  characterId: string;
  confidence?: number | null;
  content: string;
  createdAt: string;
  expiresAt?: string | null;
  id: string;
  metadata?: unknown;
  source: string;
  sourceConversation?: {
    id: string;
    status: string;
    title: string;
  } | null;
  sourceConversationId?: string | null;
  status: CharacterMemoryStatus;
  type: CharacterMemoryType;
  updatedAt: string;
}

export interface CharacterMemoryFormState {
  confidence: number;
  content: string;
  type: CharacterMemoryType;
}

export interface CharacterWorkflowExecutionItem {
  characterId: string;
  completedAt?: string | null;
  conversationId?: string | null;
  createdAt: string;
  errorMessage?: string | null;
  id: string;
  input?: unknown;
  output?: unknown;
  requiresConfirmation: boolean;
  startedAt?: string | null;
  status: CharacterWorkflowExecutionStatus;
  updatedAt: string;
  workflowId: string;
}

export interface CharacterWorkflowItem {
  characterId: string;
  createdAt: string;
  description?: string | null;
  executions: CharacterWorkflowExecutionItem[];
  id: string;
  name: string;
  permission?: unknown;
  status: CharacterWorkflowStatus;
  steps?: unknown;
  trigger?: unknown;
  updatedAt: string;
}

export interface CharacterWorkflowFormState {
  description: string;
  name: string;
  requiresConfirmation: boolean;
}

export interface CharacterSceneBindingItem {
  characterId: string;
  config?: unknown;
  createdAt: string;
  enabled: boolean;
  id: string;
  isDefault: boolean;
  scene: CharacterSceneSummary & {
    description?: string | null;
    inputMode: string;
    outputMode: string;
    status: string;
  };
  sceneId: string;
  updatedAt: string;
}

export interface CharacterItem {
  appearance?: {
    driver: AvatarDriver;
    name: string;
    previewImageUrl?: string | null;
    profileId: string;
    status: string;
  } | null;
  comfyWorkflowConfig?: unknown;
  counts: {
    conversations: number;
    memories: number;
    workflows: number;
  };
  createdAt: string;
  defaultScene?: CharacterSceneSummary | null;
  description?: string | null;
  id: string;
  language?: string | null;
  memoryPolicy?: unknown;
  name: string;
  personaPrompt?: {
    id: string;
    name: string;
    status: string;
    type: string;
  } | null;
  personaPromptId?: string | null;
  roleType: CharacterRoleType;
  runtimeConfig?: unknown;
  sceneBindings: CharacterSceneBindingItem[];
  status: CharacterStatus;
  tags?: string[] | unknown;
  updatedAt: string;
  voice: {
    language?: string | null;
    voice?: string | null;
    voiceProvider?: ProviderItem | null;
    voiceProviderId?: string | null;
  };
  workflowPolicy?: unknown;
}

export interface CharacterFormState {
  appearanceProfileId: string;
  description: string;
  id?: string;
  language: string;
  name: string;
  roleType: CharacterRoleType;
  status: Exclude<CharacterStatus, "deleted">;
  tagsText: string;
  voice: string;
  voiceProviderId: string;
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
