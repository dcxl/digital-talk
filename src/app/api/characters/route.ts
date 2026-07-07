import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  createCharacter,
  listCharacters,
} from "@/services/characters/repository";
import { serializeCharacter } from "@/services/characters/presenter";
import {
  parseCharacterListQuery,
  parseCreateCharacterInput,
} from "@/services/characters/schema";

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
    const query = parseCharacterListQuery(request.nextUrl.searchParams);
    const characters = await listCharacters(query);

    return jsonData({
      items: characters.map(serializeCharacter),
      nextCursor: null,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list characters",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const body = await request.json().catch(() => null);
  const parsed = parseCreateCharacterInput(body);

  if (parsed.errors.length > 0) {
    return jsonError(
      {
        code: "bad_request",
        message: parsed.errors[0] ?? "Invalid character payload",
        retryable: false,
        details: {
          errors: parsed.errors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const character = await createCharacter(parsed.value);

    return jsonData(
      {
        character: serializeCharacter(character),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to create character",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

