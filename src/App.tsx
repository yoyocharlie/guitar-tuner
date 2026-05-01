import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { average, buildTargets, clamp, parseTuningNotes, slugify } from "./music";
import { defaultTuningId, presetTunings, type TuningDefinition } from "./tunings";
import { useTuner, type MicState } from "./useTuner";

type ThemeMode = "system" | "dark" | "light";

interface StoredSettings {
  autoDetect: boolean;
  calibration: number;
  leftHanded: boolean;
  noiseSensitivity: number;
  theme: ThemeMode;
  tuneAllMode: boolean;
}

interface CustomFormState {
  description: string;
  name: string;
  notes: string;
}

const DEFAULT_SETTINGS: StoredSettings = {
  autoDetect: true,
  calibration: 440,
  leftHanded: false,
  noiseSensitivity: 45,
  theme: "system",
  tuneAllMode: false,
};

const DEFAULT_CUSTOM_FORM: CustomFormState = {
  description: "",
  name: "",
  notes: "E2 A2 D3 G3 B3 E4",
};

export function App() {
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
  const [showLibrary, setShowLibrary] = useState(false);
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
  const focusedTarget = displayTargets[currentTargetIndex] ?? displayTargets[0];
  const tuneProgress =
    displayTargets.length === 0 ? 0 : lockedStrings.length / displayTargets.length;
  const averageHistory =
    tuner.snapshot.history.length > 0 ? average(tuner.snapshot.history.map(Math.abs)) : 0;

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

  return (
    <main className="shell">
      <section className="panel hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Open-source browser tuner</p>
          <h1>Fast pitch. Calm UI. Deep tunings.</h1>
          <p className="subtle-text">
            Tune from your phone, switch tunings in one tap, and let the app guess the string you
            meant.
          </p>
        </div>
        <div className="hero-actions">
          <button
            className="primary-button"
            onClick={tuner.enabled ? tuner.disableMic : tuner.enableMic}
            type="button"
          >
            {getMicButtonLabel(tuner.enabled, tuner.micState)}
          </button>
          <button className="secondary-button" onClick={() => setShowLibrary(true)} type="button">
            Tunings
          </button>
        </div>
        <MicStatusBanner micState={tuner.micState} />
      </section>

      <section className="panel tuner-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">{selectedTuning.category}</p>
            <h2>{selectedTuning.name}</h2>
            <p className="subtle-text">
              {selectedTuning.instrumentFamily} · {selectedTuning.description}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="ghost-button"
              onClick={handleShare}
              disabled={!shareable}
              type="button"
            >
              {copyState === "done" ? "Copied" : copyState === "failed" ? "Copy failed" : "Share"}
            </button>
            <button
              className="ghost-button"
              onClick={() => toggleFavorite(selectedTuning.id)}
              type="button"
            >
              {favoriteIds.includes(selectedTuning.id) ? "Unfavorite" : "Favorite"}
            </button>
          </div>
        </header>

        <div className={`note-lockup${tuner.snapshot.locked ? " is-locked" : ""}`}>
          <p className="status-pill">{tuner.snapshot.statusText}</p>
          <div className="note-stack">
            <span className="current-note">
              {tuner.snapshot.targetNote ?? tuner.snapshot.note ?? "--"}
            </span>
            <span className="note-meta">
              {tuner.snapshot.frequency
                ? `${tuner.snapshot.frequency.toFixed(1)} Hz`
                : "Waiting for a stable pitch"}
            </span>
          </div>
        </div>

        <Meter cents={tuner.snapshot.cents} locked={tuner.snapshot.locked} />

        <div className="stats-row" aria-label="Detection status">
          <StatCard label="Confidence" value={`${Math.round(tuner.snapshot.clarity * 100)}%`} />
          <StatCard label="Signal" value={`${Math.round(tuner.snapshot.volume * 1000) / 10}%`} />
          <StatCard
            label="Stability"
            value={`${Math.max(0, 100 - Math.round(averageHistory * 1.6))}%`}
          />
        </div>

        <HistoryTrail history={tuner.snapshot.history} />

        <div className={`strings-grid${settings.leftHanded ? " is-left-handed" : ""}`}>
          {displayedStringIndices.map((index) => {
            const target = displayTargets[index];
            const stringNumber = displayTargets.length - index;
            const active =
              (settings.autoDetect && tuner.snapshot.targetIndex === index) ||
              (!settings.autoDetect && selectedStringIndex === index);
            const completed = lockedStrings.includes(index);

            return (
              <button
                key={`${target.note}-${index}`}
                className={`string-chip${active ? " is-active" : ""}${completed ? " is-complete" : ""}`}
                onClick={() => {
                  setSettings((current) => ({ ...current, autoDetect: false }));
                  setSelectedStringIndex(index);
                }}
                type="button"
              >
                <span className="string-number">{stringNumber}</span>
                <span>{target.note}</span>
              </button>
            );
          })}
        </div>

        <div className="control-row">
          <button
            className={`toggle-chip${settings.autoDetect ? " is-on" : ""}`}
            onClick={() => {
              setSettings((current) => ({ ...current, autoDetect: true }));
              setSelectedStringIndex(null);
            }}
            type="button"
          >
            Auto detect
          </button>
          <button
            className="toggle-chip"
            onClick={() => playReferenceTone(focusedTarget.frequency)}
            type="button"
          >
            Play {focusedTarget.note}
          </button>
          <button
            className={`toggle-chip${settings.tuneAllMode ? " is-on" : ""}`}
            onClick={() =>
              setSettings((current) => ({ ...current, tuneAllMode: !current.tuneAllMode }))
            }
            type="button"
          >
            Tune all {Math.round(tuneProgress * 100)}%
          </button>
        </div>
      </section>

      <section className="panel settings-panel">
        <header className="panel-header compact-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>One tap away</h2>
          </div>
        </header>

        <div className="settings-grid">
          <label className="setting">
            <span>A4 calibration</span>
            <div className="setting-inline">
              <input
                max={446}
                min={432}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    calibration: Number(event.target.value),
                  }))
                }
                step={1}
                type="range"
                value={settings.calibration}
              />
              <strong>{settings.calibration} Hz</strong>
            </div>
          </label>

          <label className="setting">
            <span>Noise filter</span>
            <div className="setting-inline">
              <input
                max={100}
                min={0}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    noiseSensitivity: Number(event.target.value),
                  }))
                }
                step={1}
                type="range"
                value={settings.noiseSensitivity}
              />
              <strong>{settings.noiseSensitivity}</strong>
            </div>
          </label>

          <label className="setting">
            <span>Theme</span>
            <select
              onChange={(event) =>
                setSettings((current) => ({ ...current, theme: event.target.value as ThemeMode }))
              }
              value={settings.theme}
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>

          <label className="setting switch-setting">
            <span>Left-handed layout</span>
            <button
              className={`toggle-chip${settings.leftHanded ? " is-on" : ""}`}
              onClick={() =>
                setSettings((current) => ({ ...current, leftHanded: !current.leftHanded }))
              }
              type="button"
            >
              {settings.leftHanded ? "On" : "Off"}
            </button>
          </label>
        </div>
      </section>

      {showLibrary ? (
        <div className="overlay" role="presentation" onClick={() => setShowLibrary(false)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <header className="drawer-header">
              <div>
                <p className="eyebrow">Tuning library</p>
                <h2>Preset packs and custom slots</h2>
              </div>
              <button className="ghost-button" onClick={() => setShowLibrary(false)} type="button">
                Close
              </button>
            </header>

            <label className="search-field">
              <span className="sr-only">Search tunings</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search DADGAD, bass, drop..."
                value={search}
              />
            </label>

            <div className="library-list">
              {groupedTunings.map(([group, tunings]) => (
                <section key={group} className="library-group">
                  <h3>{group}</h3>
                  {tunings.map((tuning) => (
                    <article
                      className={`library-card${selectedTuning.id === tuning.id ? " is-selected" : ""}`}
                      key={tuning.id}
                    >
                      <button
                        className="library-select"
                        onClick={() => selectTuning(tuning.id)}
                        type="button"
                      >
                        <span className="library-name">{tuning.name}</span>
                        <span className="library-meta">{tuning.notes.join(" ")}</span>
                        <span className="library-description">{tuning.description}</span>
                      </button>
                      <div className="library-card-actions">
                        <button
                          className="ghost-button small-button"
                          onClick={() => toggleFavorite(tuning.id)}
                          type="button"
                        >
                          {favoriteIds.includes(tuning.id) ? "Starred" : "Star"}
                        </button>
                        {tuning.source === "custom" ? (
                          <button
                            className="ghost-button small-button"
                            onClick={() => removeCustomTuning(tuning.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>

            <section className="custom-builder">
              <header>
                <p className="eyebrow">Custom tuning</p>
                <h3>Save your own note stack</h3>
              </header>
              <div className="custom-grid">
                <label className="setting">
                  <span>Name</span>
                  <input
                    onChange={(event) =>
                      setCustomForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Sunday slide"
                    value={customForm.name}
                  />
                </label>
                <label className="setting">
                  <span>Notes</span>
                  <input
                    onChange={(event) =>
                      setCustomForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="D2 A2 D3 F#3 A3 D4"
                    value={customForm.notes}
                  />
                </label>
                <label className="setting">
                  <span>Description</span>
                  <input
                    onChange={(event) =>
                      setCustomForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Saved only on this device"
                    value={customForm.description}
                  />
                </label>
              </div>
              {customError ? <p className="error-text">{customError}</p> : null}
              <button className="primary-button" onClick={handleCreateCustomTuning} type="button">
                Save tuning
              </button>
            </section>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function Meter(props: { cents: number | null; locked: boolean }) {
  const cents = clamp(props.cents ?? 0, -50, 50);
  const position = ((cents + 50) / 100) * 100;

  return (
    <section className="meter" aria-label="Tuning meter">
      <div className="meter-scale">
        <span>Flat</span>
        <span>In tune</span>
        <span>Sharp</span>
      </div>
      <div className={`meter-track${props.locked ? " is-locked" : ""}`}>
        <div className="meter-center" />
        <div className="meter-needle" style={{ left: `${position}%` }} />
      </div>
      <p className="meter-readout">
        {props.cents === null ? "-- cents" : `${Math.round(props.cents)} cents`}
      </p>
    </section>
  );
}

function HistoryTrail(props: { history: number[] }) {
  const points = props.history
    .map((value, index, values) => {
      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 50 - (clamp(value, -50, 50) / 50) * 42;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="history-panel" aria-label="Pitch history">
      <div className="history-header">
        <span>Pitch trail</span>
        <span>Last two seconds</span>
      </div>
      <svg
        className="history-graph"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Pitch history graph"
      >
        <line x1="0" x2="100" y1="50" y2="50" />
        {points ? <polyline fill="none" points={points} /> : null}
      </svg>
    </section>
  );
}

function MicStatusBanner(props: { micState: MicState }) {
  const messages: Record<MicState, string> = {
    idle: "We only use your mic in the browser. No uploads, no backend.",
    requesting: "Waiting for microphone permission.",
    listening: "Mic live. Pluck one string at a time for the calmest lock.",
    denied: "Microphone access was denied. You can still use reference tones and presets.",
    unsupported: "This browser does not expose microphone capture for the tuner.",
    error: "The mic could not start. Reload and try again.",
  };

  return <p className="banner">{messages[props.micState]}</p>;
}

function getMicButtonLabel(enabled: boolean, micState: MicState) {
  if (enabled && micState === "listening") {
    return "Disable mic";
  }

  if (micState === "requesting") {
    return "Waiting for mic";
  }

  return "Enable mic";
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
    ? [["Favorites", favorites], ...grouped.filter(([group]) => group !== "Favorites")]
    : grouped;
}

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return fallback;
    }

    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    try {
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
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

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  if (theme === "system") {
    root.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    return;
  }

  root.dataset.theme = theme;
}

function playReferenceTone(frequency: number) {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.1);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1.15);
  oscillator.onended = () => {
    audioContext.close().catch(() => undefined);
  };
}
