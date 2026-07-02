import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import type { AvatarRuntimeDriver } from "@/core/providers/types";
import type { RuntimeState } from "@/core/runtime/events";
import { getAvatarProvider } from "@/providers/avatar";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { getAvatarProfile } from "@/services/avatar-profiles/repository";
import { serializeAvatarProfile } from "@/services/avatar-profiles/presenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const previewStates = new Set<RuntimeState>([
  "idle",
  "thinking",
  "speaking",
  "error",
]);

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPreviewState(value: unknown) {
  const state = getString(value);
  return previewStates.has(state as RuntimeState)
    ? (state as RuntimeState)
    : "speaking";
}

export async function POST(
  request: NextRequest,
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

  const body = (await request.json().catch(() => null)) as {
    state?: unknown;
    text?: unknown;
  } | null;
  const state = getPreviewState(body?.state);
  const provider = getAvatarProvider();
  const result = await provider.setState({
    state,
    reason: "preview",
  });
  const runtime = await provider.getRuntime({
    driver: profile.driver as AvatarRuntimeDriver,
    state,
    reason: "preview",
  });

  return jsonData({
    profile: serializeAvatarProfile(profile),
    preview: {
      state: result.state,
      text: getString(body?.text) || `你好，我是 ${profile.name}`,
      updatedAt: result.updatedAt,
      runtime,
    },
  });
}
