const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface TuningTarget {
  note: string;
  midi: number;
  frequency: number;
}

export interface DetectedNote {
  midi: number;
  note: string;
  cents: number;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export function noteToMidi(note: string) {
  const match = note.trim().match(/^([A-G])([#b]?)(-?\d)$/);

  if (!match) {
    throw new Error(`Invalid note: ${note}`);
  }

  const pitchClass = `${match[1]}${match[2]}`;
  const octave = Number(match[3]);
  const semitone = NOTE_OFFSETS[pitchClass];

  if (semitone === undefined) {
    throw new Error(`Unsupported pitch class: ${pitchClass}`);
  }

  return (octave + 1) * 12 + semitone;
}

export function midiToNote(midi: number) {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  const noteName = NOTE_NAMES[((rounded % 12) + 12) % 12];
  return `${noteName}${octave}`;
}

export function midiToFrequency(midi: number, a4 = 440) {
  return a4 * 2 ** ((midi - 69) / 12);
}

export function frequencyToMidi(frequency: number, a4 = 440) {
  return 69 + 12 * Math.log2(frequency / a4);
}

export function centsBetween(frequency: number, targetFrequency: number) {
  return 1200 * Math.log2(frequency / targetFrequency);
}

export function describeFrequency(frequency: number, a4 = 440): DetectedNote {
  const midi = frequencyToMidi(frequency, a4);
  const roundedMidi = Math.round(midi);
  return {
    midi: roundedMidi,
    note: midiToNote(roundedMidi),
    cents: (midi - roundedMidi) * 100,
  };
}

export function buildTargets(notes: string[], a4 = 440): TuningTarget[] {
  return notes.map((note) => {
    const midi = noteToMidi(note);
    return {
      note,
      midi,
      frequency: midiToFrequency(midi, a4),
    };
  });
}

export function parseTuningNotes(input: string) {
  const notes = input
    .split(/[,\s]+/)
    .map((note) => note.trim())
    .filter(Boolean);

  if (notes.length < 4 || notes.length > 8) {
    throw new Error("Use between 4 and 8 notes");
  }

  notes.forEach((note) => {
    noteToMidi(note);
  });

  return notes;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
