import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { presentAvatarAsset } from "@/services/avatar-assets/presenter";
import {
  markAvatarGenerationJobFailed,
  processAvatarGenerationJob,
} from "@/services/avatar-generation/processor";
import {
  createAvatarGenerationJob,
  getAvatarGenerationJob,
} from "@/services/avatar-generation/repository";
import { presentAvatarGenerationJob } from "@/services/avatar-generation/presenter";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function databaseUnavailable() {
  return jsonError(
    {
      code: "database_not_configured",
      message: "DATABASE_URL must point to a real PostgreSQL host",
      retryable: true,
    },
    { status: 503 },
  );
}

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const { jobId } = await context.params;

  try {
    const sourceJob = await getAvatarGenerationJob(jobId);
    if (!sourceJob) {
      return jsonError(
        {
          code: "not_found",
          message: "Avatar generation job not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    if (sourceJob.status !== "failed") {
      return jsonError(
        {
          code: "invalid_state",
          message: "Only failed avatar generation jobs can be retried",
          retryable: false,
        },
        { status: 409 },
      );
    }

    const createdJob = await createAvatarGenerationJob({
      negativePrompt: sourceJob.negativePrompt,
      profileId: sourceJob.profileId,
      prompt: sourceJob.prompt,
      providerConfigId: sourceJob.providerConfigId,
      style: sourceJob.style,
    });

    try {
      const result = await processAvatarGenerationJob({
        jobId: createdJob.id,
        negativePrompt: optionalString(sourceJob.negativePrompt),
        profileId: optionalString(sourceJob.profileId),
        prompt: sourceJob.prompt,
        style: optionalString(sourceJob.style),
      });

      return jsonData(
        {
          asset: presentAvatarAsset(result.asset),
          job: presentAvatarGenerationJob(result.job),
        },
        { status: 201 },
      );
    } catch (error) {
      const failedJob = await markAvatarGenerationJobFailed(createdJob.id, error);

      return jsonData(
        {
          job: presentAvatarGenerationJob(failedJob),
        },
        { status: 201 },
      );
    }
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to retry avatar job",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
