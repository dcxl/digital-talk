import { Bot, BrainCircuit } from "lucide-react";
import { stateLabel, stateTone } from "../constants";
import type { RuntimeState } from "../types";

interface AvatarStageProps {
  latestStatus: string;
  state: RuntimeState;
}

export function AvatarStage({ latestStatus, state }: AvatarStageProps) {
  return (
    <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Avatar Stage</h2>
          <p className="mt-1 text-xs text-slate-500">{latestStatus}</p>
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
          <div className="relative z-10 flex size-40 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl">
            {state === "thinking" || state === "streaming" ? (
              <BrainCircuit size={64} />
            ) : (
              <Bot size={72} />
            )}
          </div>
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
