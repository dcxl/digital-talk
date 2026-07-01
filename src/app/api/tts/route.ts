import { jsonData, jsonError } from "@/core/http/responses";
import { getTTSProvider } from "@/providers/tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    format?: unknown;
    text?: unknown;
    voice?: unknown;
  } | null;

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const voice = typeof body?.voice === "string" ? body.voice.trim() : undefined;
  const format =
    body?.format === "mp3" || body?.format === "wav" ? body.format : "wav";

  if (!text) {
    return jsonError(
      {
        code: "bad_request",
        message: "text is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const provider = await getTTSProvider();
    const result = await provider.synthesize({
      format,
      text,
      voice,
      signal: AbortSignal.timeout(15000),
    });

    return jsonData(result);
  } catch (error) {
    return jsonError(
      {
        code: "provider_error",
        message: error instanceof Error ? error.message : "TTS provider failed",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
