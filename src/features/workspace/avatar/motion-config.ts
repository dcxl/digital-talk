import {
  getAvatarRuntimeMotionMapFromConfig,
  normalizeAvatarRuntimeMotionMap,
  type AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";

export const avatarMotionMapExample = JSON.stringify(
  {
    error: {
      expression: ["sad", "neutral"],
    },
    speaking: {
      expression: ["happy", "speaking"],
      motion: "talk-soft",
    },
    thinking: {
      expression: "thinking",
      motion: "float",
    },
  },
  null,
  2,
);

interface AvatarMotionMapParseResult {
  config?: Record<string, unknown>;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toConfigRecord(config: unknown) {
  return isRecord(config) ? { ...config } : {};
}

function getMotionMapSource(value: unknown) {
  if (!isRecord(value)) return value;

  const runtime = value.runtime;
  if (isRecord(runtime) && "motionMap" in runtime) {
    return runtime.motionMap;
  }

  return value;
}

function removeMotionMap(config: unknown) {
  const nextConfig = toConfigRecord(config);
  const runtime = isRecord(nextConfig.runtime) ? { ...nextConfig.runtime } : {};

  delete runtime.motionMap;
  delete nextConfig.motionMap;

  if (Object.keys(runtime).length > 0) {
    nextConfig.runtime = runtime;
  } else {
    delete nextConfig.runtime;
  }

  return nextConfig;
}

function writeMotionMap(config: unknown, motionMap: AvatarRuntimeMotionMap) {
  const nextConfig = toConfigRecord(config);
  const runtime = isRecord(nextConfig.runtime) ? { ...nextConfig.runtime } : {};

  delete nextConfig.motionMap;
  nextConfig.runtime = {
    ...runtime,
    motionMap,
  };

  return nextConfig;
}

export function getAvatarMotionMapEditorValue(config: unknown) {
  const motionMap = getAvatarRuntimeMotionMapFromConfig(config);

  return Object.keys(motionMap).length > 0
    ? JSON.stringify(motionMap, null, 2)
    : "";
}

export function parseAvatarMotionMapEditorValue(
  config: unknown,
  value: string,
): AvatarMotionMapParseResult {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return {
      config: removeMotionMap(config),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedValue) as unknown;
  } catch {
    return {
      error: "动作映射 JSON 格式不正确",
    };
  }

  if (!isRecord(parsed)) {
    return {
      error: "动作映射必须是对象",
    };
  }

  const motionMap = normalizeAvatarRuntimeMotionMap(getMotionMapSource(parsed));
  if (Object.keys(motionMap).length === 0) {
    return {
      error: "未识别到可用的状态动作",
    };
  }

  return {
    config: writeMotionMap(config, motionMap),
  };
}

