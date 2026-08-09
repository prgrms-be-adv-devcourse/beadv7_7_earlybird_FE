import { useEffect, useState } from "react";

const FRAMES = ["/bird-fly-1.png", "/bird-fly-2.png", "/bird-fly-3.png", "/bird-fly-4.png"];

interface FlappingBirdProps {
  className?: string;
  fps?: number;
}

export function FlappingBird({ className = "", fps = 10 }: FlappingBirdProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);

  return <img src={FRAMES[frame]} alt="" aria-hidden className={className} />;
}
