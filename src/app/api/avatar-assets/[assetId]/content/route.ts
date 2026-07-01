import { NextRequest } from "next/server";
import { jsonError } from "@/core/http/responses";
import { getAvatarAsset } from "@/services/avatar-assets/repository";
import { getAvatarAssetStorage } from "@/services/avatar-assets/storage";
import { isDatabaseConfigured } from "@/services/database/prisma";

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const { assetId } = await context.params;
  const asset = await getAvatarAsset(assetId);

  if (!asset || asset.status === "deleted") {
    return jsonError(
      {
        code: "not_found",
        message: "Avatar asset not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  try {
    const bytes = await getAvatarAssetStorage().get(asset.storageKey);

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": asset.mimeType,
      },
    });
  } catch (error) {
    return jsonError(
      {
        code: "storage_error",
        message:
          error instanceof Error ? error.message : "Failed to read avatar asset",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
