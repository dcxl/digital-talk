import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeScene } from "@/services/scenes/presenter";
import { createScene, listScenes } from "@/services/scenes/repository";
import {
  parseCreateSceneInput,
  parseSceneListQuery,
} from "@/services/scenes/schema";

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

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  try {
    const query = parseSceneListQuery(request.nextUrl.searchParams);
    const scenes = await listScenes(query);

    return jsonData({
      items: scenes.map(serializeScene),
      nextCursor: null,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to list scenes",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const body = await request.json().catch(() => null);
  const parsed = parseCreateSceneInput(body);

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
    const scene = await createScene(parsed.value);

    return jsonData(
      {
        scene: serializeScene(scene),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to create scene",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
