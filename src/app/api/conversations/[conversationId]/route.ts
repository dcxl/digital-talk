import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  deleteConversation,
  getConversationWithMessages,
} from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
