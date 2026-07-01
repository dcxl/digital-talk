import { jsonData, jsonError } from "@/core/http/responses";
import { testLLMProvider } from "@/services/providers/llm-provider-test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    apiKey?: unknown;
    baseUrl?: unknown;
    message?: unknown;
    model?: unknown;
    provider?: unknown;
    type?: unknown;
  } | null;

  const type = getString(body?.type) ?? "llm";

  if (type !== "llm") {
    return jsonError(
      {
        code: "bad_request",
        message: "Only llm provider test is supported in MVP",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const result = await testLLMProvider({
      apiKey: getString(body?.apiKey),
      baseUrl: getString(body?.baseUrl),
      message: getString(body?.message),
      model: getString(body?.model),
      provider: getString(body?.provider),
    });

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
