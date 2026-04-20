"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bioSignal, cssVar, font, space } from "@/components/ui/tokens";
import BioglyphLattice from "@/components/brand/BioglyphLattice";

export default function SensoryHero({ T }) {
  const [state, setState] = useState("idle");
  const ctxRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    try { ctxRef.current?.close(); } catch {}
  }, []);

  const trigger = () => {
    if (state === "pulsing") return;
    setState("pulsing");

    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([80, 40, 140, 40, 80]);
      }
    } catch {}

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctxRef.current = ctx;
        const merger = ctx.createChannelMerger(2);
        const gain = ctx.createGain();
        gain.gain.value = 0;
        const left = ctx.createOscillator();
        const right = ctx.createOscillator();
        left.type = "sine"; right.type = "sine";
        left.frequency.value = 200;
        right.frequency.value = 204;
        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);
        merger.connect(gain);
        gain.connect(ctx.destination);
        left.start(); right.start();
        gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.35);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);
        const stopT = setTimeout(() => {
          try { left.stop(); right.stop(); ctx.close(); } catch {}
          if (ctxRef.current === ctx) ctxRef.current = null;
        }, 3300);
        timersRef.current.push(stopT);
      }
    } catch {}

    const doneT = setTimeout(() => setState("done"), 3000);
    timersRef.current.push(doneT);
  };

  const pulsing = state === "pulsing";

  return (
    <section style={{
      position: "relative",
      paddingBlock: "clamp(80px, 14vw, 160px) clamp(56px, 10vw, 120px)",
      paddingInline: space[4],
      textAlign: "center",
      overflow: "hidden",
      background: `
        radial-gradient(ellipse 80% 60% at 50% 120%, color-mix(in srgb, ${bioSignal.phosphorCyan} 22%, transparent), transparent 60%),
        radial-gradient(ellipse 70% 50% at 12% -10%, color-mix(in srgb, ${bioSignal.neuralViolet} 18%, transparent), transparent 65%),
        linear-gradient(160deg, color-mix(in srgb, var(--bi-surface) 92%, #000) 0%, color-mix(in srgb, var(--bi-bg) 98%, #000) 100%)
      `,
      color: cssVar.text,
    }}>
      {/* Layer 1 — drifting neural lattice. Same asset as AuthHero. */}
      <div
        aria-hidden
        className="bi-hero-lattice"
        style={{
          position: "absolute",
          inset: "-8%",
          zIndex: 0,
          opacity: 0.55,
          pointerEvents: "none",
          filter: "saturate(115%) blur(0.2px)",
        }}
      >
        <BioglyphLattice variant="neural" animated height="100%" />
      </div>

      {/* Layer 2 — vignette that darkens edges, lifts the center. */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: `radial-gradient(ellipse 70% 80% at 50% 50%, transparent 0%, transparent 35%, color-mix(in srgb, #000 50%, transparent) 100%)`,
        }}
      />

      {/* Layer 3 — scanline tint for subtle depth (one line-pair per 3px). */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 2px, color-mix(in srgb, #000 8%, transparent) 2px, color-mix(in srgb, #000 8%, transparent) 3px)`,
          mixBlendMode: "overlay",
          opacity: 0.5,
        }}
      />

      {/* Layer 4 — phosphor glow centered on the pulse button. */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        backgroundImage: `radial-gradient(45% 55% at 50% 58%, ${bioSignal.phosphorCyan}22, transparent 70%)`,
      }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 860, marginInline: "auto" }}>
        <div style={{
          fontFamily: cssVar.fontMono, fontSize: font.size.xs,
          color: cssVar.textMuted,
          textTransform: "uppercase", letterSpacing: font.tracking.caps,
          fontWeight: font.weight.bold,
          marginBlockEnd: space[4],
        }}>
          {T.kicker}
        </div>

        <h1 style={{
          fontSize: "clamp(48px, 8vw, 96px)",
          lineHeight: 1.02,
          letterSpacing: "-0.045em",
          fontWeight: font.weight.black,
          color: cssVar.text,
          margin: 0,
        }}>
          {T.title1}
          <br />
          <span style={{
            background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`,
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>{T.title2}</span>
        </h1>

        <p style={{
          marginBlockStart: space[5],
          fontSize: "clamp(16px, 1.6vw, 20px)",
          lineHeight: 1.5,
          color: cssVar.textDim,
          maxWidth: 580, marginInline: "auto",
        }}>
          {T.sub}
        </p>

        <div style={{
          marginBlockStart: space[8],
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: space[5],
        }}>
          <div style={{ position: "relative", width: 220, height: 220 }}>
            {pulsing && [0, 1, 2].map((i) => (
              <motion.span key={i} aria-hidden
                initial={{ scale: 0.65, opacity: 0.55 }}
                animate={{ scale: 2.3, opacity: 0 }}
                transition={{ duration: 2.4, delay: i * 0.4, ease: "easeOut", repeat: Infinity, repeatDelay: 0 }}
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${bioSignal.phosphorCyan}`,
                }}
              />
            ))}

            <motion.button
              onClick={trigger}
              disabled={pulsing}
              aria-label={T.buttonAria}
              whileHover={!pulsing ? { scale: 1.03 } : {}}
              whileTap={!pulsing ? { scale: 0.97 } : {}}
              animate={pulsing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={pulsing ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
              style={{
                position: "relative", zIndex: 1,
                width: 220, height: 220, borderRadius: "50%",
                border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 42%, transparent)`,
                background: `radial-gradient(circle at 50% 38%, ${bioSignal.phosphorCyan}33, #0a0d14 72%)`,
                color: cssVar.text,
                fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                fontWeight: font.weight.black,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                cursor: pulsing ? "wait" : "pointer",
                boxShadow: `
                  0 24px 70px -20px ${bioSignal.phosphorCyan}66,
                  inset 0 1px 0 0 rgba(255,255,255,0.1)
                `,
              }}
            >
              {pulsing ? T.buttonPulsing : T.buttonIdle}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  fontFamily: cssVar.fontMono, fontSize: 11,
                  color: cssVar.textMuted,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                }}
              >
                {T.hint}
              </motion.div>
            )}
            {state === "done" && (
              <motion.div key="done"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: cssVar.fontMono, fontSize: font.size.sm,
                  color: bioSignal.phosphorCyan,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  fontWeight: font.weight.bold,
                }}
              >
                {T.afterLine}
              </motion.div>
            )}
          </AnimatePresence>

          {T.secondaryCta && T.secondaryHref && (
            <Link
              href={T.secondaryHref}
              style={{
                marginBlockStart: space[1],
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: `10px 18px`,
                borderRadius: 999,
                border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 28%, transparent)`,
                background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 6%, transparent)`,
                color: cssVar.text,
                textDecoration: "none",
                fontFamily: cssVar.fontMono,
                fontSize: 12,
                fontWeight: font.weight.bold,
                textTransform: "uppercase",
                letterSpacing: font.tracking.caps,
              }}
            >
              {T.secondaryCta}
              <span aria-hidden style={{ color: bioSignal.phosphorCyan }}>→</span>
            </Link>
          )}
        </div>

        <svg viewBox="0 0 900 60" preserveAspectRatio="none"
          style={{
            display: "block",
            marginBlockStart: space[7],
            marginInline: "auto",
            width: "min(92vw, 720px)",
            height: 60,
            opacity: 0.75,
          }}
        >
          <defs>
            <linearGradient id="v5-wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
              <stop offset="20%" stopColor={bioSignal.phosphorCyan} stopOpacity="1" />
              <stop offset="80%" stopColor={bioSignal.neuralViolet} stopOpacity="1" />
              <stop offset="100%" stopColor={bioSignal.neuralViolet} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 0 30 Q 50 25, 100 28 T 200 30 T 300 22 T 400 28 T 500 20 T 600 26 T 700 18 T 800 24 T 900 22"
            fill="none"
            stroke="url(#v5-wave)"
            strokeWidth={pulsing ? 2.4 : 1.5}
            strokeLinecap="round"
            animate={{
              d: [
                "M 0 30 Q 50 25, 100 28 T 200 30 T 300 22 T 400 28 T 500 20 T 600 26 T 700 18 T 800 24 T 900 22",
                "M 0 26 Q 50 32, 100 24 T 200 28 T 300 20 T 400 24 T 500 22 T 600 18 T 700 22 T 800 20 T 900 24",
                "M 0 30 Q 50 25, 100 28 T 200 30 T 300 22 T 400 28 T 500 20 T 600 26 T 700 18 T 800 24 T 900 22",
              ],
            }}
            transition={{ duration: pulsing ? 2.2 : 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        {T.chips && T.chips.length > 0 && (
          <motion.ul
            className="bi-authhero-chips"
            role="list"
            aria-label={T.chipsLabel || "Compliance"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ justifyContent: "center", marginBlockStart: space[5] }}
          >
            {T.chips.map((c) => (
              <li key={c}>
                <span className="dot" aria-hidden />
                {c}
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  );
}
