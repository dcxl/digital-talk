import { describe, expect, it } from "vitest";
import {
  createWavBlob,
  encodeWavPcm16,
  resampleLinear,
} from "./wav-encoder";

function readAscii(view: DataView, offset: number, length: number) {
  return String.fromCharCode(
    ...Array.from({ length }, (_, index) => view.getUint8(offset + index)),
  );
}

describe("wav encoder", () => {
  it("encodes mono pcm16 wav headers", async () => {
    const buffer = encodeWavPcm16(new Float32Array([0, 0.5, -0.5, 1]), 16000);
    const view = new DataView(buffer);

    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(readAscii(view, 8, 4)).toBe("WAVE");
    expect(readAscii(view, 12, 4)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(readAscii(view, 36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(8);
  });

  it("resamples browser audio to the ASR sample rate", () => {
    const input = new Float32Array(48000).fill(0.25);
    const output = resampleLinear(input, 48000, 16000);

    expect(output.length).toBe(16000);
    expect(output[0]).toBeCloseTo(0.25);
  });

  it("creates an audio wav blob", async () => {
    const blob = createWavBlob({
      chunks: [new Float32Array([0, 0.25]), new Float32Array([-0.25])],
      sourceSampleRate: 16000,
    });
    const view = new DataView(await blob.arrayBuffer());

    expect(blob.type).toBe("audio/wav");
    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(16000);
  });
});
