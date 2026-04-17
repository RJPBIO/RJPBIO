"use client";
/* ═══════════════════════════════════════════════════════════════
   HISTORY SHEET — dialog with grouped session log
   ═══════════════════════════════════════════════════════════════ */

import { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

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

function bioQColor(q) {
  if (q >= 70) return semantic.success;
  if (q >= 45) return semantic.warning;
  return semantic.danger;
}

// Sello visible de la sesión — transparencia total sobre calidad
function qualityBadge(quality) {
  switch (quality) {
    case "alta":    return { label: "Plena",    icon: "check",  color: "#059669" };
    case "media":   return { label: "Sólida",   icon: "check",  color: "#0D9488" };
    case "baja":    return { label: "Breve",    icon: "clock",  color: "#D97706" };
    case "ligera":  return { label: "Ligera",   icon: "clock",  color: "#94A3B8" };
    case "inválida":return { label: "Revisar",  icon: "alert",  color: "#DC2626" };
    default:        return { label: "Manual",   icon: "edit",   color: "#64748B" };
  }
}

export default function HistorySheet({ show, onClose, st, isDark, ac }) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);
  const { card: cd, border: bd, t1, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const items = [...(st.history || [])].reverse();
  const grouped = groupHist(items);
  const total = items.length;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: z.overlay,
            background: "rgba(15,23,42,.3)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={onClose}
          aria-hidden="true"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
            style={{
              inlineSize: "100%",
              maxInlineSize: 430,
              maxBlockSize: "75vh",
              background: cd,
              borderStartStartRadius: radius["2xl"],
              borderStartEndRadius: radius["2xl"],
              paddingBlock: `${space[5]}px ${space[10]}px`,
              paddingInline: space[5],
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden="true"
              style={{
                inlineSize: 36,
                blockSize: 4,
                background: bd,
                borderRadius: 2,
                margin: `0 auto ${space[5]}px`,
              }}
            />
            <h3 id={titleId} style={{ ...ty.heading(t1), marginBlockEnd: space[4] }}>
              Historial
            </h3>

            {!total && (
              <div style={{ textAlign: "center", paddingBlock: space[10] }}>
                <Icon name="chart" size={30} color={t3} aria-hidden="true" />
                <div style={{ ...ty.body(t3), marginBlockStart: space[2] }}>
                  Sin señal aún. La primera sesión inicia tu registro biométrico.
                </div>
              </div>
            )}

            {Object.entries(grouped).map(([k, gi]) => {
              if (!gi.length) return null;
              const groupLabel = k === "hoy" ? "Hoy" : k === "ayer" ? "Ayer" : "Anteriores";
              return (
                <section key={k} aria-label={`${groupLabel}: ${gi.length} sesiones`}>
                  <h4
                    style={{
                      ...ty.label(t3),
                      marginBlockEnd: space[2],
                      marginBlockStart: space[2.5] || 10,
                    }}
                  >
                    {groupLabel}
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {gi.map((h, i) => {
                      const tm = new Date(h.ts).toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const ml = (st.moodLog || []).find((m) => Math.abs(m.ts - h.ts) < 10000);
                      const moodIcon = ml ? MOODS[(ml.mood || 3) - 1]?.icon || "neutral" : null;
                      const moodLabel = ml ? MOODS[(ml.mood || 3) - 1]?.label || "neutral" : "";
                      const itemAria =
                        `${h.p}, ${tm}` +
                        (h.bioQ ? `, calidad ${h.bioQ}%` : "") +
                        (ml ? `, ánimo ${moodLabel}` : "") +
                        `, +${h.vc} V-Cores`;
                      return (
                        <li
                          key={i}
                          aria-label={itemAria}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: space[2],
                            paddingBlock: space[2],
                            borderBlockEnd: `1px solid ${bd}`,
                          }}
                        >
                          <div
                            aria-hidden="true"
                            style={{
                              inlineSize: 30,
                              blockSize: 30,
                              borderRadius: radius.sm,
                              background: withAlpha(ac, 6),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon name="bolt" size={12} color={ac} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={ty.caption(t1)}>{h.p}</div>
                            <div
                              aria-hidden="true"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                marginBlockStart: 1,
                              }}
                            >
                              <span style={ty.caption(t3)}>{tm}</span>
                              {moodIcon && (
                                <Icon
                                  name={moodIcon}
                                  size={10}
                                  color={MOODS[(ml.mood || 3) - 1]?.color || t3}
                                />
                              )}
                              {h.bioQ && (
                                <span
                                  style={{
                                    ...ty.biometric(bioQColor(h.bioQ), font.size.sm),
                                    fontWeight: font.weight.bold,
                                  }}
                                >
                                  {h.bioQ}%
                                </span>
                              )}
                              {(() => { const b = qualityBadge(h.quality); return (
                                <span
                                  title={`Sello: ${b.label}${h.partial ? " · parcial" : ""}${h.hiddenSec ? ` · ${h.hiddenSec}s en segundo plano` : ""}`}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 2,
                                    marginInlineStart: 4, paddingInline: 6, paddingBlock: 1,
                                    borderRadius: 6, background: withAlpha(b.color, 10),
                                    color: b.color, fontSize: 9, fontWeight: font.weight.bold,
                                    letterSpacing: 0.3, textTransform: "uppercase",
                                  }}
                                >
                                  <Icon name={b.icon} size={8} color={b.color} />
                                  {b.label}
                                </span>
                              ); })()}
                            </div>
                          </div>
                          <div style={{ textAlign: "end" }} aria-hidden="true">
                            <div style={ty.title(ac)}>+{h.vc}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
