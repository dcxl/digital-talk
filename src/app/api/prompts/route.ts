import type { PromptType } from "@/generated/prisma/client";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { promptTypes } from "@/services/prompts/defaults";
import {
  createPromptTemplate,
  listPromptTemplates,
} from "@/services/prompts/repository";
import { normalizePromptVariables } from "@/services/prompts/render";
import { serializePromptTemplate } from "@/services/prompts/presenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPromptType(value: unknown) {
  const type = getString(value);
  return promptTypes.has(type as PromptType) ? (type as PromptType) : null;
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const type = getPromptType(url.searchParams.get("type"));

  try {
    const prompts = await listPromptTemplates({
      type: type ?? undefined,
    });

    return jsonData({
      prompts: prompts.map(serializePromptTemplate),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to list prompts",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
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
    content?: unknown;
    description?: unknown;
    name?: unknown;
    type?: unknown;
    variables?: unknown;
  } | null;
  const type = getPromptType(body?.type);
  const name = getString(body?.name);
  const content = getString(body?.content);
  const description = getString(body?.description);
  const variables = normalizePromptVariables(body?.variables);

  if (!type || !name || !content) {
    return jsonError(
      {
        code: "bad_request",
        message: "type, name and content are required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const prompt = await createPromptTemplate({
      content,
      description: description || undefined,
      name,
      type,
      variables,
    });

    return jsonData(
      {
        prompt: serializePromptTemplate(prompt),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to create prompt",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
