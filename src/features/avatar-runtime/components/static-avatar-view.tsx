"use client";

import { Bot, Box, BrainCircuit, Layers3 } from "lucide-react";
import type { RuntimeState } from "@/core/runtime/events";
import type { AvatarRuntimeDriver } from "../types";

interface StaticAvatarViewProps {
  avatarImageUrl?: null | string;
  avatarName?: null | string;
  driver: AvatarRuntimeDriver;
  mouthOpen: number;
  state: RuntimeState;
  volume: number;
}

export function StaticAvatarView({
  avatarImageUrl,
  avatarName,
  driver,
  mouthOpen,
  state,
  volume,
}: StaticAvatarViewProps) {
  const visibleMouthOpen = state === "speaking" ? mouthOpen : 0;
  const mouthHeight = 5 + visibleMouthOpen * 20;
  const mouthWidth = 30 + visibleMouthOpen * 28;
  const volumeGlow = Math.min(0.45, volume * 1.8);
  const driverLabel =
    driver === "live2d" ? "Live2D" : driver === "vrm" ? "VRM" : "静态";
  const PlaceholderIcon = driver === "vrm" ? Box : Layers3;
  const isPlaceholderDriver = driver === "live2d" || driver === "vrm";

  if (avatarImageUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={avatarName ?? "数字人"}
          className="relative z-10 size-44 rounded-full object-cover shadow-2xl"
          src={avatarImageUrl}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-[74px] left-1/2 z-20 rounded-full bg-slate-950 shadow-lg transition-[height,opacity,width] duration-75"
          style={{
            boxShadow: `0 0 ${14 + visibleMouthOpen * 18}px rgba(79, 70, 229, ${volumeGlow})`,
            height: `${mouthHeight}px`,
            opacity: state === "speaking" ? 0.85 : 0,
            transform: "translateX(-50%)",
            width: `${mouthWidth}px`,
          }}
        />
      </>
    );
  }

  if (isPlaceholderDriver) {
    return (
      <div className="relative z-10 flex size-40 flex-col items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl">
        <PlaceholderIcon size={64} />
        <span className="mt-2 text-xs font-medium">{driverLabel}</span>
        <span
          aria-hidden="true"
          className="absolute bottom-10 left-1/2 rounded-full bg-white shadow transition-[height,opacity,width] duration-75"
          style={{
            height: `${mouthHeight}px`,
            opacity: state === "speaking" ? 0.9 : 0,
            transform: "translateX(-50%)",
            width: `${mouthWidth}px`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex size-40 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl">
      {state === "thinking" || state === "streaming" ? (
        <BrainCircuit size={64} />
      ) : (
        <Bot size={72} />
      )}
      <span
        aria-hidden="true"
        className="absolute bottom-10 left-1/2 rounded-full bg-white shadow transition-[height,opacity,width] duration-75"
        style={{
          height: `${mouthHeight}px`,
          opacity: state === "speaking" ? 0.9 : 0,
          transform: "translateX(-50%)",
          width: `${mouthWidth}px`,
        }}
      />
    </div>
  );
}
