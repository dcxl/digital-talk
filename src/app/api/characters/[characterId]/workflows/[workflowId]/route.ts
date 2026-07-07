import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeWorkflow } from "@/services/workflows/presenter";
import {
  getCharacterWorkflow,
  updateCharacterWorkflow,
} from "@/services/workflows/repository";
import { parseUpdateWorkflowInput } from "@/services/workflows/schema";

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
  context: { params: Promise<{ characterId: string; workflowId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, workflowId } = await context.params;
  const workflow = await getCharacterWorkflow(characterId, workflowId);

  if (!workflow) {
    return jsonError(
      {
        code: "not_found",
        message: "Workflow not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  return jsonData({
    workflow: serializeWorkflow(workflow),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ characterId: string; workflowId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, workflowId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseUpdateWorkflowInput(body);

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
    const workflow = await updateCharacterWorkflow(
      characterId,
      workflowId,
      parsed.value,
    );

    if (!workflow) {
      return jsonError(
        {
          code: "not_found",
          message: "Workflow not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      workflow: serializeWorkflow(workflow),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update workflow",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
