"use client";
import { motion } from "framer-motion";
import { bioSignal, cssVar, font, space } from "@/components/ui/tokens";

export default function PerformanceRing({
  value = 78,
  label = "READINESS",
  sub = "NEURAL RECOVERY",
  size = 280,
  color,
  delay = 0,
}) {
  const stroke = size * 0.08;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const ringColor = color || (
    value >= 67 ? bioSignal.phosphorCyan :
    value >= 34 ? bioSignal.signalAmber :
    bioSignal.plasmaRed
  );

  return (
    <div style={{
      position: "relative",
      width: size, height: size,
      display: "grid", placeItems: "center",
    }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <filter id={`ring-glow-${size}-${delay}`}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={cssVar.border}
          strokeWidth={stroke}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
          filter={`url(#ring-glow-${size}-${delay})`}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke * 0.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <div style={{
        position: "absolute",
        inset: 0,
        display: "grid", placeItems: "center",
        textAlign: "center",
      }}>
        <div>
          <div style={{
            fontSize: Math.round(size * 0.04),
            fontFamily: cssVar.fontMono,
            color: cssVar.textMuted,
            textTransform: "uppercase",
            letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold,
          }}>
            {label}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: delay + 0.4 }}
            style={{
              fontSize: Math.round(size * 0.32),
              lineHeight: 1,
              fontWeight: font.weight.black,
              fontFamily: cssVar.fontMono,
              color: ringColor,
              letterSpacing: "-0.04em",
              marginBlock: Math.round(size * 0.02),
              textShadow: `0 0 24px ${ringColor}80`,
            }}
          >
            {value}
            <span style={{
              fontSize: Math.round(size * 0.1),
              color: cssVar.textDim,
              marginInlineStart: 4,
            }}>%</span>
          </motion.div>
          <div style={{
            fontSize: Math.round(size * 0.04),
            fontFamily: cssVar.fontMono,
            color: cssVar.textDim,
            textTransform: "uppercase",
            letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold,
          }}>
            {sub}
          </div>
        </div>
      </div>
    </div>
  );
}
