import { getImageGenerationProvider } from "@/providers/image-generation";
import { createAvatarAsset } from "@/services/avatar-assets/repository";
import { getAvatarAssetStorage } from "@/services/avatar-assets/storage";
import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { updateAvatarGenerationJob } from "@/services/avatar-generation/repository";

export interface ProcessAvatarGenerationJobInput {
  jobId: string;
  negativePrompt?: string;
  profileId?: string;
  prompt: string;
  style?: string;
}

export async function markAvatarGenerationJobFailed(
  jobId: string,
  error: unknown,
) {
  return updateAvatarGenerationJob({
    completedAt: new Date(),
    errorMessage:
      error instanceof Error ? error.message : "Avatar generation failed",
    jobId,
    status: "failed",
  });
}

function getGeneratedFileName(mimeType: string) {
  if (mimeType === "image/jpeg") return "generated-avatar.jpg";
  if (mimeType === "image/webp") return "generated-avatar.webp";
  return "generated-avatar.png";
}

export async function processAvatarGenerationJob(
  input: ProcessAvatarGenerationJobInput,
) {
  await updateAvatarGenerationJob({
    jobId: input.jobId,
    startedAt: new Date(),
    status: "running",
  });

  const provider = getImageGenerationProvider();
  const generated = await provider.generate({
    negativePrompt: input.negativePrompt,
    prompt: input.prompt,
    signal: AbortSignal.timeout(120_000),
    style: input.style,
  });

  if (!generated.imageBytes) {
    throw new Error("Image generation provider did not return image bytes");
  }

  const stored = await getAvatarAssetStorage().put({
    bytes: generated.imageBytes,
    mimeType: generated.mimeType,
    originalName: getGeneratedFileName(generated.mimeType),
    userId: DEFAULT_USER_ID,
  });
  const asset = await createAvatarAsset({
    metadata: {
      generationJobId: input.jobId,
      negativePrompt: input.negativePrompt,
      providerId: provider.id,
      providerName: provider.name,
      prompt: input.prompt,
      seed: generated.seed,
      style: input.style,
      ...generated.metadata,
    },
    mimeType: generated.mimeType,
    name: input.style ? `${input.style} Avatar` : "Generated Avatar",
    profileId: input.profileId,
    publicUrl: stored.publicUrl,
    size: stored.size,
    source: "generated",
    storageKey: stored.storageKey,
    type: "image",
  });
  const job = await updateAvatarGenerationJob({
    completedAt: new Date(),
    jobId: input.jobId,
    resultAssetId: asset.id,
    status: "completed",
  });

  return {
    asset,
    job,
  };
}
