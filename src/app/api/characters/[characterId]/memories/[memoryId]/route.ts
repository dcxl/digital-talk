import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeMemory } from "@/services/memories/presenter";
import {
  deleteCharacterMemory,
  getCharacterMemory,
  updateCharacterMemory,
} from "@/services/memories/repository";
import { parseUpdateMemoryInput } from "@/services/memories/schema";

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
  context: { params: Promise<{ characterId: string; memoryId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, memoryId } = await context.params;
  const memory = await getCharacterMemory(characterId, memoryId);

  if (!memory) {
    return jsonError(
      {
        code: "not_found",
        message: "Memory not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  return jsonData({
    memory: serializeMemory(memory),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ characterId: string; memoryId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, memoryId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseUpdateMemoryInput(body);

  if (parsed.errors.length > 0) {
    return jsonError(
      {
        code: "bad_request",
        message: parsed.errors[0] ?? "Invalid memory payload",
        retryable: false,
        details: {
          errors: parsed.errors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const memory = await updateCharacterMemory(characterId, memoryId, parsed.value);

    if (!memory) {
      return jsonError(
        {
          code: "not_found",
          message: "Memory not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      memory: serializeMemory(memory),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update memory",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ characterId: string; memoryId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, memoryId } = await context.params;

  try {
    const memory = await deleteCharacterMemory(characterId, memoryId);

    if (!memory) {
      return jsonError(
        {
          code: "not_found",
          message: "Memory not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      memory: serializeMemory(memory),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to delete memory",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
