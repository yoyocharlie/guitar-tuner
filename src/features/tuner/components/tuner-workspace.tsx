import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { AudioLines, Lock, Music2, Settings2, Share2, Sparkles, Star, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DiagnosticsPanel } from "@/features/tuner/components/diagnostics-panel";
import { Meter } from "@/features/tuner/components/meter";
import { SettingsSheet } from "@/features/tuner/components/settings-sheet";
import { StringGrid } from "@/features/tuner/components/string-grid";
import { TuningSheet } from "@/features/tuner/components/tuning-sheet";
import { playReferenceTone } from "@/features/tuner/lib/audio";
import { average, buildTargets, parseTuningNotes, slugify } from "@/features/tuner/lib/music";
import {
  defaultTuningId,
  presetTunings,
  type TuningDefinition,
} from "@/features/tuner/lib/tunings";
import { usePersistentState } from "@/features/tuner/hooks/use-persistent-state";
import { useTuner, type MicState } from "@/features/tuner/hooks/use-tuner";
import { DEFAULT_CUSTOM_FORM, DEFAULT_SETTINGS, type StoredSettings } from "@/features/tuner/types";

export function TunerWorkspace() {
  const [customTunings, setCustomTunings] = usePersistentState<TuningDefinition[]>(
    "guitar-tuner.custom-tunings",
    [],
  );
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>("guitar-tuner.favorites", [
    defaultTuningId,
  ]);
  const [settings, setSettings] = usePersistentState<StoredSettings>(
    "guitar-tuner.settings",
    DEFAULT_SETTINGS,
  );
  const [selectedTuningId, setSelectedTuningId] = usePersistentState<string>(
    "guitar-tuner.selected-tuning",
    getInitialTuningId(),
  );
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [search, setSearch] = useState("");
  const [customForm, setCustomForm] = useState(DEFAULT_CUSTOM_FORM);
  const [customError, setCustomError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const [lockedStrings, setLockedStrings] = useState<number[]>([]);
  const deferredSearch = useDeferredValue(search);

  const allTunings = [...presetTunings, ...customTunings];
  const selectedTuning =
    allTunings.find((tuning) => tuning.id === selectedTuningId) ?? presetTunings[0];
  const displayTargets = buildTargets(selectedTuning.notes, settings.calibration);
  const displayedStringIndices = settings.leftHanded
    ? displayTargets.map((_, index) => index).reverse()
    : displayTargets.map((_, index) => index);

  const handleStringLocked = useEffectEvent((index: number) => {
    setLockedStrings((current) => {
      if (current.includes(index)) {
        return current;
      }

      const updated = [...current, index];

      if (settings.tuneAllMode && !settings.autoDetect) {
        const nextIndex = displayTargets.findIndex(
          (_, targetIndex) => !updated.includes(targetIndex),
        );
        if (nextIndex !== -1) {
          startTransition(() => {
            setSelectedStringIndex(nextIndex);
          });
        }
      }

      if (navigator.vibrate) {
        navigator.vibrate(16);
      }

      return updated;
    });
  });

  const tuner = useTuner({
    tuning: selectedTuning,
    calibration: settings.calibration,
    autoDetect: settings.autoDetect,
    selectedStringIndex,
    noiseSensitivity: settings.noiseSensitivity,
    onStringLocked: handleStringLocked,
  });

  const currentTargetIndex = tuner.snapshot.targetIndex ?? selectedStringIndex ?? 0;
  const focusedTarget = displayTargets[currentTargetIndex] ?? displayTargets[0];
  const tuneProgress =
    displayTargets.length === 0 ? 0 : lockedStrings.length / displayTargets.length;
  const averageHistory =
    tuner.snapshot.history.length > 0 ? average(tuner.snapshot.history.map(Math.abs)) : 0;
  const hasPitch = tuner.snapshot.frequency !== null;
  const confidenceValue = hasPitch ? `${Math.round(tuner.snapshot.clarity * 100)}%` : "--";
  const signalValue = hasPitch ? `${Math.round(tuner.snapshot.volume * 1000) / 10}%` : "--";
  const stabilityValue = hasPitch
    ? `${Math.max(0, 100 - Math.round(averageHistory * 1.6))}%`
    : "--";
  const shareable = selectedTuning.source === "preset";

  const filteredTunings = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return allTunings;
    }

    return allTunings.filter((tuning) => {
      const haystack = [
        tuning.name,
        tuning.category,
        tuning.description,
        tuning.instrumentFamily,
        ...(tuning.aliases ?? []),
        ...tuning.notes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [allTunings, deferredSearch]);

  const groupedTunings = groupTunings(filteredTunings, favoriteIds);

  useEffect(() => {
    setLockedStrings([]);
    setSelectedStringIndex(null);
  }, [selectedTuning.id]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedTuning.source === "preset") {
      url.searchParams.set("t", selectedTuning.id);
    } else {
      url.searchParams.delete("t");
    }
    window.history.replaceState({}, "", url);
  }, [selectedTuning]);

  const toggleFavorite = (tuningId: string) => {
    setFavoriteIds((current) =>
      current.includes(tuningId) ? current.filter((id) => id !== tuningId) : [tuningId, ...current],
    );
  };

  const selectTuning = (tuningId: string) => {
    startTransition(() => {
      setSelectedTuningId(tuningId);
      setShowLibrary(false);
    });
  };

  const handleShare = async () => {
    if (!shareable) {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("done");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => {
      setCopyState("idle");
    }, 1500);
  };

  const handleCreateCustomTuning = () => {
    try {
      const notes = parseTuningNotes(customForm.notes);
      const name = customForm.name.trim();

      if (!name) {
        throw new Error("Name your tuning first");
      }

      const tuning: TuningDefinition = {
        id: `custom-${slugify(name)}-${Date.now().toString(36)}`,
        name,
        category: "Custom",
        instrumentFamily: `${notes.length}-string instrument`,
        description: customForm.description.trim() || "Saved locally on this device.",
        notes,
        source: "custom",
      };

      setCustomTunings((current) => [tuning, ...current]);
      setSelectedTuningId(tuning.id);
      setCustomForm(DEFAULT_CUSTOM_FORM);
      setCustomError(null);
      setShowCustomBuilder(false);
      setShowLibrary(false);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Could not save tuning");
    }
  };

  const removeCustomTuning = (tuningId: string) => {
    setCustomTunings((current) => current.filter((tuning) => tuning.id !== tuningId));
    if (selectedTuningId === tuningId) {
      setSelectedTuningId(defaultTuningId);
    }
  };

  const favorite = favoriteIds.includes(selectedTuning.id);
  const liveNote = tuner.snapshot.targetNote ?? tuner.snapshot.note ?? focusedTarget?.note ?? "--";
  const liveFrequency = tuner.snapshot.frequency
    ? `${tuner.snapshot.frequency.toFixed(1)} Hz`
    : selectedTuning.notes.join(" · ");
  const activeIndex = settings.autoDetect ? tuner.snapshot.targetIndex : selectedStringIndex;
  const surfaceState = getSurfaceState(tuner.micState, tuner.enabled);
  const micButtonLabel = getMicButtonLabel(tuner.enabled, tuner.micState);

  return (
    <main className="min-h-screen overflow-x-clip">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <Card className="overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_14%),linear-gradient(180deg,rgba(11,18,24,0.98),rgba(15,23,31,0.98))]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/8 bg-[rgba(255,255,255,0.03)] text-[var(--primary)]">
                <Music2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--muted-foreground)]">
                  Precision Hardware
                </p>
                <h1 className="truncate text-base font-semibold tracking-[-0.03em] sm:text-lg">
                  Guitar Tuner
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setShowLibrary(true)} variant="secondary" type="button">
                <Sparkles className="h-4 w-4" />
                Tunings
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="secondary" type="button">
                <Settings2 className="h-4 w-4" />
                Settings
              </Button>
              <Button
                aria-label={
                  copyState === "done"
                    ? "Copied"
                    : copyState === "failed"
                      ? "Copy failed"
                      : "Share tuning"
                }
                disabled={!shareable}
                onClick={handleShare}
                size="icon"
                variant="ghost"
                type="button"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                aria-label={
                  favorite ? `Unfavorite ${selectedTuning.name}` : `Favorite ${selectedTuning.name}`
                }
                onClick={() => toggleFavorite(selectedTuning.id)}
                size="icon"
                variant="ghost"
                type="button"
              >
                <Star
                  className={`h-4 w-4 ${favorite ? "fill-current text-[var(--primary)]" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="grid gap-px bg-white/6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.72fr)]">
            <section className="min-w-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent),rgba(15,23,31,0.98)] p-4 sm:p-5">
              <div className="grid gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_16%),linear-gradient(180deg,#111922,#0d141c)] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{selectedTuning.category}</Badge>
                      <Badge variant="muted">{selectedTuning.instrumentFamily}</Badge>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                      Primary readout
                    </p>
                    <h2 className="mt-2 truncate text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-[-0.05em]">
                      {selectedTuning.name}
                    </h2>
                  </div>

                  <div className="grid gap-1 text-right font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <span>{settings.autoDetect ? "auto detect" : "manual target"}</span>
                    <span>{focusedTarget.note} target</span>
                    <span>{micButtonLabel}</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22%),linear-gradient(180deg,#17212b,#0e151d_56%,#0a1016)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-24px_60px_rgba(0,0,0,0.28)] sm:px-6 sm:py-6">
                    <div className="pointer-events-none absolute inset-x-4 top-4 h-[38%] rounded-t-full border border-b-0 border-white/6 sm:inset-x-[11%]" />
                    <div className="pointer-events-none absolute inset-x-[20%] top-[5.5rem] h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] sm:top-[6.5rem]" />
                    <div className="pointer-events-none absolute inset-x-6 bottom-5 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] sm:inset-x-12" />
                    {surfaceState === "listening" ? (
                      <div className="grid gap-5">
                        <div className="relative grid min-h-[18rem] place-items-center text-center sm:min-h-[23rem]">
                          <div className="grid gap-3">
                            <div className="text-[clamp(6rem,19vw,10rem)] font-semibold leading-none tracking-[-0.1em] text-[var(--foreground)]">
                              {liveNote}
                            </div>
                            <div className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--muted-foreground)] sm:text-[13px]">
                              {liveFrequency}
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                              <span>{tuner.snapshot.statusText}</span>
                              {tuner.snapshot.locked ? (
                                <span className="inline-flex items-center gap-1 text-[rgba(136,231,191,0.95)]">
                                  <Lock className="h-3.5 w-3.5" />
                                  Locked
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <Meter cents={tuner.snapshot.cents} locked={tuner.snapshot.locked} />
                      </div>
                    ) : (
                      <IdleState
                        state={surfaceState}
                        onEnableMic={tuner.enabled ? tuner.disableMic : tuner.enableMic}
                        onPlayReference={() => playReferenceTone(focusedTarget.frequency)}
                      />
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Readout
                      label="Intonation"
                      value={
                        tuner.snapshot.cents === null
                          ? "--"
                          : `${Math.round(tuner.snapshot.cents)} cents`
                      }
                    />
                    <Readout label="Stability" value={stabilityValue} />
                    <Readout label="Noise floor" value={signalValue} />
                  </div>

                  <div className="grid gap-3 rounded-[16px] border border-white/8 bg-white/[0.02] p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                      <span>String bank</span>
                      <span>{Math.round(tuneProgress * 100)}% locked</span>
                    </div>
                    <StringGrid
                      activeIndex={activeIndex}
                      completed={lockedStrings}
                      displayTargets={displayTargets}
                      indices={displayedStringIndices}
                      onSelect={(index) => {
                        setSettings((current) => ({ ...current, autoDetect: false }));
                        setSelectedStringIndex(index);
                      }}
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button
                        onClick={() => {
                          setSettings((current) => ({
                            ...current,
                            autoDetect: !current.autoDetect,
                          }));
                          setSelectedStringIndex(null);
                        }}
                        variant={settings.autoDetect ? "default" : "secondary"}
                        type="button"
                      >
                        {settings.autoDetect ? "Auto detect on" : "Auto detect off"}
                      </Button>
                      <Button
                        onClick={() => playReferenceTone(focusedTarget.frequency)}
                        variant="secondary"
                        type="button"
                      >
                        Play {focusedTarget.note}
                      </Button>
                      <Button
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            tuneAllMode: !current.tuneAllMode,
                          }))
                        }
                        variant={settings.tuneAllMode ? "default" : "secondary"}
                        type="button"
                      >
                        All strings {Math.round(tuneProgress * 100)}%
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="grid min-w-0 gap-3 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent),rgba(15,23,31,0.98)] p-4 sm:p-5">
              <Card className="rounded-[16px] border-white/8 bg-white/[0.02] shadow-none">
                <CardContent className="grid gap-3 p-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                    <AudioLines className="h-3.5 w-3.5" />
                    Live system
                  </div>
                  <StatusRow label="Mic" value={getMicLabel(tuner.micState)} />
                  <StatusRow label="Target" value={focusedTarget.note} />
                  <StatusRow label="Confidence" value={confidenceValue} />
                  <StatusRow label="Mode" value={settings.autoDetect ? "Auto" : "Manual"} />
                </CardContent>
              </Card>

              <Card className="rounded-[16px] border-white/8 bg-white/[0.02] shadow-none">
                <CardContent className="grid gap-3 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                    Surface intent
                  </div>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    One monolithic deck, fewer soft cues, and instrument-grade readouts over app
                    chrome.
                  </p>
                </CardContent>
              </Card>

              <DiagnosticsPanel
                clarity={confidenceValue}
                history={tuner.snapshot.history}
                open={showDiagnostics}
                signal={signalValue}
                stability={stabilityValue}
                onOpenChange={setShowDiagnostics}
              />
            </aside>
          </div>
        </Card>
      </div>

      <TuningSheet
        customError={customError}
        customForm={customForm}
        favoriteIds={favoriteIds}
        groupedTunings={groupedTunings}
        open={showLibrary}
        search={search}
        selectedTuningId={selectedTuning.id}
        showCustomBuilder={showCustomBuilder}
        onCreateCustomTuning={handleCreateCustomTuning}
        onCustomFormChange={setCustomForm}
        onOpenChange={setShowLibrary}
        onRemoveCustomTuning={removeCustomTuning}
        onSearchChange={setSearch}
        onSelectTuning={selectTuning}
        onToggleCustomBuilder={() => setShowCustomBuilder((current) => !current)}
        onToggleFavorite={toggleFavorite}
      />

      <SettingsSheet
        open={showSettings}
        settings={settings}
        onOpenChange={setShowSettings}
        onSettingsChange={setSettings}
      />
    </main>
  );
}

function IdleState(props: {
  state: "denied" | "idle" | "requesting" | "too-noisy" | "unsupported";
  onEnableMic: () => void;
  onPlayReference: () => void;
}) {
  const content = {
    idle: {
      badge: "Ready",
      title: "Pluck-ready in one tap.",
      body: "Use the mic for live detection, or start with a reference tone if you are in a quiet room and just want a fast tune-up.",
      action: "Enable mic",
    },
    requesting: {
      badge: "Mic prompt",
      title: "Waiting for microphone access.",
      body: "Accept the browser prompt to start live tuning. The app stays entirely in the browser and never uploads audio.",
      action: "Waiting...",
    },
    denied: {
      badge: "Mic denied",
      title: "Microphone access is off.",
      body: "Turn the mic back on from the browser site settings, then retry. You can still play reference tones while audio access is blocked.",
      action: "Retry mic",
    },
    unsupported: {
      badge: "Unsupported",
      title: "This browser will not expose a microphone stream.",
      body: "Try Safari, Chrome, or another browser with HTTPS mic access. Reference tones still work here if you need a fallback.",
      action: "Try again",
    },
    "too-noisy": {
      badge: "Too noisy",
      title: "The mic hears too much at once.",
      body: "Mute the other strings, move closer to the mic, and pluck once. The tuner is already listening, it just needs a cleaner signal.",
      action: "Listening...",
    },
  }[props.state];

  return (
    <div className="grid gap-5 px-1 py-2 sm:px-2 sm:py-3">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="muted">{content.badge}</Badge>
        {props.state === "too-noisy" ? (
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--muted-foreground)]">
            <Volume2 className="h-3.5 w-3.5" />
            Live input
          </div>
        ) : null}
      </div>
      <div className="grid gap-3">
        <div className="max-w-[20rem] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
          {content.title}
        </div>
        <p className="max-w-[34rem] text-sm leading-6 text-[var(--muted-foreground)]">
          {content.body}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={props.onEnableMic}
          disabled={props.state === "requesting"}
          size="lg"
          type="button"
        >
          {content.action}
        </Button>
        <Button onClick={props.onPlayReference} size="lg" variant="secondary" type="button">
          Play reference tone
        </Button>
      </div>
    </div>
  );
}

function StatusRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-[var(--card)] px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
        {props.label}
      </span>
      <span className="font-mono text-sm font-medium uppercase tracking-[0.08em]">
        {props.value}
      </span>
    </div>
  );
}

function Readout(props: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-white/[0.02] px-4 py-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
        {props.label}
      </div>
      <div className="font-mono text-lg font-semibold tracking-[-0.02em]">{props.value}</div>
    </div>
  );
}

function getMicButtonLabel(enabled: boolean, micState: MicState) {
  if (enabled && micState === "listening") {
    return "Mic on";
  }

  if (micState === "requesting") {
    return "Waiting...";
  }

  return "Enable mic";
}

function getMicLabel(micState: MicState) {
  switch (micState) {
    case "requesting":
      return "Requesting";
    case "listening":
      return "Listening";
    case "denied":
      return "Denied";
    case "unsupported":
      return "Unsupported";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}

export function getSurfaceState(
  micState: MicState,
  enabled: boolean,
): "denied" | "idle" | "listening" | "requesting" | "too-noisy" | "unsupported" {
  if (micState === "requesting") {
    return "requesting";
  }

  if (micState === "denied" || micState === "error") {
    return "denied";
  }

  if (micState === "unsupported") {
    return "unsupported";
  }

  if (enabled && micState === "listening") {
    return "listening";
  }

  return "idle";
}

function groupTunings(tunings: TuningDefinition[], favoriteIds: string[]) {
  const favorites = tunings.filter((tuning) => favoriteIds.includes(tuning.id));
  const favoriteSet = new Set(favorites.map((tuning) => tuning.id));
  const categories = new Map<string, TuningDefinition[]>();

  tunings.forEach((tuning) => {
    if (favoriteSet.has(tuning.id)) {
      return;
    }

    const key = tuning.source === "custom" ? "Custom" : tuning.category;
    categories.set(key, [...(categories.get(key) ?? []), tuning]);
  });

  const grouped = [...categories.entries()].sort((left, right) => left[0].localeCompare(right[0]));

  return favorites.length > 0
    ? ([["Favorites", favorites], ...grouped.filter(([group]) => group !== "Favorites")] as Array<
        [string, TuningDefinition[]]
      >)
    : grouped;
}

function getInitialTuningId() {
  if (typeof window === "undefined") {
    return defaultTuningId;
  }

  const value = new URL(window.location.href).searchParams.get("t");
  return presetTunings.some((tuning) => tuning.id === value)
    ? (value ?? defaultTuningId)
    : defaultTuningId;
}

function applyTheme(theme: StoredSettings["theme"]) {
  const root = document.documentElement;

  if (theme === "system") {
    root.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    return;
  }

  root.dataset.theme = theme;
}
