"use client";

import { useEffect, useRef } from "react";
import { startWavRecorder, type WavRecorder } from "../audio/wav-recorder";
import {
  closeRealtimeSession,
  createRealtimeSession,
  interruptRealtimeSession as interruptSession,
  transcribeLegacyAudio,
  transcribeRealtimeAudio,
  type VoiceTranscriptResult,
} from "../realtime-client";
import type { RuntimeState } from "../types";

interface UseVoiceInputInput {
  avatarProfileId?: string | null;
  canSend: boolean;
  conversationId?: string | null;
  knowledgeBaseId?: string | null;
  onBargeIn?: (reason: string) => void;
  onTranscriptFinal?: (result: VoiceTranscriptResult) => void;
  setInput: (input: string) => void;
  setState: React.Dispatch<React.SetStateAction<RuntimeState>>;
  state: RuntimeState;
  stopAudio: () => void;
}

export function useVoiceInput({
  avatarProfileId,
  canSend,
  conversationId,
  knowledgeBaseId,
  onBargeIn,
  onTranscriptFinal,
  setInput,
  setState,
  state,
  stopAudio,
}: UseVoiceInputInput) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeSessionIdRef = useRef<string | null>(null);
  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      void wavRecorderRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (realtimeSessionIdRef.current) {
        void closeRealtimeSession(realtimeSessionIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentSessionId = realtimeSessionIdRef.current;
    realtimeSessionIdRef.current = null;
    if (currentSessionId) void closeRealtimeSession(currentSessionId);
  }, [avatarProfileId, conversationId, knowledgeBaseId]);

  async function getRealtimeSessionId() {
    if (realtimeSessionIdRef.current) return realtimeSessionIdRef.current;

    const sessionId = await createRealtimeSession({
      avatarProfileId,
      conversationId,
      knowledgeBaseId,
    });
    realtimeSessionIdRef.current = sessionId;
    return sessionId;
  }

  async function transcribeAudio(audio: Blob) {
    setState("transcribing");

    try {
      const sessionId = await getRealtimeSessionId();
      const result = await transcribeRealtimeAudio({
        audio,
        language: "zh",
        sessionId,
      });

      setInput(result.text);
      setState("idle");
      if (result.text) onTranscriptFinal?.(result);
    } catch (error) {
      try {
        const result = await transcribeLegacyAudio(audio);
        setInput(result.text);
        setState("idle");
        if (result.text) onTranscriptFinal?.(result);
      } catch {
        setState("error");
        setInput(error instanceof Error ? error.message : "ASR 转写失败");
      }
    }
  }

  async function startListening() {
    if (state === "speaking") {
      if (onBargeIn) {
        onBargeIn("user_barge_in");
      } else {
        stopAudio();
      }
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      (!window.AudioContext && !window.webkitAudioContext)
    ) {
      setState("error");
      return;
    }

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = await startWavRecorder(stream);
      mediaStreamRef.current = stream;
      wavRecorderRef.current = recorder;
      isStoppingRef.current = false;
      setState("listening");
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      wavRecorderRef.current = null;
      setState("error");
    }
  }

  function stopListening() {
    const recorder = wavRecorderRef.current;
    if (!recorder || isStoppingRef.current) return;

    isStoppingRef.current = true;

    void recorder
      .stop()
      .then((audio) => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        wavRecorderRef.current = null;
        isStoppingRef.current = false;

        if (audio.size > 44) {
          void transcribeAudio(audio);
        } else {
          setState("idle");
        }
      })
      .catch(() => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        wavRecorderRef.current = null;
        isStoppingRef.current = false;
        setState("error");
      });
  }

  function toggleListening() {
    if (state === "listening") {
      stopListening();
      return;
    }

    if (canSend) void startListening();
  }

  function interruptRealtimeSession(reason = "user_interrupt") {
    const sessionId = realtimeSessionIdRef.current;
    if (sessionId) void interruptSession(sessionId, reason);
  }

  return {
    interruptRealtimeSession,
    stopListening,
    toggleListening,
  };
}
