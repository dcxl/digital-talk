import { jsonData, jsonError } from "@/core/http/responses";
import { interruptAssistantMessage } from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    conversationId?: unknown;
    messageId?: unknown;
    reason?: unknown;
  } | null;

  const conversationId =
    typeof body?.conversationId === "string" ? body.conversationId : undefined;
  const messageId =
    typeof body?.messageId === "string" ? body.messageId : undefined;

  if (!conversationId && !messageId) {
    return jsonError(
      {
        code: "bad_request",
        message: "conversationId or messageId is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  if (!isDatabaseConfigured()) {
    return jsonData({
      interrupted: true,
      persisted: false,
    });
  }

  try {
    const message = await interruptAssistantMessage({
      conversationId,
      messageId,
    });

    return jsonData({
      interrupted: true,
      messageId: message?.id ?? messageId,
      persisted: Boolean(message),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to interrupt message",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
