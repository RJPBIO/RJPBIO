"use client";
import { motion } from "framer-motion";
import { bioSignal, cssVar, font, space, radius } from "@/components/ui/tokens";

const DAYS = [
  { d: "L", strain: 12.4, recovery: 72, phase: "enfoque" },
  { d: "M", strain: 14.8, recovery: 68, phase: "energia" },
  { d: "M", strain: 8.2,  recovery: 81, phase: "calma" },
  { d: "J", strain: 16.1, recovery: 54, phase: "energia" },
  { d: "V", strain: 11.3, recovery: 77, phase: "enfoque" },
  { d: "S", strain: 6.7,  recovery: 88, phase: "reset" },
  { d: "D", strain: 9.1,  recovery: 84, phase: "calma" },
];

const phaseColor = {
  enfoque: bioSignal.neuralViolet,
  energia: bioSignal.plasmaPink,
  calma: bioSignal.phosphorCyan,
  reset: bioSignal.ignition,
};

const MAX_STRAIN = 21;

export default function StrainJournal({ T }) {
  return (
    <div style={{
      padding: space[6],
      borderRadius: radius.lg,
      background: bioSignal.deepField,
      border: `1px solid ${cssVar.border}`,
      boxShadow: `0 30px 80px -40px ${bioSignal.phosphorCyan}40`,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBlockEnd: space[5],
      }}>
        <div>
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: cssVar.textMuted,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold,
          }}>
            {T.journalWeek}
          </div>
          <div style={{
            fontSize: font.size["3xl"],
            fontFamily: cssVar.fontMono,
            fontWeight: font.weight.black,
            color: cssVar.text,
            letterSpacing: "-0.03em",
            marginBlockStart: space[1],
          }}>
            11.3<span style={{ color: cssVar.textDim, fontSize: font.size.lg }}> / 21</span>
          </div>
          <div style={{
            fontFamily: cssVar.fontMono, fontSize: font.size.xs,
            color: cssVar.textDim,
            textTransform: "uppercase", letterSpacing: font.tracking.caps,
          }}>
            {T.journalAvg}
          </div>
        </div>
        <div style={{
          display: "flex", gap: space[3],
          flexWrap: "wrap", justifyContent: "flex-end",
        }}>
          {Object.entries(phaseColor).map(([k, c]) => (
            <span key={k} style={{
              display: "inline-flex", alignItems: "center", gap: space[1],
              fontFamily: cssVar.fontMono, fontSize: 10,
              color: cssVar.textDim,
              textTransform: "uppercase", letterSpacing: font.tracking.caps,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: c,
                boxShadow: `0 0 8px ${c}`,
              }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${DAYS.length}, 1fr)`,
        gap: space[2],
        height: 220,
        alignItems: "end",
        marginBlockEnd: space[3],
      }}>
        {DAYS.map((day, i) => {
          const hPct = (day.strain / MAX_STRAIN) * 100;
          const recPct = day.recovery;
          const color = phaseColor[day.phase];
          return (
            <div key={i} style={{
              display: "flex", flexDirection: "column",
              alignItems: "stretch",
              height: "100%",
              justifyContent: "flex-end",
              gap: space[1],
            }}>
              {/* Recovery dot */}
              <div style={{
                display: "flex", justifyContent: "center",
                marginBlockEnd: space[1],
              }}>
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                  style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: recPct >= 67 ? bioSignal.phosphorCyan : recPct >= 34 ? bioSignal.signalAmber : bioSignal.plasmaRed,
                    boxShadow: `0 0 8px ${recPct >= 67 ? bioSignal.phosphorCyan : recPct >= 34 ? bioSignal.signalAmber : bioSignal.plasmaRed}`,
                  }}
                />
              </div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${hPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: `linear-gradient(180deg, ${color}, ${color}66)`,
                  borderRadius: 4,
                  boxShadow: `0 0 16px ${color}40`,
                  minHeight: 12,
                }}
              />
              <div style={{
                textAlign: "center",
                fontFamily: cssVar.fontMono, fontSize: font.size.xs,
                fontWeight: font.weight.bold,
                color: cssVar.text,
                marginBlockStart: space[1],
              }}>
                {day.strain.toFixed(1)}
              </div>
              <div style={{
                textAlign: "center",
                fontFamily: cssVar.fontMono, fontSize: 10,
                color: cssVar.textMuted,
                textTransform: "uppercase",
                letterSpacing: font.tracking.caps,
              }}>
                {day.d}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        paddingBlockStart: space[3],
        borderBlockStart: `1px solid ${cssVar.border}`,
        display: "flex", justifyContent: "space-between",
        fontFamily: cssVar.fontMono, fontSize: 10,
        color: cssVar.textMuted,
        textTransform: "uppercase", letterSpacing: font.tracking.caps,
      }}>
        <span>● {T.journalBar}</span>
        <span>○ {T.journalDot}</span>
      </div>
    </div>
  );
}
