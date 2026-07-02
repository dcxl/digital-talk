import type { ProviderType } from "@/generated/prisma/client";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  createProviderConfig,
  listProviderConfigs,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  getEnvASRProvider,
  getEnvLLMProvider,
  getEnvTTSProvider,
} from "@/services/providers/env-provider";
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

export async function GET() {
  if (!isDatabaseConfigured()) {
    return jsonData({
      persistenceEnabled: false,
      providers: [getEnvLLMProvider(), getEnvTTSProvider(), getEnvASRProvider()],
    });
  }

  try {
    const providers = await listProviderConfigs();

    return jsonData({
      persistenceEnabled: true,
      providers: [
        getEnvLLMProvider(),
        getEnvTTSProvider(),
        getEnvASRProvider(),
        ...providers.map(sanitizeProviderConfig),
      ],
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to list providers",
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
    apiKey?: unknown;
    baseUrl?: unknown;
    enabled?: unknown;
    id?: unknown;
    model?: unknown;
    name?: unknown;
    options?: unknown;
    provider?: unknown;
    type?: unknown;
  } | null;

  const type = typeof body?.type === "string" ? body.type : "";
  const provider = typeof body?.provider === "string" ? body.provider.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!providerTypes.has(type as ProviderType) || !provider || !name) {
    return jsonError(
      {
        code: "bad_request",
        message: "type, provider and name are required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const config = await createProviderConfig({
      id:
        typeof body?.id === "string" && body.id !== "env-default-llm"
          ? body.id
          : undefined,
      apiKeyEncrypted:
        typeof body?.apiKey === "string" && body.apiKey
          ? encryptSecret(body.apiKey)
          : undefined,
      baseUrl: typeof body?.baseUrl === "string" ? body.baseUrl.trim() : undefined,
      enabled: typeof body?.enabled === "boolean" ? body.enabled : true,
      model: typeof body?.model === "string" ? body.model.trim() : undefined,
      name,
      options:
        body?.options && typeof body.options === "object"
          ? JSON.parse(JSON.stringify(body.options))
          : undefined,
      provider,
      type: type as ProviderType,
    });

    return jsonData(
      {
        provider: sanitizeProviderConfig(config),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to save provider",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
