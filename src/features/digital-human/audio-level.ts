export function calculateRms(samples: Uint8Array) {
  if (samples.length === 0) return 0;

  let sum = 0;
  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }

  return Math.min(1, Math.sqrt(sum / samples.length));
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mapVolumeToMouthOpen(volume: number) {
  const noiseFloor = 0.015;
  const gain = 3.4;
  const normalized = clamp((volume - noiseFloor) * gain);

  return Math.sqrt(normalized);
}
