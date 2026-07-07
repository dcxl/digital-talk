import type {
  CharacterSceneBindingRecord,
  CharacterSceneRecord,
} from "./repository";

export function serializeScene(scene: CharacterSceneRecord) {
  return {
    id: scene.id,
    name: scene.name,
    type: scene.type,
    description: scene.description,
    promptTemplateId: scene.promptTemplateId,
    promptTemplate: scene.promptTemplate,
    knowledgeBaseId: scene.knowledgeBaseId,
    knowledgeBase: scene.knowledgeBase,
    inputMode: scene.inputMode,
    outputMode: scene.outputMode,
    workflowPolicy: scene.workflowPolicy,
    status: scene.status,
    counts: {
      bindings: scene._count.bindings,
      conversations: scene._count.conversations,
    },
    createdAt: scene.createdAt.toISOString(),
    updatedAt: scene.updatedAt.toISOString(),
  };
}

export function serializeSceneBinding(binding: CharacterSceneBindingRecord) {
  return {
    id: binding.id,
    characterId: binding.characterId,
    sceneId: binding.sceneId,
    isDefault: binding.isDefault,
    enabled: binding.enabled,
    config: binding.config,
    scene: serializeScene(binding.scene),
    createdAt: binding.createdAt.toISOString(),
    updatedAt: binding.updatedAt.toISOString(),
  };
}
