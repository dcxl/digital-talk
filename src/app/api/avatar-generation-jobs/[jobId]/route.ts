import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { getAvatarGenerationJob } from "@/services/avatar-generation/repository";
import { presentAvatarGenerationJob } from "@/services/avatar-generation/presenter";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  if (!isDatabaseConfigured()) {
    return jsonError(
      {
        code: "database_not_configured",
        message: "DATABASE_URL must point to a real PostgreSQL host",
        retryable: true,
      },
      { status: 503 },
    );
  }

  const { jobId } = await context.params;

  try {
    const job = await getAvatarGenerationJob(jobId);
    if (!job) {
      return jsonError(
        {
          code: "not_found",
          message: "Avatar generation job not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      job: presentAvatarGenerationJob(job),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load avatar generation job",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
