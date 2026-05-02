import { describe, expect, it } from "vitest";
import {
  buildTargets,
  centsBetween,
  frequencyToMidi,
  midiToFrequency,
  parseTuningNotes,
  slugify,
} from "@/features/tuner/lib/music";
import { detectPitch } from "@/features/tuner/hooks/use-tuner";

describe("music helpers", () => {
  it("round-trips midi and frequency around concert A", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
    expect(frequencyToMidi(440)).toBeCloseTo(69, 5);
  });

  it("builds tuning targets from note names", () => {
    const targets = buildTargets(["E2", "A2", "D3"]);

    expect(targets.map((target) => target.note)).toEqual(["E2", "A2", "D3"]);
    expect(targets[0]?.frequency).toBeCloseTo(82.41, 1);
    expect(targets[1]?.midi).toBe(45);
  });

  it("parses and validates custom tuning notes", () => {
    expect(parseTuningNotes("D2 A2 D3 F#3 A3 D4")).toEqual(["D2", "A2", "D3", "F#3", "A3", "D4"]);
    expect(() => parseTuningNotes("H2 A2 D3 G3")).toThrow(/Invalid note/);
  });

  it("measures cents offset between nearby pitches", () => {
    const target = midiToFrequency(40);
    const sharp = target * 2 ** (12 / 1200);

    expect(centsBetween(sharp, target)).toBeCloseTo(12, 3);
  });

  it("slugifies user-defined tuning names", () => {
    expect(slugify(" Sunday Slide / Open D ")).toBe("sunday-slide-open-d");
  });

  it("detects a low guitar string frequency from a clean waveform", () => {
    const sampleRate = 48_000;
    const frequency = 82.41;
    const size = 8192;
    const buffer = new Float32Array(size);

    for (let index = 0; index < size; index += 1) {
      buffer[index] =
        Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.7 +
        Math.sin((4 * Math.PI * frequency * index) / sampleRate) * 0.18;
    }

    const detected = detectPitch(buffer, sampleRate);

    expect(detected).not.toBeNull();
    expect(detected?.frequency).toBeCloseTo(frequency, 0);
    expect(detected?.clarity ?? 0).toBeGreaterThan(0.4);
  });
});
