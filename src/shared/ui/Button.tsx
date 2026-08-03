import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-ink bg-brand text-white shadow-stamp-sm hover:bg-brand/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  secondary:
    "border-2 border-ink bg-surface text-ink shadow-stamp-sm hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  ghost: "border-2 border-transparent bg-transparent text-mist hover:text-ink",
};

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-bold transition-transform duration-100 ease-out disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-stamp-sm ${variantClasses[variant]} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
