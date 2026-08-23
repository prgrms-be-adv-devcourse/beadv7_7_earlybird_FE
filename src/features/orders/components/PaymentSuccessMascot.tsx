import { motion } from "framer-motion";

const DURATION = 2.6;
// 인사(꾸벅) → 잠깐 머무름 → 날아서 퇴장. 새는 날아간 뒤 그대로 사라져 있고,
// 깃털은 도중에 내려앉아 사라지지 않고 그 자리에 계속 남는다(증거처럼).
const BIRD_TIMES = [0, 0.15, 0.3, 0.55, 1];
const FEATHER_TIMES = [0, 0.5, 0.56, 0.8];

export function PaymentSuccessMascot() {
  return (
    <div className="pointer-events-none absolute -top-14 right-1 h-32 w-32 sm:-top-16 sm:right-3 sm:h-40 sm:w-40">
      <motion.img
        src="/bird-afterPay.png"
        alt=""
        aria-hidden
        className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(43,36,24,0.3)]"
        initial={{ opacity: 0, scale: 0.6, y: 10, x: 0, rotate: 0 }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          scale: [0.6, 1, 1.05, 1, 0.5],
          y: [10, 0, 0, 0, -140],
          x: [0, 0, 0, 0, 220],
          rotate: [0, -12, 6, 0, -18],
        }}
        transition={{ duration: DURATION, ease: "easeInOut", times: BIRD_TIMES }}
      />
      <motion.span
        className="absolute left-1/2 top-1/2 text-2xl select-none"
        aria-hidden
        initial={{ opacity: 0, y: 0, x: 0, rotate: 0 }}
        animate={{
          opacity: [0, 0, 1, 1],
          y: [0, 0, 0, 55],
          x: [0, 0, 0, -16],
          rotate: [0, 0, 0, 35],
        }}
        transition={{ duration: DURATION, ease: "easeInOut", times: FEATHER_TIMES }}
      >
        🪶
      </motion.span>
    </div>
  );
}
