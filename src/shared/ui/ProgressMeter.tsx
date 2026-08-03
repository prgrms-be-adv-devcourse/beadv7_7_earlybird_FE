export function ProgressMeter({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const reached = percent >= 100;
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-sm border border-ink/20 bg-line"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full transition-[width] duration-150 ease-out ${reached ? "bg-sun" : "bg-brand"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
