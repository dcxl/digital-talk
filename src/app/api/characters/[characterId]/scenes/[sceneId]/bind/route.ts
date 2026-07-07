import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeSceneBinding } from "@/services/scenes/presenter";
import {
  bindSceneToCharacter,
  unbindSceneFromCharacter,
} from "@/services/scenes/repository";
import { parseBindSceneInput } from "@/services/scenes/schema";

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
  context: { params: Promise<{ characterId: string; sceneId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, sceneId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseBindSceneInput(body);

  try {
    const binding = await bindSceneToCharacter(
      characterId,
      sceneId,
      parsed.value,
    );

    if (!binding) {
      return jsonError(
        {
          code: "not_found",
          message: "Character or scene not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      binding: serializeSceneBinding(binding),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to bind scene",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ characterId: string; sceneId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, sceneId } = await context.params;

  try {
    const deleted = await unbindSceneFromCharacter(characterId, sceneId);

    if (!deleted) {
      return jsonError(
        {
          code: "not_found",
          message: "Scene binding not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      deleted: true,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to unbind scene",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
