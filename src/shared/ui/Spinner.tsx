import { BirdIcon } from "./icons";

export function Spinner({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-8 text-mist">
      <BirdIcon className="h-5 w-5 animate-pulse text-brand" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
