export type RealtimeSessionStatus =
  | "closed"
  | "idle"
  | "interrupted"
  | "listening"
  | "speaking"
  | "thinking"
  | "transcribing";

export type RealtimeTransport = "sse" | "websocket";

export interface RealtimeSession {
  activeAudioId?: string | null;
  activeMessageId?: string | null;
  avatarProfileId?: string | null;
  conversationId?: string | null;
  createdAt: string;
  endedAt?: string | null;
  expiresAt: string;
  id: string;
  interruptReason?: string | null;
  knowledgeBaseId?: string | null;
  metadata?: Record<string, unknown>;
  modelProviderId?: string | null;
  status: RealtimeSessionStatus;
  transport: RealtimeTransport;
  updatedAt: string;
  userId: string;
  voiceProviderId?: string | null;
}

export interface CreateRealtimeSessionInput {
  avatarProfileId?: string;
  conversationId?: string;
  knowledgeBaseId?: string;
  metadata?: Record<string, unknown>;
  modelProviderId?: string;
  transport?: RealtimeTransport;
  userId: string;
  voiceProviderId?: string;
}

export interface RealtimeSessionStore {
  delete(sessionId: string): Promise<void>;
  get(sessionId: string): Promise<RealtimeSession | null>;
  ping(): Promise<void>;
  set(session: RealtimeSession, ttlSeconds: number): Promise<void>;
}
