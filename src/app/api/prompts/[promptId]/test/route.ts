import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { getLLMProvider } from "@/providers/llm";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { getPromptTemplate } from "@/services/prompts/repository";
import { renderPromptContent } from "@/services/prompts/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getVariableValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => typeof entryValue === "string")
      .map(([key, entryValue]) => [key, (entryValue as string).trim()]),
  );
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
    message?: unknown;
    variables?: unknown;
    versionId?: unknown;
  } | null;
  const prompt = await getPromptTemplate(promptId);

  if (!prompt) {
    return jsonError(
      {
        code: "not_found",
        message: "Prompt not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  const versionId = getString(body?.versionId);
  const version =
    prompt.versions.find((item) => item.id === versionId) ??
    prompt.currentVersion ??
    prompt.versions[0];

  if (!version) {
    return jsonError(
      {
        code: "bad_request",
        message: "Prompt version is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const rendered = renderPromptContent(
    version.content,
    version.variables ?? prompt.variables,
    getVariableValues(body?.variables),
  );

  if (rendered.missingVariables.length > 0) {
    return jsonError(
      {
        code: "bad_request",
        message: `Missing variables: ${rendered.missingVariables.join(", ")}`,
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const llmProvider = getLLMProvider();
    const startedAt = Date.now();
    const message = getString(body?.message) || "请用一句话介绍你自己";
    let output = "";
    let totalTokens = 0;

    for await (const chunk of llmProvider.chat({
      messages: [
        {
          role: "system",
          content: rendered.content,
        },
        {
          role: "user",
          content: message,
        },
      ],
      signal: AbortSignal.timeout(15000),
    })) {
      if (chunk.type === "text.delta") output += chunk.text;
      if (chunk.type === "usage") totalTokens = chunk.usage.totalTokens;
      if (output.length > 500) break;
    }

    return jsonData({
      latencyMs: Date.now() - startedAt,
      output,
      renderedPrompt: rendered.content,
      usage: {
        totalTokens,
      },
    });
  } catch (error) {
    return jsonError(
      {
        code: "provider_error",
        message:
          error instanceof Error ? error.message : "Prompt test request failed",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
