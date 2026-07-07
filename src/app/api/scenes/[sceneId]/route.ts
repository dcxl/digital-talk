import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeScene } from "@/services/scenes/presenter";
import { getScene, updateScene } from "@/services/scenes/repository";
import { parseUpdateSceneInput } from "@/services/scenes/schema";

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { sceneId } = await context.params;
  const scene = await getScene(sceneId);

  if (!scene) {
    return jsonError(
      {
        code: "not_found",
        message: "Scene not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  return jsonData({
    scene: serializeScene(scene),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { sceneId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseUpdateSceneInput(body);

  if (parsed.errors.length > 0) {
    return jsonError(
      {
        code: "bad_request",
        message: parsed.errors[0] ?? "Invalid scene payload",
        retryable: false,
        details: {
          errors: parsed.errors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const scene = await updateScene(sceneId, parsed.value);

    if (!scene) {
      return jsonError(
        {
          code: "not_found",
          message: "Scene not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      scene: serializeScene(scene),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update scene",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
