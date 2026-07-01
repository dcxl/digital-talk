import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  createKnowledgeBase,
  listKnowledgeBases,
} from "@/services/knowledge/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return jsonData({
      knowledgeBases: [],
      persistenceEnabled: false,
    });
  }

  try {
    const knowledgeBases = await listKnowledgeBases();

    return jsonData({
      knowledgeBases,
      persistenceEnabled: true,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list knowledge bases",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
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
    description?: unknown;
    name?: unknown;
  } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : undefined;

  if (!name) {
    return jsonError(
      {
        code: "bad_request",
        message: "name is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const knowledgeBase = await createKnowledgeBase({
      description,
      name,
    });

    return jsonData(
      {
        knowledgeBase,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to create knowledge base",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
