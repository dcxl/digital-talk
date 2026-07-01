import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  getProviderConfig,
  updateProviderTestStatus,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { testLLMProvider } from "@/services/providers/llm-provider-test";
import { decryptSecret } from "@/services/security/secret-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> },
) {
  const { providerId } = await context.params;

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

  const provider = await getProviderConfig(providerId);
  if (!provider) {
    return jsonError(
      {
        code: "not_found",
        message: "Provider not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  if (provider.type !== "llm") {
    return jsonError(
      {
        code: "bad_request",
        message: "Only llm provider test is supported in MVP",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    input?: unknown;
    message?: unknown;
  } | null;

  try {
    const result = await testLLMProvider({
      apiKey: provider.apiKeyEncrypted
        ? decryptSecret(provider.apiKeyEncrypted)
        : undefined,
      baseUrl: provider.baseUrl ?? undefined,
      message: getString(body?.input) ?? getString(body?.message),
      model: provider.model ?? undefined,
      name: provider.name,
      provider: provider.provider,
    });

    await updateProviderTestStatus(
      provider.id,
      result.success ? "success" : "failed",
    );

    return jsonData({
      result,
    });
  } catch (error) {
    await updateProviderTestStatus(provider.id, "failed").catch(() => undefined);

    return jsonError(
      {
        code: "provider_error",
        message:
          error instanceof Error ? error.message : "Provider test request failed",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
