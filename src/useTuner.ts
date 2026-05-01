import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  average,
  buildTargets,
  centsBetween,
  clamp,
  describeFrequency,
  frequencyToMidi,
  median,
} from "./music";
import type { TuningDefinition } from "./tunings";

export type MicState = "idle" | "requesting" | "listening" | "denied" | "unsupported" | "error";

export interface TunerSnapshot {
  frequency: number | null;
  note: string | null;
  cents: number | null;
  clarity: number;
  volume: number;
  targetIndex: number | null;
  targetNote: string | null;
  targetFrequency: number | null;
  locked: boolean;
  tooNoisy: boolean;
  history: number[];
  statusText: string;
}

interface PitchFrame {
  frequency: number;
  clarity: number;
}

interface DetectedPitch {
  frequency: number;
  clarity: number;
}

interface UseTunerOptions {
  tuning: TuningDefinition;
  calibration: number;
  autoDetect: boolean;
  selectedStringIndex: number | null;
  noiseSensitivity: number;
  onStringLocked?: (index: number) => void;
}

const INITIAL_SNAPSHOT: TunerSnapshot = {
  frequency: null,
  note: null,
  cents: null,
  clarity: 0,
  volume: 0,
  targetIndex: null,
  targetNote: null,
  targetFrequency: null,
  locked: false,
  tooNoisy: false,
  history: [],
  statusText: "Pluck one string",
};

export function useTuner(options: UseTunerOptions) {
  const [enabled, setEnabled] = useState(false);
  const [micState, setMicState] = useState<MicState>("idle");
  const [snapshot, setSnapshot] = useState<TunerSnapshot>(INITIAL_SNAPSHOT);
  const lockHandler = useEffectEvent(options.onStringLocked ?? (() => undefined));
  const lockRef = useRef<number | null>(null);

  const targets = useMemo(
    () => buildTargets(options.tuning.notes, options.calibration),
    [options.calibration, options.tuning.notes],
  );

  useEffect(() => {
    setSnapshot(INITIAL_SNAPSHOT);
    lockRef.current = null;
  }, [options.autoDetect, options.selectedStringIndex, options.tuning.id, targets]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("unsupported");
      return undefined;
    }

    let analyser: AnalyserNode | null = null;
    let audioContext: AudioContext | null = null;
    let animationFrame = 0;
    let disposed = false;
    let stream: MediaStream | null = null;

    const timeDomain = new Float32Array(4096);
    const pitchFrames: PitchFrame[] = [];
    const targetFrames: number[] = [];
    const centsFrames: number[] = [];
    const history: number[] = [];

    const minClarity = 0.62 + options.noiseSensitivity * 0.0023;
    const minVolume = 0.008 + options.noiseSensitivity * 0.00008;

    const tick = () => {
      if (disposed || !analyser || !audioContext) {
        return;
      }

      analyser.getFloatTimeDomainData(timeDomain);
      const volume = getVolume(timeDomain);
      const detection =
        volume >= minVolume ? detectPitch(timeDomain, audioContext.sampleRate) : null;

      if (detection) {
        pitchFrames.push(detection);
        if (pitchFrames.length > 6) {
          pitchFrames.shift();
        }
      } else if (pitchFrames.length > 0) {
        pitchFrames.shift();
      }

      const smoothedFrequency =
        pitchFrames.length > 0 ? median(pitchFrames.map((frame) => frame.frequency)) : null;
      const clarity =
        pitchFrames.length > 0 ? average(pitchFrames.map((frame) => frame.clarity)) : 0;

      let targetIndex = options.selectedStringIndex;

      if (smoothedFrequency !== null && (options.autoDetect || targetIndex === null)) {
        const closestIndex = getClosestTargetIndex(smoothedFrequency, targets);

        if (closestIndex !== null) {
          targetFrames.push(closestIndex);
          if (targetFrames.length > 5) {
            targetFrames.shift();
          }
          targetIndex = getStableTarget(targetFrames);
        } else {
          targetFrames.length = 0;
          targetIndex = null;
        }
      }

      const target = targetIndex === null ? null : targets[targetIndex];
      const note =
        smoothedFrequency === null
          ? null
          : describeFrequency(smoothedFrequency, options.calibration);
      const cents =
        smoothedFrequency !== null && target
          ? centsBetween(smoothedFrequency, target.frequency)
          : (note?.cents ?? null);

      if (cents !== null) {
        centsFrames.push(cents);
        if (centsFrames.length > 6) {
          centsFrames.shift();
        }

        history.push(clamp(cents, -50, 50));
        if (history.length > 40) {
          history.shift();
        }
      } else if (history.length > 0) {
        history.shift();
      }

      const stableCents =
        centsFrames.length >= 4 &&
        Math.max(...centsFrames.map(Math.abs)) - Math.min(...centsFrames.map(Math.abs)) < 7;
      const locked = Boolean(
        target && cents !== null && Math.abs(cents) <= 5 && clarity >= minClarity && stableCents,
      );

      if (locked && targetIndex !== null && lockRef.current !== targetIndex) {
        lockRef.current = targetIndex;
        lockHandler(targetIndex);
      } else if (!locked) {
        lockRef.current = null;
      }

      const statusText = getStatusText({
        autoDetect: options.autoDetect,
        clarity,
        cents,
        locked,
        note: note?.note ?? null,
        targetNote: target?.note ?? null,
        tooNoisy: volume >= minVolume && detection === null,
      });

      setSnapshot({
        frequency: smoothedFrequency,
        note: note?.note ?? null,
        cents,
        clarity,
        volume,
        targetIndex,
        targetNote: target?.note ?? null,
        targetFrequency: target?.frequency ?? null,
        locked,
        tooNoisy: volume >= minVolume && detection === null,
        history: [...history],
        statusText,
      });

      animationFrame = window.requestAnimationFrame(tick);
    };

    const start = async () => {
      try {
        setMicState("requesting");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
          },
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        audioContext = new AudioContext();
        await audioContext.resume();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = timeDomain.length;
        analyser.smoothingTimeConstant = 0.1;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        setMicState("listening");
        tick();
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "UnknownError";
        setMicState(name === "NotAllowedError" ? "denied" : "error");
        setEnabled(false);
      }
    };

    start().catch(() => {
      setMicState("error");
      setEnabled(false);
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      audioContext?.close().catch(() => undefined);
    };
  }, [
    enabled,
    lockHandler,
    options.autoDetect,
    options.calibration,
    options.noiseSensitivity,
    options.selectedStringIndex,
    targets,
  ]);

  const enableMic = () => {
    setEnabled(true);
  };

  const disableMic = () => {
    setEnabled(false);
    setMicState("idle");
    setSnapshot(INITIAL_SNAPSHOT);
  };

  return {
    enableMic,
    disableMic,
    enabled,
    micState,
    snapshot,
    targets,
  };
}

function getVolume(buffer: Float32Array) {
  let sum = 0;

  for (const sample of buffer) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / buffer.length);
}

function detectPitch(buffer: Float32Array, sampleRate: number): DetectedPitch | null {
  const size = buffer.length;
  const difference = new Float32Array(size);

  for (let tau = 1; tau < size; tau += 1) {
    let sum = 0;
    for (let index = 0; index < size - tau; index += 1) {
      const delta = buffer[index] - buffer[index + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  let runningTotal = 0;
  let bestTau = -1;
  let bestScore = 1;

  for (let tau = 2; tau < size; tau += 1) {
    runningTotal += difference[tau];
    if (runningTotal === 0) {
      continue;
    }

    const normalized = (difference[tau] * tau) / runningTotal;
    if (normalized < bestScore) {
      bestScore = normalized;
      bestTau = tau;
    }
  }

  if (bestTau <= 0) {
    return null;
  }

  const frequency = sampleRate / bestTau;

  if (frequency < 30 || frequency > 1200) {
    return null;
  }

  const clarity = clamp(1 - bestScore, 0, 1);

  if (clarity < 0.45) {
    return null;
  }

  return { frequency, clarity };
}

function getClosestTargetIndex(frequency: number, targets: Array<{ midi: number }>) {
  const midi = frequencyToMidi(frequency);
  let bestIndex: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  targets.forEach((target, index) => {
    const distance = Math.abs(target.midi - midi);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestDistance <= 1.75 ? bestIndex : null;
}

function getStableTarget(targetFrames: number[]) {
  const counts = new Map<number, number>();

  for (const targetIndex of targetFrames) {
    counts.set(targetIndex, (counts.get(targetIndex) ?? 0) + 1);
  }

  let winner: number | null = null;
  let winnerCount = 0;

  counts.forEach((count, targetIndex) => {
    if (count > winnerCount) {
      winner = targetIndex;
      winnerCount = count;
    }
  });

  return winnerCount >= 3 ? winner : (targetFrames.at(-1) ?? null);
}

function getStatusText(input: {
  autoDetect: boolean;
  clarity: number;
  cents: number | null;
  locked: boolean;
  note: string | null;
  targetNote: string | null;
  tooNoisy: boolean;
}) {
  if (!input.note) {
    return "Pluck one string";
  }

  if (input.tooNoisy) {
    return "Too noisy. Mute other strings and pluck once.";
  }

  if (input.locked && input.targetNote) {
    return `${input.targetNote} locked in`;
  }

  if (input.cents === null) {
    return input.autoDetect
      ? `Hearing ${input.note}`
      : `Listening for ${input.targetNote ?? input.note}`;
  }

  const direction = input.cents < 0 ? "flat" : "sharp";
  return `${Math.round(Math.abs(input.cents))} cents ${direction}`;
}
