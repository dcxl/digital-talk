import { useEffect, useRef, useState, type RefObject } from "react";
import { calculateRms, mapVolumeToMouthOpen } from "../audio-level";

interface AudioAnalysisState {
  isAnalysing: boolean;
  mouthOpen: number;
  volume: number;
}

const idleAnalysis: AudioAnalysisState = {
  isAnalysing: false,
  mouthOpen: 0,
  volume: 0,
};

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;

  return window.AudioContext ?? null;
}

export function useAudioAnalyser(
  audioRef: RefObject<HTMLAudioElement | null>,
  enabled: boolean,
) {
  const [analysis, setAnalysis] = useState<AudioAnalysisState>(idleAnalysis);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    let cancelled = false;

    function stopAnalysis() {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      window.requestAnimationFrame(() => {
        if (!cancelled) setAnalysis(idleAnalysis);
      });
    }

    function analyseFrame() {
      if (cancelled || !analyserRef.current || !dataRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataRef.current);
      const volume = calculateRms(dataRef.current);
      const mouthOpen = mapVolumeToMouthOpen(volume);
      const now = performance.now();

      if (now - lastUpdateRef.current > 48) {
        lastUpdateRef.current = now;
        setAnalysis({
          isAnalysing: true,
          mouthOpen,
          volume,
        });
      }

      frameRef.current = window.requestAnimationFrame(analyseFrame);
    }

    async function startAnalysis() {
      const audio = audioRef.current;
      const AudioContextCtor = getAudioContextConstructor();
      if (!enabled || !audio || !AudioContextCtor) {
        stopAnalysis();
        return;
      }

      const audioContext =
        audioContextRef.current ?? new AudioContextCtor({ latencyHint: "playback" });
      audioContextRef.current = audioContext;

      const analyser = analyserRef.current ?? audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.72;
      analyserRef.current = analyser;
      dataRef.current =
        dataRef.current ?? new Uint8Array(new ArrayBuffer(analyser.fftSize));

      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audio);
        sourceRef.current.connect(analyser);
        analyser.connect(audioContext.destination);
      }

      await audioContext.resume().catch(() => undefined);
      if (!cancelled) analyseFrame();
    }

    void Promise.resolve().then(startAnalysis);

    return () => {
      cancelled = true;
      stopAnalysis();
    };
  }, [audioRef, enabled]);

  return analysis;
}
