"use client";
import { motion } from "framer-motion";
import { bioSignal, cssVar, font, space, radius } from "@/components/ui/tokens";

export default function ShowcaseDevice({ T }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        width: "min(92vw, 980px)",
        aspectRatio: "16 / 10",
        margin: "0 auto",
        borderRadius: 32,
        background: `linear-gradient(180deg, #0a0d14, #141820)`,
        border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 24%, transparent)`,
        boxShadow: `
          0 40px 120px -40px ${bioSignal.phosphorCyan}40,
          0 20px 60px -20px rgba(0,0,0,0.6),
          inset 0 1px 0 0 rgba(255,255,255,0.08)
        `,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Subtle screen glow */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(60% 70% at 50% 0%, ${bioSignal.phosphorCyan}14, transparent 60%)`,
      }} />

      {/* Screen chrome - top bar */}
      <div style={{
        position: "absolute", insetBlockStart: 16, insetInline: 20,
        zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: cssVar.fontMono, fontSize: 11,
        color: cssVar.textMuted,
        textTransform: "uppercase", letterSpacing: font.tracking.caps,
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <motion.span aria-hidden
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: bioSignal.phosphorCyan,
              boxShadow: `0 0 10px ${bioSignal.phosphorCyan}`,
            }}
          />
          {T.deviceLive}
        </span>
        <span>{T.deviceSession}</span>
      </div>

      {/* Central readiness display */}
      <div style={{
        position: "absolute",
        top: "50%", insetInlineStart: "50%",
        translate: "-50% -50%",
        textAlign: "center",
        zIndex: 2,
      }}>
        <div style={{
          fontFamily: cssVar.fontMono, fontSize: 11,
          color: cssVar.textMuted,
          textTransform: "uppercase", letterSpacing: font.tracking.caps,
        }}>
          {T.deviceLabel}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(72px, 12vw, 180px)",
            lineHeight: 0.95,
            fontWeight: font.weight.black,
            letterSpacing: "-0.05em",
            background: `linear-gradient(180deg, #ffffff 0%, ${bioSignal.phosphorCyan} 100%)`,
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBlock: 8,
          }}
        >
          78
        </motion.div>
        <div style={{
          fontFamily: cssVar.fontMono, fontSize: 12,
          color: cssVar.textDim,
          textTransform: "uppercase", letterSpacing: font.tracking.caps,
          fontWeight: font.weight.bold,
        }}>
          {T.deviceReady}
        </div>
      </div>

      {/* HRV waveform */}
      <svg
        viewBox="0 0 900 120"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          insetBlockEnd: 0, insetInline: 0,
          inlineSize: "100%",
          blockSize: "30%",
          zIndex: 1,
          opacity: 0.7,
        }}
      >
        <defs>
          <linearGradient id="v4-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
            <stop offset="15%" stopColor={bioSignal.phosphorCyan} stopOpacity="1" />
            <stop offset="85%" stopColor={bioSignal.neuralViolet} stopOpacity="1" />
            <stop offset="100%" stopColor={bioSignal.neuralViolet} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="v4-wave-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bioSignal.phosphorCyan} stopOpacity="0.3" />
            <stop offset="100%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0 80 Q 50 70, 100 75 T 200 78 T 300 62 T 400 70 T 500 55 T 600 68 T 700 50 T 800 62 T 900 58 L 900 120 L 0 120 Z"
          fill="url(#v4-wave-fill)"
          animate={{
            d: [
              "M 0 80 Q 50 70, 100 75 T 200 78 T 300 62 T 400 70 T 500 55 T 600 68 T 700 50 T 800 62 T 900 58 L 900 120 L 0 120 Z",
              "M 0 70 Q 50 82, 100 68 T 200 72 T 300 58 T 400 65 T 500 60 T 600 52 T 700 62 T 800 55 T 900 64 L 900 120 L 0 120 Z",
              "M 0 80 Q 50 70, 100 75 T 200 78 T 300 62 T 400 70 T 500 55 T 600 68 T 700 50 T 800 62 T 900 58 L 900 120 L 0 120 Z",
            ],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 0 80 Q 50 70, 100 75 T 200 78 T 300 62 T 400 70 T 500 55 T 600 68 T 700 50 T 800 62 T 900 58"
          fill="none"
          stroke="url(#v4-wave)"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            d: [
              "M 0 80 Q 50 70, 100 75 T 200 78 T 300 62 T 400 70 T 500 55 T 600 68 T 700 50 T 800 62 T 900 58",
              "M 0 70 Q 50 82, 100 68 T 200 72 T 300 58 T 400 65 T 500 60 T 600 52 T 700 62 T 800 55 T 900 64",
              "M 0 80 Q 50 70, 100 75 T 200 78 T 300 62 T 400 70 T 500 55 T 600 68 T 700 50 T 800 62 T 900 58",
            ],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Corner chips */}
      <div style={{
        position: "absolute", insetBlockStart: 20, insetInlineEnd: 20,
        zIndex: 2,
      }}>
        <Chip label="HRV" value="72" unit="ms" />
      </div>
      <div style={{
        position: "absolute", insetBlockEnd: 20, insetInlineStart: 20,
        zIndex: 2,
      }}>
        <Chip label={T.deviceBreath} value="5.5" unit="rpm" />
      </div>
    </motion.div>
  );
}

function Chip({ label, value, unit }) {
  return (
    <div style={{
      padding: `${space[2]}px ${space[3]}px`,
      borderRadius: radius.full,
      background: "rgba(0,0,0,0.4)",
      backdropFilter: "blur(10px)",
      border: `1px solid rgba(255,255,255,0.08)`,
      fontFamily: cssVar.fontMono,
      display: "inline-flex", alignItems: "baseline", gap: 6,
    }}>
      <span style={{
        fontSize: 10, color: cssVar.textMuted,
        textTransform: "uppercase", letterSpacing: font.tracking.caps,
        fontWeight: font.weight.bold,
      }}>{label}</span>
      <span style={{
        fontSize: 14, color: bioSignal.phosphorCyan,
        fontWeight: font.weight.black,
      }}>{value}</span>
      <span style={{ fontSize: 10, color: cssVar.textDim }}>{unit}</span>
    </div>
  );
}
