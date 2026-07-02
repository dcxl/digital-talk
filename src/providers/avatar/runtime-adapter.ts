import type {
  AvatarRuntimeDriver,
  AvatarRuntimeInput,
  AvatarRuntimeResult,
} from "@/core/providers/types";

const adapters: Record<
  AvatarRuntimeDriver,
  {
    adapterId: string;
    adapterName: string;
    capabilities: AvatarRuntimeResult["capabilities"];
    fallbackDriver?: AvatarRuntimeDriver;
    status: AvatarRuntimeResult["status"];
  }
> = {
  live2d: {
    adapterId: "live2d-placeholder",
    adapterName: "Live2D 占位运行时",
    capabilities: {
      image: true,
      live2d: false,
      viseme: true,
      vrm: false,
    },
    fallbackDriver: "static",
    status: "placeholder",
  },
  static: {
    adapterId: "static-avatar-runtime",
    adapterName: "静态数字人运行时",
    capabilities: {
      image: true,
      live2d: false,
      viseme: true,
      vrm: false,
    },
    status: "ready",
  },
  vrm: {
    adapterId: "vrm-placeholder",
    adapterName: "VRM 占位运行时",
    capabilities: {
      image: true,
      live2d: false,
      viseme: true,
      vrm: false,
    },
    fallbackDriver: "static",
    status: "placeholder",
  },
};

function normalizeDriver(driver?: AvatarRuntimeDriver): AvatarRuntimeDriver {
  return driver === "live2d" || driver === "vrm" ? driver : "static";
}

function getMouthOpen(input: AvatarRuntimeInput) {
  if (input.state !== "speaking") return 0;
  if (typeof input.mouthOpen !== "number") return 0;

  return Math.max(0, Math.min(1, input.mouthOpen));
}

export function resolveAvatarRuntime(
  input: AvatarRuntimeInput,
): AvatarRuntimeResult {
  const driver = normalizeDriver(input.driver);
  const adapter = adapters[driver];

  return {
    ...adapter,
    driver,
    mouth: {
      openness: getMouthOpen(input),
      source: input.state === "speaking" ? "audio-volume" : "none",
    },
    reason: input.reason,
    state: input.state,
    updatedAt: new Date().toISOString(),
  };
}
