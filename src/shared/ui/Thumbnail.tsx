import { CameraIcon } from "./icons";

interface ThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function Thumbnail({ src, alt = "프로젝트 이미지", className = "" }: ThumbnailProps) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-paper ${className}`}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 border-b-2 border-dashed border-ink/20 bg-paper text-xs text-mist ${className}`}
    >
      <CameraIcon className="h-8 w-8 text-ink/25" />
      이미지 준비중
    </div>
  );
}
