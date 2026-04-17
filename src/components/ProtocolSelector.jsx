"use client";
/* ═══════════════════════════════════════════════════════════════
   PROTOCOL SELECTOR — Clinical list sheet.
   Hairline row entries, no colored backgrounds on cards.
   Selection = teal left edge + label. No gradients. No badges with fills.
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { CATS, INTENTS, DIF_LABELS } from "../lib/constants";
import { predictSessionImpact } from "../lib/neural";
import { resolveTheme, radius, z, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

export default function ProtocolSelector({
  show, onClose, st, isDark, ac, pr, sc, setSc, fl, favs, toggleFav,
  lastProto, smartPick, protoSens, sp, H,
}) {
  const { t1, t2, t3, bg } = resolveTheme(isDark);
  const teal = "#0F766E";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          style={{
            position: "fixed", inset: 0, zIndex: z.overlay,
            background: isDark ? "rgba(12,15,20,.72)" : "rgba(10,14,20,.48)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              width: "100%", maxWidth: 430, maxHeight: "86vh",
              background: bg,
              borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{
              width: 28, height: 2, background: isDark ? "#232836" : "#E5E7EB",
              margin: "12px auto 0",
            }} />

            {/* Header */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: hairline(isDark),
            }}>
              <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Biblioteca</div>
              <div style={{ fontSize: 24, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Protocolos
              </div>
            </div>

            {/* Intent filter — hairline pills */}
            <div style={{
              display: "flex", gap: 0, overflowX: "auto",
              borderBottom: hairline(isDark),
            }}>
              {INTENTS.map(i => {
                const isActive = sc === i.id;
                return (
                  <button
                    key={i.id}
                    onClick={() => setSc(isActive ? "Protocolo" : i.id)}
                    style={{
                      padding: "14px 18px",
                      borderRight: hairline(isDark),
                      background: isActive ? (isDark ? "#1A1E28" : "#F2F4F7") : "transparent",
                      border: "none",
                      cursor: "pointer", flexShrink: 0,
                      color: isActive ? teal : t3,
                      ...CAPS,
                      borderBottom: isActive ? `2px solid ${teal}` : "2px solid transparent",
                    }}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>

            {/* Category tabs — segmented minimal */}
            <div style={{
              display: "flex",
              borderBottom: hairline(isDark),
            }}>
              {CATS.map(c => {
                const isActive = sc === c;
                return (
                  <button
                    key={c}
                    onClick={() => setSc(c)}
                    style={{
                      flex: 1, padding: "14px 8px",
                      background: "transparent", border: "none",
                      borderBottom: isActive ? `2px solid ${teal}` : "2px solid transparent",
                      color: isActive ? t1 : t3,
                      ...CAPS,
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {smartPick && (
              <div style={{
                padding: "14px 20px 6px",
                ...CAPS, color: teal,
              }}>
                IA · Recomendado
              </div>
            )}

            {/* Protocol rows */}
            {[...fl].sort((a, b) => {
              const aS = smartPick?.id === a.id ? 2 : 0;
              const bS = smartPick?.id === b.id ? 2 : 0;
              return (bS + (favs.includes(b.n) ? 1 : 0)) - (aS + (favs.includes(a.n) ? 1 : 0));
            }).map((p, idx, arr) => {
              const isLast = lastProto === p.n;
              const isFav = favs.includes(p.n);
              const isSmart = smartPick?.id === p.id;
              const isSelected = pr.id === p.id;
              const pred = predictSessionImpact(st, p);
              const sens = protoSens[p.n];

              return (
                <button
                  key={p.id}
                  onClick={() => sp(p)}
                  style={{
                    width: "100%", padding: "16px 20px",
                    background: isSelected ? (isDark ? "#1A1E28" : "#F2F4F7") : "transparent",
                    border: "none",
                    borderBottom: idx < arr.length - 1 ? hairline(isDark) : "none",
                    borderLeft: isSelected || isSmart ? `2px solid ${teal}` : "2px solid transparent",
                    cursor: "pointer", textAlign: "left",
                    display: "flex", gap: 16, alignItems: "flex-start",
                    minHeight: 72,
                  }}
                >
                  {/* Tag — letter code, no colored fill */}
                  <div style={{
                    width: 32, height: 32, borderRadius: radius.sm,
                    border: hairline(isDark),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 500, color: t1, letterSpacing: "-0.01em",
                    flexShrink: 0,
                  }}>
                    {p.tg}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Row 1: name + badges */}
                    <div style={{
                      display: "flex", alignItems: "baseline", gap: 8,
                      marginBottom: 4, flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: t1, letterSpacing: "-0.01em" }}>{p.n}</span>
                      {isLast && <span style={{ ...MICRO, color: t3 }}>Último</span>}
                      {isSmart && <span style={{ ...MICRO, color: teal }}>IA</span>}
                    </div>

                    {/* Row 2: subtitle */}
                    <div style={{ fontSize: 13, fontWeight: 400, color: t2, lineHeight: 1.5, marginBottom: 8 }}>
                      {p.sb}
                    </div>

                    {/* Row 3: meta */}
                    <div style={{
                      display: "flex", alignItems: "baseline", gap: 12,
                      ...MICRO, color: t3,
                    }}>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.ph.length} fases</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.d}s</span>
                      <span style={{ color: p.dif === 1 ? teal : p.dif === 2 ? semantic.warning : semantic.danger }}>
                        {DIF_LABELS[(p.dif || 1) - 1]}
                      </span>
                      {pred.predictedDelta > 0 && (
                        <span style={{ color: teal, fontVariantNumeric: "tabular-nums" }}>
                          +{pred.predictedDelta} est.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: delta + fav */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {sens && sens.sessions >= 2 && (
                      <span style={{
                        fontSize: 16, fontWeight: 300,
                        color: sens.avgDelta > 0 ? teal : semantic.danger,
                        letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
                      }}>
                        {sens.avgDelta > 0 ? "+" : ""}{sens.avgDelta}
                      </span>
                    )}
                    <div
                      onClick={e => { e.stopPropagation(); toggleFav(p.n); H && H("tap"); }}
                      style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isFav ? teal : t3,
                        padding: "2px 4px",
                      }}
                    >
                      {isFav ? "★ Fav" : "☆"}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
