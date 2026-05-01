import { describe, expect, it } from "vitest";
import {
  buildTargets,
  centsBetween,
  frequencyToMidi,
  midiToFrequency,
  parseTuningNotes,
  slugify,
} from "./music";

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
});
