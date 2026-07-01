"use client";

import { useEffect, useRef } from "react";
import type { RuntimeState } from "../types";

interface UseVoiceInputInput {
  canSend: boolean;
  setInput: (input: string) => void;
  setState: React.Dispatch<React.SetStateAction<RuntimeState>>;
  state: RuntimeState;
  stopAudio: () => void;
}

export function useVoiceInput({
  canSend,
  setInput,
  setState,
  state,
  stopAudio,
}: UseVoiceInputInput) {
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function transcribeAudio(audio: Blob) {
    setState("transcribing");

    try {
      const formData = new FormData();
      formData.append("audio", audio, "recording.webm");
      formData.append("language", "zh");

      const response = await fetch("/api/asr", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          text?: string;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setInput(payload.data?.text ?? "");
      setState("idle");
    } catch (error) {
      setState("error");
      setInput(error instanceof Error ? error.message : "ASR 转写失败");
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

  return {
    stopListening,
    toggleListening,
  };
}
