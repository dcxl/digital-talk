import type { RealtimeSession, RealtimeSessionEvent } from "./types";

export function presentRealtimeSession(session: RealtimeSession) {
  return {
    activeAudioId: session.activeAudioId ?? null,
    activeMessageId: session.activeMessageId ?? null,
    avatarProfileId: session.avatarProfileId ?? null,
    conversationId: session.conversationId ?? null,
    createdAt: session.createdAt,
    endedAt: session.endedAt ?? null,
    expiresAt: session.expiresAt,
    id: session.id,
    interruptReason: session.interruptReason ?? null,
    knowledgeBaseId: session.knowledgeBaseId ?? null,
    metadata: session.metadata ?? null,
    modelProviderId: session.modelProviderId ?? null,
    status: session.status,
    transport: session.transport,
    updatedAt: session.updatedAt,
    userId: session.userId,
    voiceProviderId: session.voiceProviderId ?? null,
  };
}

export function presentRealtimeSessionEvent(event: RealtimeSessionEvent) {
  return {
    createdAt: event.createdAt,
    id: event.id,
    payload: event.payload ?? null,
    sequence: event.sequence,
    sessionId: event.sessionId,
    type: event.type,
  };
}
