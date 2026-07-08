import {
  getAvatarRuntimeMotionAssetsFromConfig,
  normalizeAvatarRuntimeMotionAssets,
  type AvatarRuntimeMotionAssetKind,
  type AvatarRuntimeMotionAssetMap,
} from "@/core/avatar-runtime/motion-assets";
import type { RuntimeState } from "@/core/runtime/events";

export const avatarMotionAssetsExample = JSON.stringify(
  {
    idle: {
      kind: "image",
      url: "/marketing/beautiful_girl.png",
    },
    speaking: {
      kind: "video",
      loop: true,
      posterUrl: "/marketing/beautiful_girl.png",
      url: "/avatars/demo/speaking.mp4",
    },
    thinking: {
      kind: "image",
      url: "/marketing/beautiful_girl.png",
    },
  },
  null,
  2,
);

interface AvatarMotionAssetsParseResult {
  config?: Record<string, unknown>;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toConfigRecord(config: unknown) {
  return isRecord(config) ? { ...config } : {};
}

function getMotionAssetsSource(value: unknown) {
  if (!isRecord(value)) return value;

  const runtime = value.runtime;
  if (isRecord(runtime) && "motionAssets" in runtime) {
    return runtime.motionAssets;
  }

  return value;
}

function removeMotionAssets(config: unknown) {
  const nextConfig = toConfigRecord(config);
  const runtime = isRecord(nextConfig.runtime) ? { ...nextConfig.runtime } : {};

  delete runtime.motionAssets;
  delete nextConfig.motionAssets;

  if (Object.keys(runtime).length > 0) {
    nextConfig.runtime = runtime;
  } else {
    delete nextConfig.runtime;
  }

  return nextConfig;
}

function writeMotionAssets(
  config: unknown,
  motionAssets: AvatarRuntimeMotionAssetMap,
) {
  const nextConfig = toConfigRecord(config);
  const runtime = isRecord(nextConfig.runtime) ? { ...nextConfig.runtime } : {};

  delete nextConfig.motionAssets;
  nextConfig.runtime = {
    ...runtime,
    motionAssets,
  };

  return nextConfig;
}

export function upsertAvatarMotionAssetConfig(
  config: unknown,
  input: {
    id?: string;
    kind: AvatarRuntimeMotionAssetKind;
    label?: string;
    state: RuntimeState;
    url: string;
  },
) {
  const motionAssets = getAvatarRuntimeMotionAssetsFromConfig(config);

  return writeMotionAssets(config, {
    ...motionAssets,
    [input.state]: {
      ...(input.id ? { id: input.id } : {}),
      kind: input.kind,
      ...(input.label ? { label: input.label } : {}),
      url: input.url,
    },
  });
}

export function getAvatarMotionAssetsEditorValue(config: unknown) {
  const motionAssets = getAvatarRuntimeMotionAssetsFromConfig(config);

  return Object.keys(motionAssets).length > 0
    ? JSON.stringify(motionAssets, null, 2)
    : "";
}

export function parseAvatarMotionAssetsEditorValue(
  config: unknown,
  value: string,
): AvatarMotionAssetsParseResult {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return {
      config: removeMotionAssets(config),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedValue) as unknown;
  } catch {
    return {
      error: "表现资产 JSON 格式不正确",
    };
  }

  if (!isRecord(parsed)) {
    return {
      error: "表现资产必须是对象",
    };
  }

  const motionAssets = normalizeAvatarRuntimeMotionAssets(
    getMotionAssetsSource(parsed),
  );
  if (Object.keys(motionAssets).length === 0) {
    return {
      error: "未识别到可用的表现资产",
    };
  }

  return {
    config: writeMotionAssets(config, motionAssets),
  };
}
