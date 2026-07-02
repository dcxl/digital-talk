"use client";

import { useRef } from "react";
import type { RuntimeState } from "../types";

interface UseAudioPlaybackInput {
  setState: React.Dispatch<React.SetStateAction<RuntimeState>>;
}

export function useAudioPlayback({ setState }: UseAudioPlaybackInput) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunkQueueRef = useRef<string[]>([]);
  const isPlayingChunkRef = useRef(false);

  function playNextChunk() {
    const audio = audioRef.current;
    const nextAudioUrl = chunkQueueRef.current.shift();

    if (!audio || !nextAudioUrl) {
      isPlayingChunkRef.current = false;
      setState((current) => (current === "speaking" ? "idle" : current));
      return;
    }

    isPlayingChunkRef.current = true;
    audio.src = nextAudioUrl;
    setState("speaking");
    void audio.play().catch(() => {
      playNextChunk();
    });
  }

  function stopAudio() {
    const audio = audioRef.current;
    chunkQueueRef.current = [];
    isPlayingChunkRef.current = false;
    if (!audio) return;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  async function playAudio(audioUrl: string) {
    const audio = audioRef.current;
    chunkQueueRef.current = [];
    isPlayingChunkRef.current = false;
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

  function queueAudioChunk(audioUrl: string) {
    chunkQueueRef.current.push(audioUrl);
    if (!isPlayingChunkRef.current) playNextChunk();
  }

  function handleAudioEnded() {
    if (isPlayingChunkRef.current) {
      playNextChunk();
      return;
    }

    setState((current) => (current === "speaking" ? "idle" : current));
  }

  return {
    audioRef,
    handleAudioEnded,
    playAudio,
    queueAudioChunk,
    stopAudio,
  };
}
