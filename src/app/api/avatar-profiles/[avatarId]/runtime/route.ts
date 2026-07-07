import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import type { AvatarRuntimeDriver } from "@/core/providers/types";
import { getAvatarProvider } from "@/providers/avatar";
import { getAvatarRuntimeProfileConfig } from "@/services/avatar-runtime/profile-config";
import { serializeAvatarProfile } from "@/services/avatar-profiles/presenter";
import { getAvatarProfile } from "@/services/avatar-profiles/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const runtimeConfig = getAvatarRuntimeProfileConfig(profile.config);
  const runtime = await provider.getRuntime({
    driver: profile.driver as AvatarRuntimeDriver,
    motionMap: runtimeConfig.motionMap,
    reason: "runtime",
    state: "idle",
  });

  return jsonData({
    profile: serializeAvatarProfile(profile),
    runtime,
  });
}
