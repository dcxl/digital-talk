import type { CharacterProfileRecord } from "@/services/characters/repository";
import {
  createAvatarGenerationJob,
  updateAvatarGenerationJob,
} from "@/services/avatar-generation/repository";
import type { ComfyUIConfig } from "./config";
import type { ComfyUIAppearanceRequest } from "./workflow";

export interface CreateComfyUIAppearanceJobInput {
  character: CharacterProfileRecord;
  config: ComfyUIConfig;
  request: ComfyUIAppearanceRequest;
}

export async function createComfyUIAppearanceGenerationJob(
  input: CreateComfyUIAppearanceJobInput,
) {
  const job = await createAvatarGenerationJob({
    negativePrompt: input.request.negativePrompt,
    profileId: input.character.appearanceProfileId,
    prompt: input.request.prompt,
    providerConfigId: null,
    status: "pending",
    style: input.request.style ?? input.config.workflowId,
  });

  if (input.config.provider === "mock") {
    return updateAvatarGenerationJob({
      completedAt: new Date(),
      jobId: job.id,
      status: "completed",
    });
  }

  return job;
}
