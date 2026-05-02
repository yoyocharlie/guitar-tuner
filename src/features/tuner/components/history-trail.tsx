import { clamp } from "@/features/tuner/lib/music";

export function HistoryTrail(props: { history: number[] }) {
  const points = props.history
    .map((value, index, values) => {
      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 50 - (clamp(value, -50, 50) / 50) * 42;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section
      className="grid gap-3 rounded-[14px] border border-white/8 bg-[var(--card-muted)] p-4"
      aria-label="Pitch history"
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
        <span>Pitch trail</span>
        <span>2 seconds</span>
      </div>
      <svg
        className="h-20 w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Pitch history graph"
      >
        <line x1="0" x2="100" y1="50" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {points ? (
          <polyline fill="none" points={points} stroke="var(--primary)" strokeWidth="2.2" />
        ) : null}
      </svg>
    </section>
  );
}
