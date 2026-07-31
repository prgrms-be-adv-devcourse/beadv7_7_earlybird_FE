import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-mint text-slate-800 hover:bg-mint/80",
  secondary: "bg-peach text-slate-800 hover:bg-peach/80",
  ghost: "bg-transparent text-slate-600 hover:bg-lavender/30",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-2xl px-4 py-2 font-jua shadow-md transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
