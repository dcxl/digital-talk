import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  getKnowledgeBase,
  searchDocumentChunks,
} from "@/services/knowledge/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ knowledgeBaseId: string }> },
) {
  const { knowledgeBaseId } = await context.params;

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

  const knowledgeBase = await getKnowledgeBase(knowledgeBaseId);
  if (!knowledgeBase) {
    return jsonError(
      {
        code: "not_found",
        message: "Knowledge base not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    limit?: unknown;
    query?: unknown;
  } | null;
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const limit = typeof body?.limit === "number" ? body.limit : undefined;

  if (!query) {
    return jsonError(
      {
        code: "bad_request",
        message: "query is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const chunks = await searchDocumentChunks({
      knowledgeBaseId,
      limit,
      query,
    });

    return jsonData({
      results: chunks.map((chunk) => ({
        chunkId: chunk.id,
        content: chunk.content,
        documentId: chunk.documentId,
        documentName: chunk.document.name,
        metadata: chunk.metadata,
        tokenCount: chunk.tokenCount,
      })),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to search",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
