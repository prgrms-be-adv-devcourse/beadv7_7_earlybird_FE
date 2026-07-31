import type { HTMLAttributes } from "react";

type BadgeTone = "mint" | "peach" | "lavender";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  mint: "bg-mint/40 text-emerald-800",
  peach: "bg-peach/40 text-rose-800",
  lavender: "bg-lavender/40 text-indigo-800",
};

export function Badge({ tone = "mint", className = "", ...props }: BadgeProps) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`} {...props} />;
}
