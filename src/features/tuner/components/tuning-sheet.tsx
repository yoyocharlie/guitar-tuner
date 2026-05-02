import { Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CustomFormState } from "@/features/tuner/types";
import type { TuningDefinition } from "@/features/tuner/lib/tunings";

interface TuningSheetProps {
  customError: string | null;
  customForm: CustomFormState;
  favoriteIds: string[];
  groupedTunings: Array<[string, TuningDefinition[]]>;
  open: boolean;
  search: string;
  selectedTuningId: string;
  showCustomBuilder: boolean;
  onCustomFormChange: (updater: (current: CustomFormState) => CustomFormState) => void;
  onCreateCustomTuning: () => void;
  onOpenChange: (open: boolean) => void;
  onRemoveCustomTuning: (tuningId: string) => void;
  onSearchChange: (value: string) => void;
  onSelectTuning: (tuningId: string) => void;
  onToggleCustomBuilder: () => void;
  onToggleFavorite: (tuningId: string) => void;
}

export function TuningSheet(props: TuningSheetProps) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Tunings</SheetTitle>
          <SheetDescription className="text-sm text-[var(--muted-foreground)]">
            Pick a preset or save your own.
          </SheetDescription>
        </SheetHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            className="pl-9"
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Search drop, bass, DADGAD..."
            value={props.search}
          />
        </div>

        <div className="grid min-w-0 gap-5 overflow-auto pr-1">
          {props.groupedTunings.map(([group, tunings]) => (
            <section key={group} className="grid gap-3">
              <h3 className="text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                {group}
              </h3>
              <div className="grid gap-2.5">
                {tunings.map((tuning) => {
                  const favorite = props.favoriteIds.includes(tuning.id);

                  return (
                    <article
                      className={`rounded-2xl border p-3 transition-colors ${
                        props.selectedTuningId === tuning.id
                          ? "border-transparent bg-[var(--primary)]/16"
                          : "border-[var(--border)] bg-[var(--card-muted)]"
                      }`}
                      key={tuning.id}
                    >
                      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => props.onSelectTuning(tuning.id)}
                          type="button"
                        >
                          <div className="break-words text-sm font-semibold">{tuning.name}</div>
                          <div className="mt-1 break-words text-xs text-[var(--muted-foreground)]">
                            {tuning.notes.join(" ")}
                          </div>
                        </button>
                        <Button
                          aria-label={
                            favorite ? `Unfavorite ${tuning.name}` : `Favorite ${tuning.name}`
                          }
                          onClick={() => props.onToggleFavorite(tuning.id)}
                          size="icon"
                          variant="ghost"
                          type="button"
                        >
                          <Star
                            className={`h-4 w-4 ${favorite ? "fill-current text-[var(--primary)]" : ""}`}
                          />
                        </Button>
                        {tuning.source === "custom" ? (
                          <Button
                            aria-label={`Remove ${tuning.name}`}
                            onClick={() => props.onRemoveCustomTuning(tuning.id)}
                            size="icon"
                            variant="ghost"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-muted)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Custom tuning</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Keep this collapsed until you need it.
                </p>
              </div>
              <Button
                onClick={props.onToggleCustomBuilder}
                size="sm"
                variant="secondary"
                type="button"
              >
                {props.showCustomBuilder ? "Hide" : "Create"}
              </Button>
            </div>

            {props.showCustomBuilder ? (
              <div className="grid gap-3">
                <Input
                  onChange={(event) =>
                    props.onCustomFormChange((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Name"
                  value={props.customForm.name}
                />
                <Input
                  onChange={(event) =>
                    props.onCustomFormChange((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="E2 A2 D3 G3 B3 E4"
                  value={props.customForm.notes}
                />
                <Input
                  onChange={(event) =>
                    props.onCustomFormChange((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                  value={props.customForm.description}
                />
                {props.customError ? (
                  <p className="text-sm text-[var(--danger)]">{props.customError}</p>
                ) : null}
                <Button onClick={props.onCreateCustomTuning} type="button">
                  Save tuning
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
