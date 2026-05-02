import { Activity, AudioLines, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryTrail } from "@/features/tuner/components/history-trail";

interface DiagnosticsPanelProps {
  clarity: string;
  history: number[];
  open: boolean;
  signal: string;
  stability: string;
  onOpenChange: (value: boolean) => void;
}

export function DiagnosticsPanel(props: DiagnosticsPanelProps) {
  return (
    <Card className="rounded-[16px] border-white/8 bg-[var(--card-muted)]/78 shadow-none">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Diagnostics
          </CardTitle>
        </div>
        <Button
          onClick={() => props.onOpenChange(!props.open)}
          size="sm"
          variant="ghost"
          type="button"
        >
          {props.open ? "Hide" : "Show"}
        </Button>
      </CardHeader>
      {props.open ? (
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat icon={Target} label="Confidence" value={props.clarity} />
            <Stat icon={AudioLines} label="Signal" value={props.signal} />
            <Stat icon={Activity} label="Stability" value={props.stability} />
          </div>
          <HistoryTrail history={props.history} />
        </CardContent>
      ) : null}
    </Card>
  );
}

function Stat(props: { icon: typeof Activity; label: string; value: string }) {
  const Icon = props.icon;

  return (
    <div className="min-w-0 rounded-[14px] border border-white/8 bg-[var(--card)] p-4">
      <div className="mb-2 flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">{props.label}</span>
      </div>
      <strong className="font-mono text-lg font-semibold">{props.value}</strong>
    </div>
  );
}
