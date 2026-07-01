import { jsonData, jsonError } from "@/core/http/responses";
import { presentAvatarAsset } from "@/services/avatar-assets/presenter";
import { createAvatarAsset } from "@/services/avatar-assets/repository";
import { getAvatarAssetStorage } from "@/services/avatar-assets/storage";
import { DEFAULT_USER_ID } from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxFileSize = 8 * 1024 * 1024;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

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

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailable();

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return jsonError(
      {
        code: "bad_request",
        message: "multipart form data is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!isFile(file)) {
    return jsonError(
      {
        code: "bad_request",
        message: "file is required",
        retryable: false,
      },
      { status: 400 },
    );
  }

  if (!supportedMimeTypes.has(file.type)) {
    return jsonError(
      {
        code: "unsupported_file_type",
        message: "Only PNG, JPEG and WebP images are supported",
        retryable: false,
      },
      { status: 400 },
    );
  }

  if (file.size > maxFileSize) {
    return jsonError(
      {
        code: "file_too_large",
        message: "Avatar asset image must be 8MB or smaller",
        retryable: false,
      },
      { status: 413 },
    );
  }

  try {
    const stored = await getAvatarAssetStorage().put({
      bytes: await file.arrayBuffer(),
      mimeType: file.type,
      originalName: file.name,
      userId: DEFAULT_USER_ID,
    });
    const asset = await createAvatarAsset({
      metadata: {
        originalName: file.name,
      },
      mimeType: file.type,
      name: getString(formData?.get("name")) ?? file.name,
      profileId: getString(formData?.get("profileId")),
      publicUrl: stored.publicUrl,
      size: stored.size,
      source: "upload",
      storageKey: stored.storageKey,
      type: "image",
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
        code: "upload_failed",
        message:
          error instanceof Error ? error.message : "Failed to upload avatar asset",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
