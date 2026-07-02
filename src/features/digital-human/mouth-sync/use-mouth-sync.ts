"use client";

import { useEffect, useState, type RefObject } from "react";
import type { RuntimeState } from "../types";
import { useAudioAnalyser } from "../hooks/use-audio-analyser";
import { getMouthOpenAt } from "./timeline";
import type { MouthSyncState, MouthSyncTimeline } from "./types";

const idleMouthSync: MouthSyncState = {
  mouthOpen: 0,
  source: "none",
  volume: 0,
};

interface MarkMouthOpenState {
  mouthOpen: number;
  timelineStartedAtMs: number | null;
}

export function useMouthSync(input: {
  audioRef: RefObject<HTMLAudioElement | null>;
  state: RuntimeState;
  timeline: MouthSyncTimeline | null;
}) {
  const audioAnalysis = useAudioAnalyser(
    input.audioRef,
    input.state === "speaking",
  );
  const [markMouthOpen, setMarkMouthOpen] = useState<MarkMouthOpenState>({
    mouthOpen: 0,
    timelineStartedAtMs: null,
  });
  const hasTimeline = input.state === "speaking" && Boolean(input.timeline);

  useEffect(() => {
    if (!input.timeline || input.state !== "speaking") {
      return;
    }

    let cancelled = false;
    let frameId: number | null = null;

    function tick() {
      if (cancelled || !input.timeline) return;

      setMarkMouthOpen({
        mouthOpen: getMouthOpenAt({
          nowMs: performance.now(),
          timeline: input.timeline,
        }),
        timelineStartedAtMs: input.timeline.startedAtMs,
      });
      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [input.state, input.timeline]);

  if (hasTimeline) {
    return {
      mouthOpen:
        markMouthOpen.timelineStartedAtMs === input.timeline?.startedAtMs
          ? markMouthOpen.mouthOpen
          : 0,
      source: "speech-mark",
      volume: audioAnalysis.volume,
    } satisfies MouthSyncState;
  }

  if (input.state === "speaking") {
    return {
      mouthOpen: audioAnalysis.mouthOpen,
      source: "audio-volume",
      volume: audioAnalysis.volume,
    } satisfies MouthSyncState;
  }

  return idleMouthSync;
}
