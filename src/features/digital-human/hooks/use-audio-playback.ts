"use client";

import { useRef } from "react";
import type { RuntimeState } from "../types";

interface UseAudioPlaybackInput {
  setState: React.Dispatch<React.SetStateAction<RuntimeState>>;
}

export function useAudioPlayback({ setState }: UseAudioPlaybackInput) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stopAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  async function playAudio(audioUrl: string) {
    const audio = audioRef.current;
    if (!audio) {
      setState("speaking");
      window.setTimeout(() => setState("idle"), 1200);
      return;
    }

    audio.src = audioUrl;
    setState("speaking");

    try {
      await audio.play();
    } catch {
      setState("idle");
    }
  }

  function handleAudioEnded() {
    setState((current) => (current === "speaking" ? "idle" : current));
  }

  return {
    audioRef,
    handleAudioEnded,
    playAudio,
    stopAudio,
  };
}
