import { jsonData, jsonError } from "@/core/http/responses";
import { getLLMProvider } from "@/providers/llm";
import { createOpenAICompatibleProvider } from "@/providers/llm/openai-compatible-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function testLLMProvider(input: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  message?: string;
}) {
  const provider =
    input.apiKey && input.baseUrl && input.model
      ? createOpenAICompatibleProvider({
          apiKey: input.apiKey,
          baseUrl: input.baseUrl,
          model: input.model,
          name: "Provider Test",
        })
      : getLLMProvider();

  const startedAt = Date.now();
  let text = "";

  for await (const chunk of provider.chat({
    messages: [
      {
        role: "user",
        content: input.message ?? "请用一句话回复：provider test ok",
      },
    ],
    signal: AbortSignal.timeout(15000),
  })) {
    if (chunk.type === "text.delta") {
      text += chunk.text;
      if (text.length >= 24) break;
    }
  }

  return {
    latencyMs: Date.now() - startedAt,
    providerId: provider.id,
    providerName: provider.name,
    sample: text,
    success: Boolean(text),
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    apiKey?: unknown;
    baseUrl?: unknown;
    message?: unknown;
    model?: unknown;
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
