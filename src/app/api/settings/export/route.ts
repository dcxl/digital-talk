import { jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { buildWorkspaceExport } from "@/services/settings/exporter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
    const payload = await buildWorkspaceExport();
    const body = JSON.stringify(payload, null, 2);

    return new Response(body, {
      headers: {
        "Content-Disposition": `attachment; filename="next-digital-human-export-${Date.now()}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to export workspace",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
