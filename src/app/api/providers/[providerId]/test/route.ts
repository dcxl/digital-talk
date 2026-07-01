import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  getProviderConfig,
  updateProviderTestStatus,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { testLLMProvider } from "@/services/providers/llm-provider-test";
import { testTTSProvider } from "@/services/providers/tts-provider-test";
import { decryptSecret } from "@/services/security/secret-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStringOption(options: unknown, key: string) {
  if (!options || typeof options !== "object") return undefined;

  const value = (options as Record<string, unknown>)[key];
  return getString(value);
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

  if (provider.type !== "llm" && provider.type !== "tts") {
    return jsonError(
      {
        code: "bad_request",
        message: "Only llm and tts provider tests are supported",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    format?: unknown;
    input?: unknown;
    message?: unknown;
    text?: unknown;
    voice?: unknown;
  } | null;

  try {
    const apiKey = provider.apiKeyEncrypted
      ? decryptSecret(provider.apiKeyEncrypted)
      : undefined;
    const result =
      provider.type === "tts"
        ? await testTTSProvider({
            apiKey,
            baseUrl: provider.baseUrl ?? undefined,
            format:
              getString(body?.format) === "wav" ||
              getStringOption(provider.options, "format") === "wav"
                ? "wav"
                : "mp3",
            model: provider.model ?? undefined,
            name: provider.name,
            provider: provider.provider,
            text:
              getString(body?.input) ??
              getString(body?.text) ??
              getString(body?.message),
            voice:
              getString(body?.voice) ??
              getStringOption(provider.options, "voice") ??
              process.env.DEFAULT_TTS_VOICE,
          })
        : await testLLMProvider({
            apiKey,
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
