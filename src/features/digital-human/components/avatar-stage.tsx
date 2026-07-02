import { Bot, BrainCircuit } from "lucide-react";
import { stateLabel, stateTone } from "../constants";
import type { RuntimeState } from "../types";

interface AvatarStageProps {
  avatarImageUrl?: string | null;
  avatarName?: string | null;
  mouthOpen?: number;
  latestStatus: string;
  state: RuntimeState;
  volume?: number;
}

export function AvatarStage({
  avatarImageUrl,
  avatarName,
  mouthOpen = 0,
  latestStatus,
  state,
  volume = 0,
}: AvatarStageProps) {
  const visibleMouthOpen = state === "speaking" ? mouthOpen : 0;
  const mouthHeight = 5 + visibleMouthOpen * 20;
  const mouthWidth = 30 + visibleMouthOpen * 28;
  const volumeGlow = Math.min(0.45, volume * 1.8);

  return (
    <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Avatar Stage</h2>
          <p className="mt-1 text-xs text-slate-500">
            {avatarName ? `${avatarName} · ${latestStatus}` : latestStatus}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${stateTone[state]}`}
        >
          {stateLabel[state]}
        </span>
      </div>

      <div className="flex min-h-[410px] flex-col items-center justify-center gap-6">
        <div
          className={`relative flex size-56 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 ${
            state === "thinking" || state === "speaking" ? "avatar-ring" : ""
          }`}
        >
          {avatarImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={avatarName ?? "Avatar"}
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
          ) : (
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
          )}
        </div>

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
            <p>server stream</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="font-medium text-slate-800">TTS</p>
            <p>event mock</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="font-medium text-slate-800">Avatar</p>
            <p>static</p>
          </div>
        </div>
      </div>
    </section>
  );
}
