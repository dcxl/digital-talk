import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { serializeWorkflowExecution } from "@/services/workflows/presenter";
import { runCharacterWorkflow } from "@/services/workflows/repository";
import { parseRunWorkflowInput } from "@/services/workflows/schema";

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
  context: { params: Promise<{ characterId: string; workflowId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseNotConfigured();

  const { characterId, workflowId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parseRunWorkflowInput(body);

  try {
    const execution = await runCharacterWorkflow(
      characterId,
      workflowId,
      parsed.value,
    );

    if (!execution) {
      return jsonError(
        {
          code: "not_found",
          message: "Workflow not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData(
      {
        execution: serializeWorkflowExecution(execution),
        executionId: execution.id,
        requiresConfirmation: execution.requiresConfirmation,
        status: execution.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to run workflow",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
