import type {
  AvatarAssetSource,
  AvatarAssetStatus,
  AvatarAssetType,
} from "@/generated/prisma/client";
import { jsonData, jsonError } from "@/core/http/responses";
import {
  createAvatarAsset,
  listAvatarAssets,
} from "@/services/avatar-assets/repository";
import { presentAvatarAsset } from "@/services/avatar-assets/presenter";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assetTypes = new Set<AvatarAssetType>(["image"]);
const assetSources = new Set<AvatarAssetSource>([
  "upload",
  "generated",
  "remote",
]);
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

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as AvatarAssetType | null;
  const status = url.searchParams.get("status") as AvatarAssetStatus | null;
  const profileId = url.searchParams.get("profileId") ?? undefined;

  try {
    const assets = await listAvatarAssets({
      profileId,
      status: status && assetStatuses.has(status) ? status : "active",
      type: type && assetTypes.has(type) ? type : undefined,
    });

    return jsonData({
      assets: assets.map(presentAvatarAsset),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list avatar assets",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const body = (await request.json().catch(() => null)) as {
    height?: unknown;
    metadata?: unknown;
    mimeType?: unknown;
    name?: unknown;
    profileId?: unknown;
    publicUrl?: unknown;
    size?: unknown;
    source?: unknown;
    status?: unknown;
    storageKey?: unknown;
    type?: unknown;
    width?: unknown;
  } | null;

  const name = getString(body?.name);
  const mimeType = getString(body?.mimeType);
  const storageKey = getString(body?.storageKey);
  const size = getNumber(body?.size);
  const source = getString(body?.source) as AvatarAssetSource | undefined;
  const type = getString(body?.type) as AvatarAssetType | undefined;
  const status = getString(body?.status) as AvatarAssetStatus | undefined;

  if (
    !name ||
    !mimeType ||
    !storageKey ||
    size === undefined ||
    !source ||
    !assetSources.has(source)
  ) {
    return jsonError(
      {
        code: "bad_request",
        message: "name, mimeType, storageKey, size and source are required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const asset = await createAvatarAsset({
      height: getNumber(body?.height),
      metadata: body?.metadata,
      mimeType,
      name,
      profileId: getString(body?.profileId),
      publicUrl: getString(body?.publicUrl),
      size,
      source,
      status: status && assetStatuses.has(status) ? status : undefined,
      storageKey,
      type: type && assetTypes.has(type) ? type : "image",
      width: getNumber(body?.width),
    });

    return jsonData(
      {
        asset: presentAvatarAsset(asset),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to create avatar asset",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
