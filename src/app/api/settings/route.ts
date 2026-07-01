import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  getGeneralSettings,
  saveGeneralSettings,
} from "@/services/settings/repository";
import { normalizeGeneralSettings } from "@/services/settings/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function databaseUnavailable() {
  return jsonError(
    {
      code: "database_not_configured",
      message: "DATABASE_URL must point to a real PostgreSQL host",
      retryable: true,
    },
    { status: 503 },
  );
}

export async function GET() {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  try {
    const general = await getGeneralSettings();

    return jsonData({
      general,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to read settings",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const body = (await request.json().catch(() => null)) as {
    general?: unknown;
  } | null;

  try {
    const general = await saveGeneralSettings(
      normalizeGeneralSettings(body?.general),
    );

    return jsonData({
      general,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to save settings",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
