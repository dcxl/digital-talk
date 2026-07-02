"use client";

import { useEffect, useRef } from "react";
import {
  closeRealtimeSession,
  createRealtimeSession,
  interruptRealtimeSession as interruptSession,
  transcribeLegacyAudio,
  transcribeRealtimeAudio,
} from "../realtime-client";
import type { RuntimeState } from "../types";

interface UseVoiceInputInput {
  avatarProfileId?: string | null;
  canSend: boolean;
  conversationId?: string | null;
  knowledgeBaseId?: string | null;
  onTranscriptFinal?: (text: string) => void;
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
  onTranscriptFinal,
  setInput,
  setState,
  state,
  stopAudio,
}: UseVoiceInputInput) {
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const realtimeSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
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
      const text = await transcribeRealtimeAudio({
        audio,
        language: "zh",
        sessionId,
      });

      setInput(text);
      setState("idle");
      if (text) onTranscriptFinal?.(text);
    } catch (error) {
      try {
        const text = await transcribeLegacyAudio(audio);
        setInput(text);
        setState("idle");
        if (text) onTranscriptFinal?.(text);
      } catch {
        setState("error");
        setInput(error instanceof Error ? error.message : "ASR 转写失败");
      }
    }
  }

  async function startListening() {
    if (state === "speaking") stopAudio();

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        const audio = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];

        if (audio.size > 0) {
          void transcribeAudio(audio);
        } else {
          setState("idle");
        }
      };

      recorder.start();
      setState("listening");
    } catch {
      setState("error");
    }
  }

  function stopListening() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.stop();
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
