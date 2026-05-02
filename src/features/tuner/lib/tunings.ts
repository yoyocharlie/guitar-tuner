export interface TuningDefinition {
  id: string;
  name: string;
  category: string;
  instrumentFamily: string;
  description: string;
  notes: string[];
  aliases?: string[];
  source: "preset" | "custom";
}

export const presetTunings: TuningDefinition[] = [
  {
    id: "standard",
    name: "Standard",
    category: "Everyday",
    instrumentFamily: "6-string guitar",
    description: "Classic EADGBE.",
    notes: ["E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset",
  },
  {
    id: "half-step-down",
    name: "Half Step Down",
    category: "Everyday",
    instrumentFamily: "6-string guitar",
    description: "Eb tuning for a darker voice.",
    notes: ["D#2", "G#2", "C#3", "F#3", "A#3", "D#4"],
    aliases: ["Eb Standard"],
    source: "preset",
  },
  {
    id: "drop-d",
    name: "Drop D",
    category: "Drop",
    instrumentFamily: "6-string guitar",
    description: "Heavy low end, minimal change.",
    notes: ["D2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset",
  },
  {
    id: "double-drop-d",
    name: "Double Drop D",
    category: "Drop",
    instrumentFamily: "6-string guitar",
    description: "Open low and high D strings.",
    notes: ["D2", "A2", "D3", "G3", "B3", "D4"],
    source: "preset",
  },
  {
    id: "drop-c",
    name: "Drop C",
    category: "Drop",
    instrumentFamily: "6-string guitar",
    description: "Low and aggressive metal setup.",
    notes: ["C2", "G2", "C3", "F3", "A3", "D4"],
    source: "preset",
  },
  {
    id: "dadgad",
    name: "DADGAD",
    category: "Modal",
    instrumentFamily: "6-string guitar",
    description: "Wide open folk and ambient tuning.",
    notes: ["D2", "A2", "D3", "G3", "A3", "D4"],
    source: "preset",
  },
  {
    id: "open-g",
    name: "Open G",
    category: "Open",
    instrumentFamily: "6-string guitar",
    description: "Instant slide guitar chord.",
    notes: ["D2", "G2", "D3", "G3", "B3", "D4"],
    source: "preset",
  },
  {
    id: "open-d",
    name: "Open D",
    category: "Open",
    instrumentFamily: "6-string guitar",
    description: "Full major chord with huge sustain.",
    notes: ["D2", "A2", "D3", "F#3", "A3", "D4"],
    source: "preset",
  },
  {
    id: "open-e",
    name: "Open E",
    category: "Open",
    instrumentFamily: "6-string guitar",
    description: "Bright slide tuning.",
    notes: ["E2", "B2", "E3", "G#3", "B3", "E4"],
    source: "preset",
  },
  {
    id: "c6",
    name: "C6",
    category: "Open",
    instrumentFamily: "6-string guitar",
    description: "Warm, jazzy lap steel color.",
    notes: ["C2", "A2", "C3", "G3", "A3", "E4"],
    source: "preset",
  },
  {
    id: "seven-standard",
    name: "7-String Standard",
    category: "Extended",
    instrumentFamily: "7-string guitar",
    description: "Standard 7-string tuning.",
    notes: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset",
  },
  {
    id: "seven-drop-a",
    name: "7-String Drop A",
    category: "Extended",
    instrumentFamily: "7-string guitar",
    description: "Heavy extended-range drop tuning.",
    notes: ["A1", "E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset",
  },
  {
    id: "bass-standard",
    name: "Bass Standard",
    category: "Bass",
    instrumentFamily: "4-string bass",
    description: "EADG for bass players.",
    notes: ["E1", "A1", "D2", "G2"],
    source: "preset",
  },
  {
    id: "bass-drop-d",
    name: "Bass Drop D",
    category: "Bass",
    instrumentFamily: "4-string bass",
    description: "Bass tuning with a low D.",
    notes: ["D1", "A1", "D2", "G2"],
    source: "preset",
  },
];

export const defaultTuningId = "standard";
