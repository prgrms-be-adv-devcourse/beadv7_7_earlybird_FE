import { CrateIcon } from "./icons";
import { Mascot } from "./Mascot";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="relative flex flex-col items-center gap-3 rounded-sm border-2 border-dashed border-ink/25 bg-surface p-10 text-center text-sm text-mist">
      <Mascot
        variant="face"
        className="absolute -top-4 right-6 h-10 w-10 rotate-6 border-2 shadow-stamp-sm"
      />
      <CrateIcon className="h-10 w-10 text-ink/25" />
      {message}
    </div>
  );
}
