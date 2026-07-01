import { jsonData, jsonError } from "@/core/http/responses";
import { getASRProvider } from "@/providers/asr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const audio = formData?.get("audio");
  const language = formData?.get("language");

  if (!(audio instanceof Blob)) {
    return jsonError(
      {
        code: "bad_request",
        message: "audio file is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const result = await getASRProvider().transcribe({
      audio,
      language: typeof language === "string" ? language : undefined,
      signal: AbortSignal.timeout(15000),
    });

    return jsonData(result);
  } catch (error) {
    return jsonError(
      {
        code: "provider_error",
        message: error instanceof Error ? error.message : "ASR provider failed",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
