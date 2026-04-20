"use client";
import { motion } from "framer-motion";
import { bioSignal } from "@/components/ui/tokens";

export default function IgnitionReveal({
  children,
  delay = 0,
  spark = true,
  sparkOrigin = "50% 35%",
  className,
  style,
}) {
  const [sx, sy] = sparkOrigin.split(/\s+/);
  return (
    <div className={className} style={{ position: "relative", ...style }}>
      {spark && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scale: 0.18 }}
          whileInView={{ opacity: [0, 0.9, 0], scale: [0.18, 2.4, 3.2] }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.4, delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            insetInlineStart: sx,
            insetBlockStart: sy,
            translate: "-50% -50%",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${bioSignal.phosphorCyan}66 0%, ${bioSignal.phosphorCyan}00 70%)`,
            pointerEvents: "none",
            zIndex: 0,
            mixBlendMode: "screen",
            filter: "blur(2px)",
          }}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 1.0, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
