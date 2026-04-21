"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";

const WAVE_W = 520;
const WAVE_H = 120;

function buildHrvPath(seed = 0) {
  const pts = [];
  const N = 180;
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * WAVE_W;
    const t = i * 0.12 + seed;
    const base = Math.sin(t) * 12 + Math.sin(t * 0.41) * 8 + Math.sin(t * 2.3) * 4;
    const spike = i % 18 === 0 ? -28 : 0;
    const y = WAVE_H / 2 + base + spike;
    pts.push([x, y]);
  }
  return pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
}

export default function LiveProtocol({ T }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  const path = useMemo(() => buildHrvPath(0), []);
  const pathShift = useMemo(() => buildHrvPath(3.2), []);

  return (
    <section
      ref={ref}
      aria-labelledby="live-heading"
      style={{
        position: "relative",
        paddingBlock: space[20],
        paddingInline: space[5],
      }}
    >
      <div
        style={{
          maxInlineSize: 1100,
          margin: "0 auto",
          display: "grid",
          gap: space[12],
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{
            fontSize: font.size.sm, color: bioSignal.phosphorCyan,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold, fontFamily: cssVar.fontMono,
            marginBlockEnd: space[3],
          }}>
            {T.liveEyebrow}
          </div>
          <h2
            id="live-heading"
            style={{
              margin: 0,
              fontSize: "clamp(32px, 4.2vw, 52px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontWeight: font.weight.black,
              color: cssVar.text,
            }}
          >
            {T.liveH1}{" "}
            <span style={{
              fontStyle: "italic",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
              color: bioSignal.ghostCyan,
            }}>
              {T.liveH1Em}
            </span>
          </h2>
          <p style={{
            marginBlockStart: space[5],
            fontSize: font.size.lg,
            lineHeight: 1.6,
            color: cssVar.textDim,
          }}>
            {T.liveBody}
          </p>

          <ul style={{
            listStyle: "none", padding: 0, margin: `${space[6]}px 0 0`,
            display: "grid", gap: space[3],
          }}>
            {T.liveBullets.map((b, i) => (
              <li key={i} style={{
                display: "grid", gridTemplateColumns: "auto 1fr", gap: space[3],
                alignItems: "baseline",
              }}>
                <span aria-hidden style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: bioSignal.phosphorCyan,
                  boxShadow: `0 0 10px ${bioSignal.phosphorCyan}`,
                  transform: "translateY(-2px)",
                }} />
                <span style={{ color: cssVar.text, fontSize: font.size.md, lineHeight: 1.6 }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instrument panel */}
        <div
          style={{
            position: "relative",
            padding: space[6],
            borderRadius: radius["2xl"],
            background: "color-mix(in srgb, var(--bi-surface) 88%, transparent)",
            border: `1px solid ${cssVar.border}`,
            backdropFilter: "blur(14px)",
            boxShadow: `0 30px 80px -40px ${bioSignal.phosphorCyan}40`,
            overflow: "hidden",
          }}
        >
          {/* HUD header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBlockEnd: space[4],
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            color: cssVar.textMuted,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}>
              <motion.span
                aria-hidden
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: bioSignal.phosphorCyan,
                  boxShadow: `0 0 10px ${bioSignal.phosphorCyan}`,
                }}
              />
              {T.hudLive}
            </span>
            <span>{T.hudSession}</span>
          </div>

          {/* HRV waveform */}
          <div style={{
            position: "relative",
            padding: space[3],
            borderRadius: radius.md,
            background: bioSignal.deepField,
            border: `1px solid ${cssVar.border}`,
            marginBlockEnd: space[4],
            overflow: "hidden",
          }}>
            <div style={{
              fontFamily: cssVar.fontMono, fontSize: 10,
              color: cssVar.textMuted, textTransform: "uppercase",
              letterSpacing: font.tracking.caps,
              marginBlockEnd: space[1],
            }}>
              {T.hrvLabel}
            </div>
            <svg viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} width="100%" height={WAVE_H} style={{ display: "block" }}>
              <defs>
                <linearGradient id="hrv-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
                  <stop offset="10%" stopColor={bioSignal.phosphorCyan} stopOpacity="1" />
                  <stop offset="100%" stopColor={bioSignal.neuralViolet} stopOpacity="1" />
                </linearGradient>
                <filter id="hrv-glow">
                  <feGaussianBlur stdDeviation="2" />
                </filter>
              </defs>

              {/* gridlines */}
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g}
                  x1="0" x2={WAVE_W}
                  y1={WAVE_H * g} y2={WAVE_H * g}
                  stroke={cssVar.border} strokeDasharray="2 6" strokeWidth="0.5"
                />
              ))}

              <motion.path
                d={path}
                fill="none"
                stroke="url(#hrv-grad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                filter="url(#hrv-glow)"
                animate={{ d: [path, pathShift, path] }}
                transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d={path}
                fill="none"
                stroke="url(#hrv-grad)"
                strokeWidth="1.2"
                strokeLinecap="round"
                animate={{ d: [path, pathShift, path] }}
                transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>
          </div>

          {/* Metric grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: space[3],
          }}>
            {T.metrics.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
                style={{
                  padding: space[3],
                  borderRadius: radius.md,
                  background: cssVar.surface2,
                  border: `1px solid ${cssVar.border}`,
                }}
              >
                <div style={{
                  fontSize: 10, color: cssVar.textMuted,
                  textTransform: "uppercase", letterSpacing: font.tracking.caps,
                  fontFamily: cssVar.fontMono,
                }}>
                  {m.label}
                </div>
                <div style={{
                  marginBlockStart: space[1],
                  fontSize: font.size["2xl"],
                  fontWeight: font.weight.black,
                  color: m.color || cssVar.text,
                  fontFamily: cssVar.fontMono,
                  letterSpacing: "-0.02em",
                }}>
                  {m.value}
                </div>
                <div style={{
                  fontSize: 10, color: cssVar.textDim,
                  fontFamily: cssVar.fontMono,
                }}>
                  {m.unit}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Breath ring */}
          <div style={{
            marginBlockStart: space[5],
            display: "flex", alignItems: "center",
            gap: space[4],
            padding: space[3],
            borderRadius: radius.md,
            background: cssVar.surface2,
            border: `1px solid ${cssVar.border}`,
          }}>
            <motion.div
              aria-hidden
              animate={{ scale: [1, 1.35, 1.35, 1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 0.55, 0.85, 1] }}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `radial-gradient(closest-side, ${bioSignal.phosphorCyan}80, transparent 70%)`,
                border: `2px solid ${bioSignal.phosphorCyan}`,
                boxShadow: `0 0 20px ${bioSignal.phosphorCyan}80`,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{
                fontSize: font.size.xs, color: cssVar.textMuted,
                textTransform: "uppercase", letterSpacing: font.tracking.caps,
                fontFamily: cssVar.fontMono,
              }}>
                {T.breathLabel}
              </div>
              <div style={{
                fontSize: font.size.md, color: cssVar.text,
                fontWeight: font.weight.semibold,
                marginBlockStart: space[1],
              }}>
                {T.breathValue}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
