import { CrateIcon } from "./icons";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border-2 border-dashed border-ink/25 bg-surface p-10 text-center text-sm text-mist">
      <CrateIcon className="h-10 w-10 text-ink/25" />
      {message}
    </div>
  );
}
