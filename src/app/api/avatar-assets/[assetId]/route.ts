import type { AvatarAssetStatus } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { presentAvatarAsset } from "@/services/avatar-assets/presenter";
import {
  getAvatarAsset,
  softDeleteAvatarAsset,
  updateAvatarAsset,
} from "@/services/avatar-assets/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assetStatuses = new Set<AvatarAssetStatus>([
  "active",
  "processing",
  "failed",
  "deleted",
]);

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

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumberOrNull(value: unknown) {
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function notFound() {
  return jsonError(
    {
      code: "not_found",
      message: "Avatar asset not found",
      retryable: false,
    },
    { status: 404 },
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const { assetId } = await context.params;
  const asset = await getAvatarAsset(assetId);
  if (!asset) return notFound();

  return jsonData({
    asset: presentAvatarAsset(asset),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const { assetId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    height?: unknown;
    metadata?: unknown;
    name?: unknown;
    profileId?: unknown;
    publicUrl?: unknown;
    status?: unknown;
    width?: unknown;
  } | null;
  const status = getString(body?.status) as AvatarAssetStatus | undefined;

  try {
    const asset = await updateAvatarAsset({
      assetId,
      height: getNumberOrNull(body?.height),
      metadata: body?.metadata,
      name: getString(body?.name),
      profileId:
        body?.profileId === null ? null : getString(body?.profileId),
      publicUrl:
        body?.publicUrl === null ? null : getString(body?.publicUrl),
      status: status && assetStatuses.has(status) ? status : undefined,
      width: getNumberOrNull(body?.width),
    });

    return jsonData({
      asset: presentAvatarAsset(asset),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update avatar asset",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const { assetId } = await context.params;

  try {
    const asset = await softDeleteAvatarAsset(assetId);

    return jsonData({
      asset: presentAvatarAsset(asset),
      deleted: true,
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to delete avatar asset",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
