import { useState, useEffect } from "react";
import { CameraIcon } from "./icons";

interface ThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  objectFit?: "cover" | "contain";
}

export function Thumbnail({
  src,
  alt = "프로젝트 이미지",
  className = "",
  objectFit = "cover",
}: ThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    return (
      <div className={`relative overflow-hidden bg-paper flex items-center justify-center ${className}`}>
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-102 ${
            objectFit === "contain" ? "object-contain max-h-[580px]" : "object-cover"
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 border-b-2 border-dashed border-ink/20 bg-paper text-xs text-mist min-h-[200px] ${className}`}
    >
      <CameraIcon className="h-8 w-8 text-ink/25" />
      <span>이미지 준비중</span>
    </div>
  );
}
