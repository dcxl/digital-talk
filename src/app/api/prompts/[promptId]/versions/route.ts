import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { createPromptVersion } from "@/services/prompts/repository";
import { normalizePromptVariables } from "@/services/prompts/render";
import { serializePromptTemplate } from "@/services/prompts/presenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ promptId: string }> },
) {
  const { promptId } = await context.params;

  if (!isDatabaseConfigured()) {
    return jsonError(
      {
        code: "database_not_configured",
        message: "DATABASE_URL must point to a real PostgreSQL host",
        retryable: true,
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    changelog?: unknown;
    content?: unknown;
    setCurrent?: unknown;
    variables?: unknown;
  } | null;
  const content = getString(body?.content);
  const changelog = getString(body?.changelog);
  const variables = normalizePromptVariables(body?.variables);

  if (!content) {
    return jsonError(
      {
        code: "bad_request",
        message: "content is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const prompt = await createPromptVersion({
      changelog: changelog || undefined,
      content,
      promptTemplateId: promptId,
      setCurrent: body?.setCurrent !== false,
      variables,
    });

    return jsonData({
      prompt: serializePromptTemplate(prompt),
    });
  } catch (error) {
    return jsonError(
      {
        code:
          error instanceof Error && error.message === "Prompt not found"
            ? "not_found"
            : "database_error",
        message: error instanceof Error ? error.message : "Failed to save version",
        retryable: false,
      },
      {
        status:
          error instanceof Error && error.message === "Prompt not found" ? 404 : 503,
      },
    );
  }
}
