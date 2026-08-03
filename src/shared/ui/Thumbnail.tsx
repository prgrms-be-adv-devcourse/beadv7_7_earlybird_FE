import { CameraIcon } from "./icons";

export function Thumbnail({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 border-b-2 border-dashed border-ink/20 bg-paper text-xs text-mist ${className}`}
    >
      <CameraIcon className="h-8 w-8 text-ink/25" />
      이미지 준비중
    </div>
  );
}
