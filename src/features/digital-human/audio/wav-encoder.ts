export const DEFAULT_RECORDING_SAMPLE_RATE = 16000;

function mergeFloat32Chunks(chunks: Float32Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export function resampleLinear(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number,
) {
  if (sourceSampleRate === targetSampleRate) return input;
  if (input.length === 0) return input;

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(input.length - 1, lowerIndex + 1);
    const weight = sourceIndex - lowerIndex;
    const lower = input[lowerIndex] ?? 0;
    const upper = input[upperIndex] ?? lower;
    output[index] = lower + (upper - lower) * weight;
  }

  return output;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function encodeWavPcm16(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataByteLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataByteLength, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(
      44 + index * bytesPerSample,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    );
  }

  return buffer;
}

export function createWavBlob(input: {
  chunks: Float32Array[];
  sourceSampleRate: number;
  targetSampleRate?: number;
}) {
  const targetSampleRate =
    input.targetSampleRate ?? DEFAULT_RECORDING_SAMPLE_RATE;
  const merged = mergeFloat32Chunks(input.chunks);
  const samples = resampleLinear(
    merged,
    input.sourceSampleRate,
    targetSampleRate,
  );

  return new Blob([encodeWavPcm16(samples, targetSampleRate)], {
    type: "audio/wav",
  });
}
