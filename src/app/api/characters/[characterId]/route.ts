import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  deleteCharacter,
  getCharacter,
  updateCharacter,
} from "@/services/characters/repository";
import { serializeCharacter } from "@/services/characters/presenter";
import { parseUpdateCharacterInput } from "@/services/characters/schema";

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
  context: { params: Promise<{ characterId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

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

  return jsonData({
    character: serializeCharacter(character),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseUpdateCharacterInput(body);

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
    const character = await updateCharacter(characterId, parsed.value);

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

    return jsonData({
      character: serializeCharacter(character),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update character",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ characterId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId } = await context.params;

  try {
    const character = await deleteCharacter(characterId);

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

    return jsonData({
      character: serializeCharacter(character),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to delete character",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

