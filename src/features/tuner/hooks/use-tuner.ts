import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  average,
  buildTargets,
  centsBetween,
  clamp,
  describeFrequency,
  frequencyToMidi,
  median,
} from "@/features/tuner/lib/music";
import type { TuningDefinition } from "@/features/tuner/lib/tunings";

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
  const runtimeRef = useRef({
    autoDetect: options.autoDetect,
    calibration: options.calibration,
    noiseSensitivity: options.noiseSensitivity,
    resetToken: "",
    selectedStringIndex: options.selectedStringIndex,
    targets,
  });

  useEffect(() => {
    runtimeRef.current = {
      autoDetect: options.autoDetect,
      calibration: options.calibration,
      noiseSensitivity: options.noiseSensitivity,
      resetToken: [
        options.tuning.id,
        options.calibration,
        options.autoDetect,
        options.selectedStringIndex ?? "auto",
        targets.map((target) => target.note).join(","),
      ].join("::"),
      selectedStringIndex: options.selectedStringIndex,
      targets,
    };
  }, [
    options.autoDetect,
    options.calibration,
    options.noiseSensitivity,
    options.selectedStringIndex,
    options.tuning.id,
    targets,
  ]);

  useEffect(() => {
    setSnapshot(INITIAL_SNAPSHOT);
    lockRef.current = null;
  }, [
    options.autoDetect,
    options.calibration,
    options.selectedStringIndex,
    options.tuning.id,
    targets,
  ]);

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

    const timeDomain = new Float32Array(8192);
    const pitchFrames: PitchFrame[] = [];
    const targetFrames: number[] = [];
    const centsFrames: number[] = [];
    const history: number[] = [];
    let lastResetToken = runtimeRef.current.resetToken;

    const tick = () => {
      if (disposed || !analyser || !audioContext) {
        return;
      }

      const runtime = runtimeRef.current;

      if (runtime.resetToken !== lastResetToken) {
        pitchFrames.length = 0;
        targetFrames.length = 0;
        centsFrames.length = 0;
        history.length = 0;
        lockRef.current = null;
        lastResetToken = runtime.resetToken;
      }

      const noiseRatio = runtime.noiseSensitivity / 100;
      const minClarity = 0.3 + noiseRatio * 0.18;
      const minVolume = 0.0012 + noiseRatio * 0.0028;

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

      let targetIndex = runtime.selectedStringIndex;

      if (smoothedFrequency !== null && (runtime.autoDetect || targetIndex === null)) {
        const closestIndex = getClosestTargetIndex(smoothedFrequency, runtime.targets);

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

      const target = targetIndex === null ? null : runtime.targets[targetIndex];
      const note =
        smoothedFrequency === null
          ? null
          : describeFrequency(smoothedFrequency, runtime.calibration);
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
        autoDetect: runtime.autoDetect,
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
            // Let the browser lift weak built-in mic input before our pitch gate runs.
            autoGainControl: true,
            // Built-in device processing helps weak mobile/laptop mics more than it hurts.
            echoCancellation: true,
            noiseSuppression: true,
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
  }, [enabled]);

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

export function detectPitch(buffer: Float32Array, sampleRate: number): DetectedPitch | null {
  const size = buffer.length;
  const difference = new Float32Array(size);
  const cumulativeMean = new Float32Array(size);

  for (let tau = 1; tau < size; tau += 1) {
    let sum = 0;
    for (let index = 0; index < size - tau; index += 1) {
      const delta = buffer[index] - buffer[index + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  cumulativeMean[0] = 1;
  let runningTotal = 0;
  for (let tau = 1; tau < size; tau += 1) {
    runningTotal += difference[tau];
    cumulativeMean[tau] = runningTotal === 0 ? 1 : (difference[tau] * tau) / runningTotal;
  }

  const absoluteThreshold = 0.18;
  let bestTau = -1;

  for (let tau = 2; tau < size - 1; tau += 1) {
    if (cumulativeMean[tau] < absoluteThreshold) {
      let candidate = tau;
      while (candidate + 1 < size && cumulativeMean[candidate + 1] < cumulativeMean[candidate]) {
        candidate += 1;
      }
      bestTau = candidate;
      break;
    }
  }

  if (bestTau === -1) {
    let bestScore = 1;
    for (let tau = 2; tau < size; tau += 1) {
      if (cumulativeMean[tau] < bestScore) {
        bestScore = cumulativeMean[tau];
        bestTau = tau;
      }
    }
  }

  if (bestTau <= 0) {
    return null;
  }

  const refinedTau = parabolicInterpolation(cumulativeMean, bestTau);
  const frequency = sampleRate / refinedTau;

  if (frequency < 30 || frequency > 1200) {
    return null;
  }

  const clarity = clamp(1 - cumulativeMean[bestTau], 0, 1);

  if (clarity < 0.22) {
    return null;
  }

  return { frequency, clarity };
}

function parabolicInterpolation(values: Float32Array, tau: number) {
  const left = values[tau - 1];
  const center = values[tau];
  const right = values[tau + 1];

  if (left === undefined || center === undefined || right === undefined) {
    return tau;
  }

  const denominator = left - 2 * center + right;
  if (Math.abs(denominator) < 1e-7) {
    return tau;
  }

  return tau + (left - right) / (2 * denominator);
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
    return "Too noisy. Mute other strings.";
  }

  if (input.locked && input.targetNote) {
    return `${input.targetNote} locked`;
  }

  if (input.cents === null) {
    return input.autoDetect
      ? `Hearing ${input.note}`
      : `Listening for ${input.targetNote ?? input.note}`;
  }

  const direction = input.cents < 0 ? "flat" : "sharp";
  return `${Math.round(Math.abs(input.cents))} cents ${direction}`;
}
