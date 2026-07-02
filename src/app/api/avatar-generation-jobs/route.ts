import type { AvatarGenerationJobStatus } from "@/generated/prisma/client";
import { jsonData, jsonError } from "@/core/http/responses";
import { presentAvatarAsset } from "@/services/avatar-assets/presenter";
import {
  markAvatarGenerationJobFailed,
  processAvatarGenerationJob,
} from "@/services/avatar-generation/processor";
import {
  createAvatarGenerationJob,
  listAvatarGenerationJobs,
} from "@/services/avatar-generation/repository";
import { presentAvatarGenerationJob } from "@/services/avatar-generation/presenter";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobStatuses = new Set<AvatarGenerationJobStatus>([
  "pending",
  "running",
  "completed",
  "failed",
]);

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

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const url = new URL(request.url);
  const profileId = url.searchParams.get("profileId") ?? undefined;
  const status = url.searchParams.get(
    "status",
  ) as AvatarGenerationJobStatus | null;

  try {
    const jobs = await listAvatarGenerationJobs({
      profileId,
      status: status && jobStatuses.has(status) ? status : undefined,
    });

    return jsonData({
      jobs: jobs.map(presentAvatarGenerationJob),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to list avatar generation jobs",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const body = (await request.json().catch(() => null)) as {
    negativePrompt?: unknown;
    profileId?: unknown;
    prompt?: unknown;
    providerConfigId?: unknown;
    style?: unknown;
  } | null;
  const prompt = getString(body?.prompt);
  const negativePrompt = getString(body?.negativePrompt);
  const profileId = getString(body?.profileId);
  const providerConfigId = getString(body?.providerConfigId);
  const style = getString(body?.style);

  if (!prompt) {
    return jsonError(
      {
        code: "bad_request",
        message: "prompt is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  if (prompt.length > 1_000) {
    return jsonError(
      {
        code: "bad_request",
        message: "prompt must be 1000 characters or fewer",
        retryable: false,
      },
      { status: 400 },
    );
  }

  let createdJob: Awaited<ReturnType<typeof createAvatarGenerationJob>>;
  try {
    createdJob = await createAvatarGenerationJob({
      negativePrompt,
      profileId,
      prompt,
      providerConfigId,
      style,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create avatar generation job",
        retryable: true,
      },
      { status: 503 },
    );
  }

  try {
    const result = await processAvatarGenerationJob({
      jobId: createdJob.id,
      negativePrompt,
      profileId,
      prompt,
      style,
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
}
