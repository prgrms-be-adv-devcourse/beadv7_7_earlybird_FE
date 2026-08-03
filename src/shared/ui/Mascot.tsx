interface MascotProps {
  className?: string;
  variant?: "full" | "face";
}

export function Mascot({ className = "", variant = "full" }: MascotProps) {
  return (
    <div className={`overflow-hidden rounded-full border-2 border-ink bg-ink ${className}`}>
      <img
        src="/character.png"
        alt=""
        aria-hidden
        className="h-full w-full object-cover"
        style={
          variant === "face"
            ? { transform: "scale(2)", transformOrigin: "50% 35%" }
            : { transform: "scale(1.25)" }
        }
      />
    </div>
  );
}
