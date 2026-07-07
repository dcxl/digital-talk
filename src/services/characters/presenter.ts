import { sanitizeProviderConfig } from "@/services/providers/provider-presenter";
import type { CharacterProfileRecord } from "./repository";

function serializeSceneBinding(
  binding: CharacterProfileRecord["sceneBindings"][number],
) {
  return {
    id: binding.id,
    characterId: binding.characterId,
    sceneId: binding.sceneId,
    isDefault: binding.isDefault,
    enabled: binding.enabled,
    config: binding.config,
    scene: {
      id: binding.scene.id,
      name: binding.scene.name,
      type: binding.scene.type,
      description: binding.scene.description,
      inputMode: binding.scene.inputMode,
      outputMode: binding.scene.outputMode,
      status: binding.scene.status,
    },
    createdAt: binding.createdAt.toISOString(),
    updatedAt: binding.updatedAt.toISOString(),
  };
}

export function serializeCharacter(character: CharacterProfileRecord) {
  const previewAsset = character.appearanceProfile?.assets[0] ?? null;
  const defaultSceneBinding =
    character.sceneBindings.find((binding) => binding.isDefault) ??
    character.sceneBindings[0] ??
    null;

  return {
    id: character.id,
    name: character.name,
    roleType: character.roleType,
    description: character.description,
    tags: character.tags,
    personaPromptId: character.personaPromptId,
    personaPrompt: character.personaPrompt
      ? {
          id: character.personaPrompt.id,
          name: character.personaPrompt.name,
          type: character.personaPrompt.type,
          status: character.personaPrompt.status,
        }
      : null,
    appearance: character.appearanceProfile
      ? {
          profileId: character.appearanceProfile.id,
          driver: character.appearanceProfile.driver,
          name: character.appearanceProfile.name,
          previewImageUrl:
            character.appearanceProfile.previewImageUrl ??
            previewAsset?.publicUrl ??
            (previewAsset ? `/api/avatar-assets/${previewAsset.id}/content` : null),
          status: character.appearanceProfile.status,
        }
      : null,
    voice: {
      voiceProviderId: character.voiceProviderId,
      voiceProvider: character.voiceProvider
        ? sanitizeProviderConfig(character.voiceProvider)
        : null,
      voice: character.voice,
      language: character.language,
    },
    memoryPolicy: character.memoryPolicy,
    workflowPolicy: character.workflowPolicy,
    runtimeConfig: character.runtimeConfig,
    comfyWorkflowConfig: character.comfyWorkflowConfig,
    status: character.status,
    sceneBindings: character.sceneBindings.map(serializeSceneBinding),
    defaultScene: defaultSceneBinding
      ? {
          id: defaultSceneBinding.scene.id,
          name: defaultSceneBinding.scene.name,
          type: defaultSceneBinding.scene.type,
        }
      : null,
    counts: {
      conversations: character._count.conversations,
      memories: character._count.memories,
      workflows: character._count.workflows,
    },
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString(),
  };
}

