import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FlappingBird } from "./FlappingBird";
import { CaterpillarIcon } from "./icons";

const FLIGHT_DURATION = 1.4;

function CaterpillarTrio() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-3 flex justify-around px-6">
      {[
        { r: "-rotate-6", d: 0 },
        { r: "rotate-3", d: 1 },
        { r: "-rotate-2", d: 2 },
      ].map(({ r, d }) => (
        <span
          key={d}
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-surface text-ink shadow-stamp ${r}`}
        >
          <CaterpillarIcon className="h-4 w-4" aria-hidden />
        </span>
      ))}
    </div>
  );
}

export function SupportButton({
  label,
  disabled,
  onClick,
  trigger = 0,
  compact = false,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  trigger?: number;
  compact?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevTrigger = useRef(trigger);
  const [flyingLabel, setFlyingLabel] = useState(label);
  const [flightRect, setFlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFlyingLabel(label);
    setFlightRect(rect);
    const timer = setTimeout(() => setFlightRect(null), FLIGHT_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [trigger, label]);

  return (
    <div className="relative w-full overflow-visible">
      <CaterpillarTrio />
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full rounded-full border-2 border-ink bg-brand font-display font-extrabold text-white shadow-stamp transition-all duration-150 hover:bg-brand/90 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? "py-2.5 text-sm" : "py-3 text-base"
        } ${flightRect ? "!opacity-0" : ""}`}
      >
        {label}
      </button>

      {flightRect &&
        createPortal(
          <>
            <motion.div
              className="pointer-events-none fixed z-[999] flex items-center justify-center rounded-full border-2 border-ink bg-brand text-center font-display font-extrabold text-white shadow-stamp"
              style={{
                left: flightRect.left,
                top: flightRect.top,
                width: flightRect.width,
                height: flightRect.height,
              }}
              initial={{ x: "0vw", y: "0vh", rotate: 0, scale: 1, opacity: 1 }}
              animate={{
                x: ["0vw", "0vw", "0vw", "58vw"],
                y: ["0vh", "0vh", "-3vh", "-46vh"],
                rotate: [0, 0, -4, -14],
                scale: [1, 1, 1.05, 0.55],
                opacity: [1, 1, 1, 0],
              }}
              transition={{ duration: FLIGHT_DURATION, ease: "easeInOut", times: [0, 0.3, 0.42, 1] }}
            >
              {flyingLabel}
            </motion.div>
            <motion.div
              className="pointer-events-none fixed z-[1000] h-14 w-14"
              style={{
                left: flightRect.left + flightRect.width / 2 - 28,
                top: flightRect.top - 20,
              }}
              initial={{ x: "12vw", y: "-20vh", opacity: 0, rotate: -8, scale: 0.7 }}
              animate={{
                x: ["12vw", "2vw", "1vw", "60vw"],
                y: ["-20vh", "-6vh", "-8vh", "-51vh"],
                opacity: [0, 1, 1, 1],
                rotate: [-8, 5, 0, -16],
                scale: [0.7, 1, 1.08, 0.65],
              }}
              transition={{ duration: FLIGHT_DURATION, ease: "easeInOut", times: [0, 0.3, 0.42, 1] }}
            >
              <FlappingBird className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(43,36,24,0.35)]" />
            </motion.div>
          </>,
          document.body,
        )}
    </div>
  );
}
