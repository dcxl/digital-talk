import type { CharacterMemoryRecord } from "./repository";

export function serializeMemory(memory: CharacterMemoryRecord) {
  return {
    id: memory.id,
    characterId: memory.characterId,
    type: memory.type,
    content: memory.content,
    source: memory.source,
    sourceConversationId: memory.sourceConversationId,
    sourceConversation: memory.sourceConversation,
    confidence: memory.confidence,
    status: memory.status,
    metadata: memory.metadata,
    expiresAt: memory.expiresAt?.toISOString() ?? null,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
}
