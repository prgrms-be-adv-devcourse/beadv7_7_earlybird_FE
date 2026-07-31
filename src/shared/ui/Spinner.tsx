export function Spinner({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-8 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
