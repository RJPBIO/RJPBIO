"use client";
/* ═══════════════════════════════════════════════════════════════
   HISTORY SHEET — dialog with grouped session log
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import BioSparkline from "./BioSparkline";
import IllustratedEmpty from "./IllustratedEmpty";
import { MOODS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z, bioSignal } from "../lib/theme";
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

const OLDER_PAGE = 30;

export default function HistorySheet({ show, onClose, st, isDark, ac }) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);
  const { card: cd, border: bd, t1, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const items = [...(st.history || [])].reverse();
  const grouped = groupHist(items);
  const total = items.length;
  const [olderShown, setOlderShown] = useState(OLDER_PAGE);
  useEffect(() => { if (show) setOlderShown(OLDER_PAGE); }, [show]);
  const trendData = (st.history || [])
    .slice(-14)
    .map((h) => h.bioQ || h.c || 50)
    .filter((n) => typeof n === "number");

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
            <h3 id={titleId} style={{ ...ty.heading(t1), marginBlockEnd: space[3] }}>
              Historial
            </h3>

            {trendData.length >= 3 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space[2],
                  paddingBlock: space[2],
                  paddingInline: space[2.5],
                  marginBlockEnd: space[3],
                  borderRadius: radius.md,
                  background: withAlpha(ac, 4),
                  border: `1px solid ${withAlpha(ac, 8)}`,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ ...ty.label(t3), fontSize: 9, letterSpacing: 1.5 }}>
                    Señal · {trendData.length} sesiones
                  </span>
                  <span
                    style={{
                      ...ty.biometric(bioQColor(trendData[trendData.length - 1]), font.size.lg),
                    }}
                  >
                    {trendData[trendData.length - 1]}%
                  </span>
                </div>
                <BioSparkline
                  data={trendData}
                  width={150}
                  height={32}
                  color={bioSignal.phosphorCyan}
                  ariaLabel={`Curva de calidad biométrica últimas ${trendData.length} sesiones`}
                />
              </div>
            )}

            {!total && (
              <IllustratedEmpty
                illustration="history"
                kicker="Registro en blanco"
                title="Sin señal aún."
                body="La primera sesión inicia tu registro biométrico. Cada ignición añade un nodo a tu constelación."
                action={onClose}
                actionLabel="Empezar primera sesión"
                accent={ac}
                textPrimary={t1}
                textMuted={t3}
              />
            )}

            {Object.entries(grouped).map(([k, gi]) => {
              if (!gi.length) return null;
              const groupLabel = k === "hoy" ? "Hoy" : k === "ayer" ? "Ayer" : "Anteriores";
              const isOlder = k === "antes";
              const visible = isOlder ? gi.slice(0, olderShown) : gi;
              const hiddenCount = isOlder ? Math.max(0, gi.length - visible.length) : 0;
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
                    {isOlder && gi.length > OLDER_PAGE && (
                      <span style={{ marginInlineStart: 6, color: t3, fontWeight: font.weight.medium, letterSpacing: 0 }}>
                        · {visible.length}/{gi.length}
                      </span>
                    )}
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {visible.map((h, i) => {
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
                  {isOlder && hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setOlderShown((n) => n + OLDER_PAGE)}
                      style={{
                        display: "block",
                        inlineSize: "100%",
                        marginBlockStart: space[2],
                        marginBlockEnd: space[3],
                        paddingBlock: space[2],
                        paddingInline: space[3],
                        background: withAlpha(ac, 6),
                        border: `1px solid ${withAlpha(ac, 14)}`,
                        borderRadius: radius.sm,
                        color: ac,
                        fontSize: font.size.sm,
                        fontWeight: font.weight.semibold,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        minBlockSize: 36,
                      }}
                      aria-label={`Cargar ${Math.min(OLDER_PAGE, hiddenCount)} sesiones más`}
                    >
                      Ver {Math.min(OLDER_PAGE, hiddenCount)} más · {hiddenCount} restantes
                    </button>
                  )}
                </section>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
