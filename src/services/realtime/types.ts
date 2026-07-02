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

export type RealtimeSessionEventType =
  | "asr.final"
  | "asr.partial"
  | "session.closed"
  | "session.interrupted";

export interface RealtimeSessionEvent {
  createdAt: string;
  id: string;
  payload?: Record<string, unknown>;
  sequence: number;
  sessionId: string;
  type: RealtimeSessionEventType;
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
  appendEvent(
    sessionId: string,
    event: RealtimeSessionEvent,
    ttlSeconds: number,
  ): Promise<void>;
  delete(sessionId: string): Promise<void>;
  get(sessionId: string): Promise<RealtimeSession | null>;
  listEvents(sessionId: string): Promise<RealtimeSessionEvent[]>;
  ping(): Promise<void>;
  set(session: RealtimeSession, ttlSeconds: number): Promise<void>;
}
