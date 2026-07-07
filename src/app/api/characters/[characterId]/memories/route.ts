import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeMemory } from "@/services/memories/presenter";
import {
  createCharacterMemory,
  listCharacterMemories,
} from "@/services/memories/repository";
import {
  parseCreateMemoryInput,
  parseMemoryListQuery,
} from "@/services/memories/schema";

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
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId } = await context.params;

  try {
    const query = parseMemoryListQuery(request.nextUrl.searchParams);
    const memories = await listCharacterMemories(characterId, query);

    return jsonData({
      items: memories.map(serializeMemory),
      nextCursor: null,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list memories",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseCreateMemoryInput(body);

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
    const memory = await createCharacterMemory(characterId, parsed.value);

    return jsonData(
      {
        memory: serializeMemory(memory),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to create memory",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
