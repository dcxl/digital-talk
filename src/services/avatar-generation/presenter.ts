import type {
  AvatarAsset,
  AvatarGenerationJob,
} from "@/generated/prisma/client";
import { presentAvatarAsset } from "@/services/avatar-assets/presenter";

export interface AvatarGenerationJobRecord extends AvatarGenerationJob {
  resultAsset?: AvatarAsset | null;
}

export function presentAvatarGenerationJob(job: AvatarGenerationJobRecord) {
  return {
    id: job.id,
    profileId: job.profileId,
    providerConfigId: job.providerConfigId,
    status: job.status,
    prompt: job.prompt,
    negativePrompt: job.negativePrompt,
    style: job.style,
    resultAssetId: job.resultAssetId,
    resultAsset: job.resultAsset ? presentAvatarAsset(job.resultAsset) : null,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
