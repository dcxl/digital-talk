"use client";

import type { CSSProperties } from "react";
import { Bot, BrainCircuit } from "lucide-react";
import type { AvatarMotionViewModel } from "@/core/avatar-runtime/motion-runtime";
import type { RuntimeState } from "@/core/runtime/events";
import type { AvatarRuntimeDriver } from "../types";

interface StaticAvatarViewProps {
  avatarImageUrl?: null | string;
  avatarName?: null | string;
  driver: AvatarRuntimeDriver;
  motion: AvatarMotionViewModel;
  mouthOpen: number;
  state: RuntimeState;
  volume: number;
}

export function StaticAvatarView({
  avatarImageUrl,
  avatarName,
  motion,
  mouthOpen,
  state,
  volume,
}: StaticAvatarViewProps) {
  const visibleMouthOpen = motion.isSpeaking ? mouthOpen : 0;
  const mouthHeight = 6 + visibleMouthOpen * 24;
  const mouthWidth = 28 + visibleMouthOpen * 34;
  const volumeGlow = Math.min(0.58, volume * 1.8 + motion.intensity * 0.18);
  const motionStyle = motion.cssVars as CSSProperties;

  if (avatarImageUrl) {
    return (
      <div
        className={`avatar-motion-root ${motion.animationClass} relative z-10 flex size-44 items-center justify-center`}
        style={motionStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={avatarName ?? "AI 角色"}
          className="relative z-10 size-44 rounded-full object-cover shadow-2xl"
          src={avatarImageUrl}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-9 left-1/2 z-20 rounded-full bg-slate-950 shadow-lg transition-[height,opacity,width] duration-75"
          style={{
            boxShadow: `0 0 ${14 + visibleMouthOpen * 18}px rgba(79, 70, 229, ${volumeGlow})`,
            height: `${mouthHeight}px`,
            opacity: motion.isSpeaking ? 0.86 : 0,
            transform: "translateX(-50%)",
            width: `${mouthWidth}px`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar-motion-root ${motion.animationClass} relative z-10 flex size-40 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl`}
      style={motionStyle}
    >
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
          opacity: motion.isSpeaking ? 0.9 : 0,
          transform: "translateX(-50%)",
          width: `${mouthWidth}px`,
        }}
      />
    </div>
  );
}
