import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  deleteConversation,
  getConversation,
  getConversationWithMessages,
  updateConversation,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import type { ConversationStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const conversationStatuses = new Set<ConversationStatus>([
  "active",
  "archived",
  "deleted",
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await context.params;

  if (!isDatabaseConfigured()) {
    return jsonData({
      conversation: null,
      persistenceEnabled: false,
    });
  }

  try {
    const conversation = await getConversationWithMessages(conversationId);

    if (!conversation) {
      return jsonError(
        {
          code: "not_found",
          message: "Conversation not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    return jsonData({
      conversation,
      persistenceEnabled: true,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to get conversation",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await context.params;

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

  try {
    const existing = await getConversation(conversationId);

    if (!existing) {
      return jsonError(
        {
          code: "not_found",
          message: "Conversation not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    const conversation = await deleteConversation(conversationId);

    return jsonData({
      conversation,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to delete conversation",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await context.params;

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
    isStarred?: unknown;
    status?: unknown;
    title?: unknown;
  } | null;
  const status = typeof body?.status === "string" ? body.status : undefined;

  if (status && !conversationStatuses.has(status as ConversationStatus)) {
    return jsonError(
      {
        code: "bad_request",
        message: "status must be active, archived or deleted",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const existing = await getConversationWithMessages(conversationId);

    if (!existing) {
      return jsonError(
        {
          code: "not_found",
          message: "Conversation not found",
          retryable: false,
        },
        { status: 404 },
      );
    }

    const conversation = await updateConversation({
      conversationId,
      isStarred:
        typeof body?.isStarred === "boolean" ? body.isStarred : undefined,
      status: status as ConversationStatus | undefined,
      title: typeof body?.title === "string" ? body.title : undefined,
    });

    return jsonData({
      conversation,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update conversation",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
