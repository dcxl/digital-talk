import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { presentAvatarGenerationJob } from "@/services/avatar-generation/presenter";
import { getCharacter } from "@/services/characters/repository";
import { getComfyUIConfig, isComfyUIConfigured } from "@/services/comfyui/config";
import { createComfyUIAppearanceGenerationJob } from "@/services/comfyui/provider";
import { parseComfyUIAppearanceRequest } from "@/services/comfyui/workflow";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function databaseNotConfigured() {
  return jsonError(
    {
      code: "database_not_configured",
      message: "DATABASE_URL must point to a real PostgreSQL host",
      retryable: true,
    },
    { status: 503 },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const config = getComfyUIConfig();
  if (!isComfyUIConfigured(config)) {
    return jsonError(
      {
        code: "provider_not_configured",
        message: "ComfyUI provider is not configured",
        retryable: true,
      },
      { status: 503 },
    );
  }

  const { characterId } = await context.params;
  const character = await getCharacter(characterId);

  if (!character) {
    return jsonError(
      {
        code: "not_found",
        message: "Character not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseComfyUIAppearanceRequest(body);

  if (parsed.errors.length > 0) {
    return jsonError(
      {
        code: "bad_request",
        message: parsed.errors[0] ?? "Invalid appearance generation payload",
        retryable: false,
        details: {
          errors: parsed.errors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const job = await createComfyUIAppearanceGenerationJob({
      character,
      config,
      request: parsed.value,
    });

    return jsonData(
      {
        job: presentAvatarGenerationJob(job),
        provider: {
          mock: config.mock,
          type: config.provider,
          workflowId: config.workflowId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create appearance generation job",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
