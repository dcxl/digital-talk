"use client";

import { useCallback, useMemo, useState } from "react";
import type { RuntimeState } from "@/core/runtime/events";
import { useAvatarRuntime } from "../hooks/use-avatar-runtime";
import type { AvatarRuntimeDriver } from "../types";
import { Live2DCanvas } from "./live2d-canvas";
import { RuntimeDiagnostics } from "./runtime-diagnostics";
import { StaticAvatarView } from "./static-avatar-view";

interface AvatarRuntimeStageProps {
  avatarId?: null | string;
  avatarImageUrl?: null | string;
  avatarName?: null | string;
  driver: AvatarRuntimeDriver;
  mouthOpen: number;
  showDiagnostics?: boolean;
  state: RuntimeState;
  volume: number;
}

export function AvatarRuntimeStage({
  avatarId,
  avatarImageUrl,
  avatarName,
  driver,
  mouthOpen,
  showDiagnostics = false,
  state,
  volume,
}: AvatarRuntimeStageProps) {
  const { error, isLoading, runtime } = useAvatarRuntime(avatarId);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isLive2DReady, setIsLive2DReady] = useState(false);
  const live2dEntrypoint = runtime?.asset?.type === "live2d"
    ? runtime.asset.entrypoint
    : undefined;
  const canRenderLive2D =
    driver === "live2d" &&
    runtime?.status === "ready" &&
    runtime.capabilities.live2d &&
    live2dEntrypoint &&
    !renderError;
  const statusText = useMemo(() => {
    if (isLoading) return "运行时加载中";
    if (renderError) return renderError;
    if (error) return error;
    if (canRenderLive2D && isLive2DReady) return "Live2D ready";
    if (runtime?.status === "degraded") return "Live2D 已降级";
    return runtime?.adapterName ?? "静态运行时";
  }, [canRenderLive2D, error, isLive2DReady, isLoading, renderError, runtime]);
  const handleReady = useCallback(() => {
    setIsLive2DReady(true);
  }, []);
  const handleError = useCallback((message: string) => {
    setIsLive2DReady(false);
    setRenderError(message);
  }, []);

  return (
    <div className="flex min-h-[410px] flex-col items-center justify-center gap-6">
      {canRenderLive2D ? (
        <Live2DCanvas
          entrypoint={live2dEntrypoint}
          motionMap={runtime.motionMap}
          mouthOpen={mouthOpen}
          onError={handleError}
          onReady={handleReady}
          state={state}
        />
      ) : (
        <div
          className={`relative flex size-56 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 ${
            state === "thinking" || state === "speaking" ? "avatar-ring" : ""
          }`}
        >
          <StaticAvatarView
            avatarImageUrl={avatarImageUrl}
            avatarName={avatarName}
            driver={runtime?.fallbackDriver ?? driver}
            mouthOpen={mouthOpen}
            state={state}
            volume={volume}
          />
        </div>
      )}

      <div className="flex h-12 items-end gap-2">
        {[0, 1, 2, 3, 4].map((item) => (
          <span
            key={item}
            className={`w-2 rounded-full bg-slate-900 ${
              state === "speaking" ? "speak-bar" : "h-3 opacity-25"
            }`}
            style={{ animationDelay: `${item * 90}ms` }}
          />
        ))}
      </div>

      <div className="grid w-full grid-cols-3 gap-2 text-center text-xs text-slate-500">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="font-medium text-slate-800">LLM</p>
          <p>服务端流式</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="font-medium text-slate-800">TTS</p>
          <p>事件驱动</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="font-medium text-slate-800">数字人</p>
          <p className="truncate">{statusText}</p>
        </div>
      </div>

      {showDiagnostics && runtime ? (
        <RuntimeDiagnostics renderError={renderError} runtime={runtime} />
      ) : null}

      {showDiagnostics && !runtime && error ? (
        <div className="w-full rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
