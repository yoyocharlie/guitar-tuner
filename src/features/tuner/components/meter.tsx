import { clamp } from "@/features/tuner/lib/music";
import { cn } from "@/lib/utils";

export function Meter(props: { cents: number | null; locked: boolean }) {
  const cents = clamp(props.cents ?? 0, -50, 50);
  const distance = Math.abs(cents) / 50;
  const activeSide = props.cents === null || cents === 0 ? null : cents < 0 ? "flat" : "sharp";
  const status =
    props.cents === null
      ? "idle"
      : props.locked
        ? "locked"
        : activeSide === "flat"
          ? "tune up"
          : activeSide === "sharp"
            ? "ease back"
            : "centered";

  return (
    <section className="grid gap-3" aria-label="Tuning meter">
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
        <span>
          {props.cents === null ? "-- cents" : `${Math.abs(Math.round(props.cents))} cents`}
        </span>
        <span className={props.locked ? "text-[rgba(136,231,191,0.95)]" : ""}>{status}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
        <SegmentBank active={activeSide === "flat"} distance={distance} side="flat" />
        <div
          className={cn(
            "relative grid h-16 w-24 place-items-center overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-3 sm:w-28",
            props.locked && "border-[rgba(136,231,191,0.5)] bg-[rgba(136,231,191,0.08)]",
          )}
        >
          <div className="pointer-events-none absolute inset-x-3 top-3 h-px bg-white/10" />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-white/10" />
          <div className="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/12" />
          <div className="grid place-items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              lock zone
            </span>
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
              {props.locked ? "captured" : "target"}
            </span>
          </div>
        </div>
        <SegmentBank active={activeSide === "sharp"} distance={distance} side="sharp" />
      </div>
      <p className="text-center font-mono text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
        Flat side loads left. Sharp side loads right.
      </p>
    </section>
  );
}

function SegmentBank(props: { active: boolean; distance: number; side: "flat" | "sharp" }) {
  const segments = [0, 1, 2, 3, 4, 5];
  const ordered = props.side === "flat" ? [...segments].reverse() : segments;

  return (
    <div className="grid h-16 grid-cols-6 items-end gap-1">
      {ordered.map((segment) => {
        const threshold = (segment + 1) / segments.length;
        const lit = props.active && props.distance >= threshold - 0.08;
        const height = 18 + segment * 6;

        return (
          <div
            key={`${props.side}-${segment}`}
            className={cn(
              "rounded-[6px] border border-white/6 bg-white/[0.04] transition-colors duration-150",
              lit &&
                (props.side === "flat"
                  ? "border-[rgba(143,213,255,0.35)] bg-[rgba(143,213,255,0.7)]"
                  : "border-[rgba(255,127,147,0.35)] bg-[rgba(255,127,147,0.72)]"),
            )}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}
