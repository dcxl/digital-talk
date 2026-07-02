"use client";

import {
  createWavBlob,
  DEFAULT_RECORDING_SAMPLE_RATE,
} from "./wav-encoder";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface WavRecorder {
  close: () => Promise<void>;
  stop: () => Promise<Blob>;
}

function getAudioContextConstructor() {
  return window.AudioContext ?? window.webkitAudioContext;
}

export async function startWavRecorder(
  stream: MediaStream,
  targetSampleRate = DEFAULT_RECORDING_SAMPLE_RATE,
): Promise<WavRecorder> {
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) {
    throw new Error("当前浏览器不支持 AudioContext 录音");
  }

  const audioContext = new AudioContextConstructor();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const sink = audioContext.createGain();
  const chunks: Float32Array[] = [];
  let closed = false;
  let stopped = false;

  sink.gain.value = 0;
  processor.onaudioprocess = (event) => {
    if (stopped) return;
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(sink);
  sink.connect(audioContext.destination);

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  async function close() {
    if (closed) return;
    closed = true;
    stopped = true;
    processor.disconnect();
    source.disconnect();
    sink.disconnect();
    if (audioContext.state !== "closed") {
      await audioContext.close().catch(() => undefined);
    }
  }

  return {
    close,
    async stop() {
      await close();

      return createWavBlob({
        chunks,
        sourceSampleRate: audioContext.sampleRate,
        targetSampleRate,
      });
    },
  };
}
