import { AvatarRuntimeStage } from "@/features/avatar-runtime/components/avatar-runtime-stage";
import { stateLabel, stateTone } from "../constants";
import type { RuntimeState } from "../types";

interface AvatarStageProps {
  avatarId?: string | null;
  driver?: "live2d" | "static" | "vrm";
  avatarImageUrl?: string | null;
  avatarName?: string | null;
  mouthOpen?: number;
  latestStatus: string;
  state: RuntimeState;
  volume?: number;
}

export function AvatarStage({
  avatarId,
  driver = "static",
  avatarImageUrl,
  avatarName,
  mouthOpen = 0,
  latestStatus,
  state,
  volume = 0,
}: AvatarStageProps) {
  const driverLabel = driver === "static" ? "静态" : "静态兼容";

  return (
    <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">角色舞台</h2>
          <p className="mt-1 text-xs text-slate-500">
            {avatarName
              ? `${avatarName} · ${driverLabel} · ${latestStatus}`
              : `${driverLabel} · ${latestStatus}`}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${stateTone[state]}`}
        >
          {stateLabel[state]}
        </span>
      </div>

      <AvatarRuntimeStage
        avatarId={avatarId}
        avatarImageUrl={avatarImageUrl}
        avatarName={avatarName}
        driver={driver}
        mouthOpen={mouthOpen}
        state={state}
        volume={volume}
      />
    </section>
  );
}
