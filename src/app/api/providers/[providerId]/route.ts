import type { ProviderType } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  getProviderConfig,
  updateProviderConfig,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { sanitizeProviderConfig } from "@/services/providers/provider-presenter";
import { encryptSecret } from "@/services/security/secret-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const providerTypes = new Set<ProviderType>([
  "llm",
  "tts",
  "asr",
  "embedding",
  "avatar",
]);

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function optionalString(value: unknown) {
  if (value === null) return null;
  return typeof value === "string" ? value.trim() : undefined;
}

export async function PATCH(
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

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return jsonError(
      {
        code: "bad_request",
        message: "JSON body is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const current = await getProviderConfig(providerId);
  if (!current) {
    return jsonError(
      {
        code: "not_found",
        message: "Provider not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  const type = hasField(body, "type") ? optionalString(body.type) : undefined;
  if (type !== undefined && !providerTypes.has(type as ProviderType)) {
    return jsonError(
      {
        code: "bad_request",
        message: "Invalid provider type",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const provider = hasField(body, "provider")
    ? optionalString(body.provider)
    : undefined;
  const name = hasField(body, "name") ? optionalString(body.name) : undefined;

  if (provider === "" || name === "") {
    return jsonError(
      {
        code: "bad_request",
        message: "provider and name cannot be empty",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const config = await updateProviderConfig({
      id: providerId,
      apiKeyEncrypted:
        hasField(body, "apiKey") && typeof body.apiKey === "string" && body.apiKey
          ? encryptSecret(body.apiKey)
          : undefined,
      baseUrl: hasField(body, "baseUrl") ? optionalString(body.baseUrl) : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      model: hasField(body, "model") ? optionalString(body.model) : undefined,
      name: name ?? undefined,
      options:
        body.options && typeof body.options === "object"
          ? JSON.parse(JSON.stringify(body.options))
          : undefined,
      provider: provider ?? undefined,
      type: type as ProviderType | undefined,
    });

    return jsonData({
      provider: sanitizeProviderConfig(config),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to update provider",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
