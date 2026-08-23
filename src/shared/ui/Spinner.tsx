import { FlappingBird } from "./FlappingBird";

export function Spinner({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-8 text-mist">
      <FlappingBird className="h-6 w-6" fps={8} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
