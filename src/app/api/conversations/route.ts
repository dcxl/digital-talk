import { NextRequest } from "next/server";
import type { ConversationStatus } from "@/generated/prisma/client";
import { jsonData, jsonError } from "@/core/http/responses";
import { listConversations } from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const conversationStatuses = new Set<ConversationStatus>([
  "active",
  "archived",
  "deleted",
]);

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return jsonData({
      conversations: [],
      persistenceEnabled: false,
    });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") ?? "active";
    const starred = searchParams.get("starred");
    const limit = Number(searchParams.get("limit") ?? 30);

    if (!conversationStatuses.has(status as ConversationStatus)) {
      return jsonError(
        {
          code: "bad_request",
          message: "status must be active, archived or deleted",
          retryable: false,
        },
        { status: 400 },
      );
    }

    const conversations = await listConversations({
      limit: Number.isFinite(limit) ? limit : 30,
      q: searchParams.get("q") ?? undefined,
      starred: starred === null ? undefined : starred === "true",
      status: status as ConversationStatus,
    });

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
