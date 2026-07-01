import type {
  AvatarDriver,
  AvatarProfileStatus,
} from "@/generated/prisma/client";
import { jsonData, jsonError } from "@/core/http/responses";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { avatarDrivers, supportedAvatarDrivers } from "@/services/avatar-profiles/defaults";
import {
  listAvatarProfiles,
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

function getNullableString(value: unknown) {
  if (value === null) return null;
  const stringValue = getString(value);
  return stringValue || undefined;
}

function getDriver(value: unknown) {
  const driver = getString(value);
  return avatarDrivers.has(driver as AvatarDriver)
    ? (driver as AvatarDriver)
    : null;
}

function getStatus(value: unknown) {
  const status = getString(value);
  return avatarStatuses.has(status as AvatarProfileStatus)
    ? (status as AvatarProfileStatus)
    : undefined;
}

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
    const profiles = await listAvatarProfiles();

    return jsonData({
      profiles: profiles.map(serializeAvatarProfile),
    });
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message:
          error instanceof Error ? error.message : "Failed to list avatars",
        retryable: true,
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
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
    background?: unknown;
    config?: unknown;
    driver?: unknown;
    id?: unknown;
    isDefault?: unknown;
    language?: unknown;
    name?: unknown;
    previewImageUrl?: unknown;
    providerConfigId?: unknown;
    status?: unknown;
    voice?: unknown;
    voiceProviderId?: unknown;
  } | null;
  const name = getString(body?.name);
  const driver = getDriver(body?.driver) ?? "static";

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
      id: getString(body?.id) || undefined,
      background: getNullableString(body?.background),
      config:
        body?.config && typeof body.config === "object" ? body.config : undefined,
      driver,
      isDefault: typeof body?.isDefault === "boolean" ? body.isDefault : false,
      language: getNullableString(body?.language),
      name,
      previewImageUrl: getNullableString(body?.previewImageUrl),
      providerConfigId: getNullableString(body?.providerConfigId),
      status: getStatus(body?.status),
      voice: getNullableString(body?.voice),
      voiceProviderId: getNullableString(body?.voiceProviderId),
    });

    return jsonData(
      {
        profile: serializeAvatarProfile(profile),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(
      {
        code: "database_error",
        message: error instanceof Error ? error.message : "Failed to save avatar",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
