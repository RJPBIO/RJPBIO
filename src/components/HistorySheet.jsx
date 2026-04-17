"use client";
/* ═══════════════════════════════════════════════════════════════
   HISTORY SHEET — Clinical session log.
   Group headers as 0.12em caps. Hairline rows. Tabular numerals.
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { MOODS } from "../lib/constants";
import { resolveTheme, radius, z, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

function groupHist(h) {
  const n = new Date();
  const td = n.toDateString();
  const yd = new Date(Date.now() - 864e5).toDateString();
  const g = { hoy: [], ayer: [], antes: [] };
  for (const x of h) {
    const d = new Date(x.ts).toDateString();
    if (d === td) g.hoy.push(x);
    else if (d === yd) g.ayer.push(x);
    else g.antes.push(x);
  }
  return g;
}

export default function HistorySheet({ show, onClose, st, isDark, ac }) {
  const { t1, t2, t3, bg } = resolveTheme(isDark);
  const teal = "#0F766E";

  const hist = [...(st.history || [])].reverse();
  const g = groupHist(hist);

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
              width: "100%", maxWidth: 430, maxHeight: "82vh",
              background: bg,
              borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 28, height: 2, background: isDark ? "#232836" : "#E5E7EB",
              margin: "12px auto 0",
            }} />

            {/* Header */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: hairline(isDark),
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Registros</div>
                <div style={{ fontSize: 24, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Historial
                </div>
              </div>
              <div style={{ ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>
                {hist.length} total
              </div>
            </div>

            {!hist.length && (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: t2, lineHeight: 1.6 }}>
                  Sin registros. Tu primera sesión aparecerá aquí.
                </div>
              </div>
            )}

            {Object.entries(g).map(([k, items]) => {
              if (!items.length) return null;
              return (
                <div key={k}>
                  <div style={{
                    padding: "18px 20px 10px",
                    ...CAPS, color: t3,
                    borderBottom: hairline(isDark),
                    background: isDark ? "#0F131A" : "#F2F4F7",
                  }}>
                    {k === "hoy" ? "Hoy" : k === "ayer" ? "Ayer" : "Anteriores"}
                    <span style={{ marginLeft: 10, fontSize: 9, color: t3, fontVariantNumeric: "tabular-nums" }}>
                      · {items.length}
                    </span>
                  </div>
                  {items.map((h, i) => {
                    const tm = new Date(h.ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
                    const ml = (st.moodLog || []).find(m => Math.abs(m.ts - h.ts) < 10000);
                    const mood = ml ? MOODS[(ml.mood || 3) - 1] : null;
                    const qColor = h.bioQ >= 70 ? teal : h.bioQ >= 45 ? semantic.warning : semantic.danger;

                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14,
                        padding: "16px 20px",
                        borderBottom: hairline(isDark),
                        minHeight: 72,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 500, color: t1,
                            letterSpacing: "-0.01em", marginBottom: 6,
                          }}>
                            {h.p}
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 10, ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>
                            <span>{tm}</span>
                            {mood && <span style={{ color: mood.color }}>{mood.label || mood.l || ""}</span>}
                            {h.bioQ !== undefined && (
                              <span style={{ color: qColor }}>Q {h.bioQ}%</span>
                            )}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 18, fontWeight: 300, color: teal,
                          letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
                          flexShrink: 0,
                        }}>
                          +{h.vc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
