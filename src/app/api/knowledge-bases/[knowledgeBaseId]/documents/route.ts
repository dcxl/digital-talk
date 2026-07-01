import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  createDocument,
  getKnowledgeBase,
  listDocuments,
} from "@/services/knowledge/repository";
import {
  isTextLikeFile,
  MAX_UPLOAD_BYTES,
  persistKnowledgeFile,
} from "@/services/knowledge/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ knowledgeBaseId: string }> },
) {
  const { knowledgeBaseId } = await context.params;

  if (!isDatabaseConfigured()) {
    return jsonData({
      documents: [],
      persistenceEnabled: false,
    });
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

  try {
    const documents = await listDocuments(knowledgeBaseId);

    return jsonData({
      documents,
      persistenceEnabled: true,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list documents",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

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

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return jsonError(
      {
        code: "bad_request",
        message: "multipart form data is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError(
      {
        code: "bad_request",
        message: "file is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError(
      {
        code: "payload_too_large",
        message: "file size exceeds 2MB",
        retryable: false,
      },
      { status: 413 },
    );
  }

  try {
    const requestedName = formData.get("name");
    const persisted = await persistKnowledgeFile({
      file,
      knowledgeBaseId,
    });
    const content = isTextLikeFile(file)
      ? new TextDecoder().decode(persisted.bytes).trim()
      : undefined;
    const document = await createDocument({
      content,
      knowledgeBaseId,
      metadata: {
        source: "upload",
      },
      mimeType: file.type || "application/octet-stream",
      name:
        typeof requestedName === "string"
          ? requestedName.trim() || file.name
          : file.name,
      originalName: file.name,
      size: file.size,
      storageKey: persisted.storageKey,
    });

    return jsonData(
      {
        document,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to upload document",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
