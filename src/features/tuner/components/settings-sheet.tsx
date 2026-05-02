import { MoonStar, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { StoredSettings, ThemeMode } from "@/features/tuner/types";

interface SettingsSheetProps {
  open: boolean;
  settings: StoredSettings;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (updater: (current: StoredSettings) => StoredSettings) => void;
}

export function SettingsSheet(props: SettingsSheetProps) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Settings</SheetTitle>
          <SheetDescription className="text-sm text-[var(--muted-foreground)]">
            Fine tune how the tuner listens.
          </SheetDescription>
        </SheetHeader>

        <div className="grid min-w-0 gap-4 overflow-auto pr-1">
          <SettingCard
            icon={SlidersHorizontal}
            label="A4 calibration"
            value={`${props.settings.calibration} Hz`}
          >
            <input
              className="w-full"
              max={446}
              min={432}
              onChange={(event) =>
                props.onSettingsChange((current) => ({
                  ...current,
                  calibration: Number(event.target.value),
                }))
              }
              step={1}
              type="range"
              value={props.settings.calibration}
            />
          </SettingCard>

          <SettingCard
            icon={SlidersHorizontal}
            label="Noise filter"
            value={String(props.settings.noiseSensitivity)}
          >
            <input
              className="w-full"
              max={100}
              min={0}
              onChange={(event) =>
                props.onSettingsChange((current) => ({
                  ...current,
                  noiseSensitivity: Number(event.target.value),
                }))
              }
              step={1}
              type="range"
              value={props.settings.noiseSensitivity}
            />
          </SettingCard>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
              <MoonStar className="h-3.5 w-3.5" />
              <span>Theme</span>
            </div>
            <Select
              onValueChange={(value) =>
                props.onSettingsChange((current) => ({ ...current, theme: value as ThemeMode }))
              }
              value={props.settings.theme}
            >
              <SelectTrigger>
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                Left-handed layout
              </div>
              <div className="mt-1 break-words text-sm text-[var(--foreground)]">
                Reverse the string order
              </div>
            </div>
            <Switch
              checked={props.settings.leftHanded}
              onCheckedChange={(checked) =>
                props.onSettingsChange((current) => ({ ...current, leftHanded: checked }))
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettingCard(props: {
  children: ReactNode;
  icon: typeof SlidersHorizontal;
  label: string;
  value: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
          <Icon className="h-3.5 w-3.5" />
          <span>{props.label}</span>
        </div>
        <span className="text-sm font-medium">{props.value}</span>
      </div>
      {props.children}
    </div>
  );
}
