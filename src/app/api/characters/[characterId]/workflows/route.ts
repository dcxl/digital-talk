import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeWorkflow } from "@/services/workflows/presenter";
import {
  createCharacterWorkflow,
  listCharacterWorkflows,
} from "@/services/workflows/repository";
import {
  parseCreateWorkflowInput,
  parseWorkflowListQuery,
} from "@/services/workflows/schema";

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
    const query = parseWorkflowListQuery(request.nextUrl.searchParams);
    const workflows = await listCharacterWorkflows(characterId, query);

    return jsonData({
      items: workflows.map(serializeWorkflow),
      nextCursor: null,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list workflows",
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
  const parsed = parseCreateWorkflowInput(body);

  if (parsed.errors.length > 0) {
    return jsonError(
      {
        code: "bad_request",
        message: parsed.errors[0] ?? "Invalid workflow payload",
        retryable: false,
        details: {
          errors: parsed.errors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const workflow = await createCharacterWorkflow(characterId, parsed.value);

    return jsonData(
      {
        workflow: serializeWorkflow(workflow),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to create workflow",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
