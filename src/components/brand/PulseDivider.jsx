"use client";
import { motion } from "framer-motion";
import { bioSignal } from "@/components/ui/tokens";

/* A thin breathing HRV line used between sections instead of <hr>.
   The heartbeat of the page is literally the page's divider. */
export default function PulseDivider({ intensity = "normal" }) {
  const dim = intensity === "dim";
  const stroke = dim ? 1 : 1.5;
  const opacity = dim ? 0.4 : 0.7;

  return (
    <div aria-hidden style={{
      display: "block",
      inlineSize: "100%",
      blockSize: 60,
      marginBlock: "clamp(40px, 6vw, 72px)",
      paddingInline: "clamp(24px, 6vw, 96px)",
    }}>
      <svg viewBox="0 0 900 40" preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "100%", opacity }}>
        <defs>
          <linearGradient id="v5-pulse-div" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
            <stop offset="18%" stopColor={bioSignal.phosphorCyan} stopOpacity="1" />
            <stop offset="82%" stopColor={bioSignal.neuralViolet} stopOpacity="1" />
            <stop offset="100%" stopColor={bioSignal.neuralViolet} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0 20 Q 60 18, 120 20 T 240 20 T 360 18 T 440 14 L 452 26 L 464 10 L 476 22 T 560 20 T 680 18 T 800 20 T 900 20"
          fill="none"
          stroke="url(#v5-pulse-div)"
          strokeWidth={stroke}
          strokeLinecap="round"
          animate={{
            d: [
              "M 0 20 Q 60 18, 120 20 T 240 20 T 360 18 T 440 14 L 452 26 L 464 10 L 476 22 T 560 20 T 680 18 T 800 20 T 900 20",
              "M 0 22 Q 60 20, 120 18 T 240 22 T 360 20 T 440 16 L 452 24 L 464 12 L 476 24 T 560 18 T 680 20 T 800 22 T 900 18",
              "M 0 20 Q 60 18, 120 20 T 240 20 T 360 18 T 440 14 L 452 26 L 464 10 L 476 22 T 560 20 T 680 18 T 800 20 T 900 20",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
