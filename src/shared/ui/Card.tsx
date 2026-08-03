import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`overflow-hidden rounded-sm border-2 border-ink bg-surface p-5 shadow-stamp ${className}`}
      {...props}
    />
  );
}
