import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import type { AvatarRuntimeDriver } from "@/core/providers/types";
import { getAvatarProvider } from "@/providers/avatar";
import { serializeAvatarProfile } from "@/services/avatar-profiles/presenter";
import { getAvatarProfile } from "@/services/avatar-profiles/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRuntimePackageId(config: unknown) {
  if (!config || typeof config !== "object") return undefined;

  const record = config as Record<string, unknown>;
  const runtimeConfig = record.runtime;
  const live2dConfig = record.live2d;
  const runtimePackageId =
    runtimeConfig && typeof runtimeConfig === "object"
      ? (runtimeConfig as Record<string, unknown>).packageId
      : undefined;
  const live2dPackageId =
    live2dConfig && typeof live2dConfig === "object"
      ? (live2dConfig as Record<string, unknown>).packageId
      : undefined;

  return typeof runtimePackageId === "string" && runtimePackageId.trim()
    ? runtimePackageId.trim()
    : typeof live2dPackageId === "string" && live2dPackageId.trim()
      ? live2dPackageId.trim()
      : undefined;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ avatarId: string }> },
) {
  const { avatarId } = await context.params;

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

  const profile = await getAvatarProfile(avatarId);
  if (!profile) {
    return jsonError(
      {
        code: "not_found",
        message: "Avatar profile not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  const provider = getAvatarProvider();
  const runtime = await provider.getRuntime({
    assetPackageId: getRuntimePackageId(profile.config),
    driver: profile.driver as AvatarRuntimeDriver,
    reason: "runtime",
    state: "idle",
  });

  return jsonData({
    profile: serializeAvatarProfile(profile),
    runtime,
  });
}
