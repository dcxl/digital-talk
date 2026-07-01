import { jsonData, jsonError } from "@/core/http/responses";
import { testLLMProvider } from "@/services/providers/llm-provider-test";
import { testTTSProvider } from "@/services/providers/tts-provider-test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    apiKey?: unknown;
    baseUrl?: unknown;
    format?: unknown;
    message?: unknown;
    model?: unknown;
    provider?: unknown;
    text?: unknown;
    type?: unknown;
    voice?: unknown;
  } | null;

  const type = getString(body?.type) ?? "llm";

  try {
    const result =
      type === "tts"
        ? await testTTSProvider({
            apiKey: getString(body?.apiKey),
            baseUrl: getString(body?.baseUrl),
            format: getString(body?.format) === "wav" ? "wav" : "mp3",
            model: getString(body?.model),
            provider: getString(body?.provider),
            text: getString(body?.text) ?? getString(body?.message),
            voice: getString(body?.voice),
          })
        : type === "llm"
          ? await testLLMProvider({
              apiKey: getString(body?.apiKey),
              baseUrl: getString(body?.baseUrl),
              message: getString(body?.message),
              model: getString(body?.model),
              provider: getString(body?.provider),
            })
          : null;

    if (!result) {
      return jsonError(
        {
          code: "bad_request",
          message: "Only llm and tts provider tests are supported",
          retryable: false,
        },
        { status: 400 },
      );
    }

    return jsonData({
      result,
    });
  } catch (error) {
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
