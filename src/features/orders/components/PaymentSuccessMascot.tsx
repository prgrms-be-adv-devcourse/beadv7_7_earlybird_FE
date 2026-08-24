import { useState } from "react";
import { motion } from "framer-motion";
import { FlappingBird } from "../../../shared/ui";

type Phase = "flying-in" | "bowing" | "idle" | "leaving";

const FLY_DURATION = 1.6; // 천천히 날아옴/날아감
const BOW_DURATION = 1;
const SHADOW = "drop-shadow-[0_10px_16px_rgba(43,36,24,0.3)]";

// 화면 왼쪽 끝 밖에서 날아 들어와 제자리(0,0)에 앉고, 누르면 화면 오른쪽 끝 밖으로 날아 나간다.
const FLY_IN_FROM = { opacity: 0, x: "-120vw", y: 10, rotate: -8, scale: 0.7 };
const AT_REST = { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 };
const FLY_OUT_TO = { opacity: 0, x: "120vw", y: -10, rotate: 12, scale: 0.6 };

export function PaymentSuccessMascot() {
  const [phase, setPhase] = useState<Phase>("flying-in");
  const [showFeather, setShowFeather] = useState(false);

  const handleClick = () => {
    if (phase !== "idle") return; // 인사 다 끝나고 가만히 있을 때만 눌러서 보낼 수 있다
    setPhase("leaving");
    setShowFeather(true);
  };

  return (
    <div className="absolute -top-14 right-1 z-50 h-32 w-32 sm:-top-16 sm:right-3 sm:h-40 sm:w-40">
      {/* z-50: 배너가 헤더(sticky, z-40) 바로 아래에 붙어 있으면 이만큼 위로 띄운 마스코트가
          헤더 영역과 겹쳐서 뒤에 가려질 수 있다 — 헤더보다 위에 그려지도록 z-index를 더 높게 둔다. */}
      {(phase === "flying-in" || phase === "leaving") && (
        <motion.div
          className={`pointer-events-none h-full w-full ${SHADOW}`}
          initial={phase === "flying-in" ? FLY_IN_FROM : AT_REST}
          animate={phase === "flying-in" ? AT_REST : FLY_OUT_TO}
          transition={{ duration: FLY_DURATION, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (phase === "flying-in") setPhase("bowing");
          }}
        >
          {/* bird-fly 스프라이트는 왼쪽을 향해 나는 그림이라, 왼쪽→오른쪽으로 이동하는 지금 방향에 맞춰 좌우 반전한다. */}
          <FlappingBird className="h-full w-full -scale-x-100 object-contain" />
        </motion.div>
      )}

      {(phase === "bowing" || phase === "idle") && (
        <motion.img
          src="/bird-afterPay.png"
          alt=""
          aria-hidden={phase !== "idle"}
          onClick={handleClick}
          className={`h-full w-full object-contain transition-transform ${SHADOW} ${
            phase === "idle" ? "cursor-pointer hover:scale-105" : "pointer-events-none"
          }`}
          initial={{ rotate: 0, scale: 0.9 }}
          animate={phase === "bowing" ? { rotate: [0, -12, 6, 0], scale: [0.9, 1.05, 1, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: BOW_DURATION, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (phase === "bowing") setPhase("idle");
          }}
        />
      )}

      {/* 깃털은 새가 떠날 때 남기고 가는 흔적 — 사라지지 않고 그 자리에 계속 남는다. */}
      {showFeather && (
        <motion.span
          className="pointer-events-none absolute left-1/2 top-1/2 text-2xl select-none"
          aria-hidden
          initial={{ opacity: 0, y: 0, x: 0, rotate: 0 }}
          animate={{ opacity: 1, y: 55, x: -16, rotate: 35 }}
          transition={{ duration: FLY_DURATION * 0.6, ease: "easeInOut", delay: 0.2 }}
        >
          🪶
        </motion.span>
      )}
    </div>
  );
}
