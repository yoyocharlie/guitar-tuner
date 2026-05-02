import type { TuningTarget } from "@/features/tuner/lib/music";
import { cn } from "@/lib/utils";

interface StringGridProps {
  activeIndex: number | null;
  completed: number[];
  displayTargets: TuningTarget[];
  indices: number[];
  onSelect: (index: number) => void;
}

export function StringGrid(props: StringGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {props.indices.map((index) => {
        const target = props.displayTargets[index];
        const stringNumber = props.displayTargets.length - index;
        const active = props.activeIndex === index;
        const done = props.completed.includes(index);

        return (
          <button
            key={`${target.note}-${index}`}
            className={cn(
              "grid min-h-18 gap-1 rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] px-3 py-3 text-center transition-colors hover:bg-[var(--accent)]",
              active &&
                "border-[rgba(143,213,255,0.5)] shadow-[inset_0_0_0_1px_rgba(143,213,255,0.2)]",
              done && "border-[rgba(136,231,191,0.5)] text-[rgba(136,231,191,0.95)]",
            )}
            onClick={() => props.onSelect(index)}
            type="button"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
              {stringNumber}
            </span>
            <span className="font-mono text-lg font-semibold tracking-[-0.03em]">
              {target.note}
            </span>
          </button>
        );
      })}
    </div>
  );
}
