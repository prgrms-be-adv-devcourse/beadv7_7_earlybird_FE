export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-ink/10 ${className}`} />;
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-sm border-2 border-ink/15 bg-surface ${className}`}>
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-1 h-3 w-full" />
        <Skeleton className="mt-2 h-8 w-full" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border-2 border-ink/15 bg-surface p-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
