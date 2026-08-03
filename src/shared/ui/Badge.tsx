import type { HTMLAttributes } from "react";

type BadgeTone = "mint" | "peach" | "lavender";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  mint: "border-ink bg-sun text-ink",
  peach: "border-brand bg-brand text-white",
  lavender: "border-ink/30 bg-transparent text-mist",
};

export function Badge({ tone = "mint", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`rounded-sm border px-2 py-0.5 text-xs font-bold tracking-wide ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
