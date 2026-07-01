import { jsonData, jsonError } from "@/core/http/responses";
import { listActiveConversations } from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return jsonData({
      conversations: [],
      persistenceEnabled: false,
    });
  }

  try {
    const conversations = await listActiveConversations();

    return jsonData({
      conversations,
      persistenceEnabled: true,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list conversations",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
