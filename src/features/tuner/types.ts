export type ThemeMode = "system" | "dark" | "light";

export interface StoredSettings {
  autoDetect: boolean;
  calibration: number;
  leftHanded: boolean;
  noiseSensitivity: number;
  theme: ThemeMode;
  tuneAllMode: boolean;
}

export interface CustomFormState {
  description: string;
  name: string;
  notes: string;
}

export const DEFAULT_SETTINGS: StoredSettings = {
  autoDetect: true,
  calibration: 440,
  leftHanded: false,
  noiseSensitivity: 45,
  theme: "system",
  tuneAllMode: false,
};

export const DEFAULT_CUSTOM_FORM: CustomFormState = {
  description: "",
  name: "",
  notes: "E2 A2 D3 G3 B3 E4",
};
