import type {
  AvatarDriver,
  AvatarProfileStatus,
} from "@/generated/prisma/client";
import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import {
  avatarDrivers,
  supportedAvatarDrivers,
} from "@/services/avatar-profiles/defaults";
import {
  getAvatarProfile,
  upsertAvatarProfile,
} from "@/services/avatar-profiles/repository";
import { serializeAvatarProfile } from "@/services/avatar-profiles/presenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const avatarStatuses = new Set<AvatarProfileStatus>([
  "active",
  "disabled",
  "deleted",
]);

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  if (value === null) return null;
  const stringValue = getString(value);
  return stringValue || undefined;
}

function getDriver(value: unknown) {
  const driver = getString(value);
  return avatarDrivers.has(driver as AvatarDriver)
    ? (driver as AvatarDriver)
    : undefined;
}

function getStatus(value: unknown) {
  const status = getString(value);
  return avatarStatuses.has(status as AvatarProfileStatus)
    ? (status as AvatarProfileStatus)
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

  return jsonData({
    profile: serializeAvatarProfile(profile),
  });
}

export async function PATCH(
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

  const current = await getAvatarProfile(avatarId);
  if (!current) {
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
    background?: unknown;
    config?: unknown;
    driver?: unknown;
    isDefault?: unknown;
    language?: unknown;
    name?: unknown;
    previewImageUrl?: unknown;
    providerConfigId?: unknown;
    status?: unknown;
    voice?: unknown;
    voiceProviderId?: unknown;
  } | null;
  const driver = getDriver(body?.driver) ?? current.driver;

  if (!supportedAvatarDrivers.has(driver)) {
    return jsonError(
      {
        code: "bad_request",
        message: "Only static avatar driver is supported in MVP",
        retryable: false,
      },
      { status: 400 },
    );
  }

  try {
    const profile = await upsertAvatarProfile({
      id: avatarId,
      background: optionalString(body?.background) ?? current.background,
      config:
        body?.config && typeof body.config === "object"
          ? body.config
          : current.config,
      driver,
      isDefault:
        typeof body?.isDefault === "boolean" ? body.isDefault : current.isDefault,
      language: optionalString(body?.language) ?? current.language,
      name: getString(body?.name) || current.name,
      previewImageUrl:
        optionalString(body?.previewImageUrl) ?? current.previewImageUrl,
      providerConfigId:
        optionalString(body?.providerConfigId) ?? current.providerConfigId,
      status: getStatus(body?.status) ?? current.status,
      voice: optionalString(body?.voice) ?? current.voice,
      voiceProviderId:
        optionalString(body?.voiceProviderId) ?? current.voiceProviderId,
    });

    return jsonData({
      profile: serializeAvatarProfile(profile),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to update avatar",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
