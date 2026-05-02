import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-105",
        secondary:
          "border-[var(--border)] bg-[var(--card-muted)] text-[var(--foreground)] hover:bg-[var(--accent)]",
        ghost:
          "border-transparent bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--accent)]",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-[12px] px-5 text-sm",
        icon: "h-10 w-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, size, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}
