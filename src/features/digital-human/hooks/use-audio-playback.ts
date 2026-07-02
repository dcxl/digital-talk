"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import type { MouthSyncMark } from "../mouth-sync/types";
import type { RuntimeState } from "../types";

interface UseAudioPlaybackInput {
  onMouthSyncStart?: (input: {
    durationMs?: number;
    marks?: MouthSyncMark[];
  }) => void;
  onMouthSyncStop?: () => void;
  setState: Dispatch<SetStateAction<RuntimeState>>;
}

interface AudioPlaybackInput {
  audioUrl: string;
  durationMs?: number;
  marks?: MouthSyncMark[];
}

export function useAudioPlayback({
  onMouthSyncStart,
  onMouthSyncStop,
  setState,
}: UseAudioPlaybackInput) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunkQueueRef = useRef<AudioPlaybackInput[]>([]);
  const isPlayingChunkRef = useRef(false);

  function playNextChunk() {
    const audio = audioRef.current;
    const nextAudio = chunkQueueRef.current.shift();

    if (!audio || !nextAudio) {
      isPlayingChunkRef.current = false;
      onMouthSyncStop?.();
      setState((current) => (current === "speaking" ? "idle" : current));
      return;
    }

    isPlayingChunkRef.current = true;
    audio.src = nextAudio.audioUrl;
    onMouthSyncStart?.({
      durationMs: nextAudio.durationMs,
      marks: nextAudio.marks,
    });
    setState("speaking");
    void audio.play().catch(() => {
      playNextChunk();
    });
  }

  function stopAudio() {
    const audio = audioRef.current;
    chunkQueueRef.current = [];
    isPlayingChunkRef.current = false;
    onMouthSyncStop?.();
    if (!audio) return;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  async function playAudio(
    audioUrl: string,
    options: Omit<AudioPlaybackInput, "audioUrl"> = {},
  ) {
    const audio = audioRef.current;
    chunkQueueRef.current = [];
    isPlayingChunkRef.current = false;
    if (!audio) {
      setState("speaking");
      window.setTimeout(() => setState("idle"), 1200);
      return;
    }

    audio.src = audioUrl;
    onMouthSyncStart?.(options);
    setState("speaking");

    try {
      await audio.play();
    } catch {
      onMouthSyncStop?.();
      setState("idle");
    }
  }

  function queueAudioChunk(input: AudioPlaybackInput) {
    chunkQueueRef.current.push(input);
    if (!isPlayingChunkRef.current) playNextChunk();
  }

  function handleAudioEnded() {
    if (isPlayingChunkRef.current) {
      playNextChunk();
      return;
    }

    onMouthSyncStop?.();
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
