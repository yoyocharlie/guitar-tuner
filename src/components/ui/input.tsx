import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] shadow-none outline-none transition-colors",
        className,
      )}
      {...props}
    />
  );
}
