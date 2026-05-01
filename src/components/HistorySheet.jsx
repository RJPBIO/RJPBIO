"use client";
/* ═══════════════════════════════════════════════════════════════
   HISTORY SHEET — dialog with grouped session log
   ═══════════════════════════════════════════════════════════════ */

import { useId, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "../lib/easings";
import Icon from "./Icon";
import BioSparkline from "./BioSparkline";
import IllustratedEmpty from "./IllustratedEmpty";
import { MOODS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const numStyle = (color, weight = 700) => ({
  fontFamily: MONO,
  fontWeight: weight,
  color,
  letterSpacing: -0.1,
  fontVariantNumeric: "tabular-nums",
});
const kickerStyle = (color) => ({
  fontSize: 12,
  fontWeight: 600,
  color,
  letterSpacing: -0.05,
  margin: 0,
});

function groupHist(h) {
  const n = new Date();
  const td = n.toDateString();
  // Sprint 80 — DST-safe ayer. setDate respeta días calendáricos
  // (23h en spring-forward, 25h en fall-back) — `Date.now() - 864e5`
  // mete sesiones en grupo equivocado en transiciones DST.
  const _y = new Date(); _y.setDate(_y.getDate() - 1);
  const yd = _y.toDateString();
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

function qualityBadge(quality) {
  switch (quality) {
    case "alta":    return { label: "Plena",    icon: "check",  color: semantic.success };
    case "media":   return { label: "Sólida",   icon: "check",  color: "#0D9488" };
    case "baja":    return { label: "Breve",    icon: "clock",  color: semantic.warning };
    case "ligera":  return { label: "Ligera",   icon: "clock",  color: "#94A3B8" };
    case "inválida":return { label: "Revisar",  icon: "alert",  color: semantic.danger };
    default:        return { label: "Manual",   icon: "edit",   color: "#64748B" };
  }
}

const OLDER_PAGE = 30;

export default function HistorySheet({ show, onClose, st, isDark, ac }) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);
  const { card: cd, border: bd, t1, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const items = useMemo(() => [...(st.history || [])].reverse(), [st.history]);
  const grouped = useMemo(() => groupHist(items), [items]);
  const total = items.length;
  const [olderShown, setOlderShown] = useState(OLDER_PAGE);
  useEffect(() => { if (show) setOlderShown(OLDER_PAGE); }, [show]);
  const trendData = useMemo(
    () => (st.history || [])
      .slice(-14)
      .map((h) => h.bioQ || h.c || 50)
      .filter((n) => typeof n === "number"),
    [st.history],
  );

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
            background: "rgba(8,8,12,.55)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={reduced ? { duration: 0 } : SPRING.smooth}
            style={{
              position: "relative",
              inlineSize: "100%",
              maxInlineSize: 430,
              maxBlockSize: "78dvh",
              // Glass dark + accent corner radial (Menu Strip /perfil canon)
              background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${withAlpha(ac, 14)} 0%, transparent 55%), linear-gradient(180deg, rgba(20,20,28,0.96) 0%, rgba(8,8,12,0.98) 100%)`,
              backdropFilter: "blur(30px) saturate(160%)",
              WebkitBackdropFilter: "blur(30px) saturate(160%)",
              borderStartStartRadius: 24,
              borderStartEndRadius: 24,
              border: `0.5px solid rgba(255,255,255,0.10)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px ${withAlpha(ac, 16)}, 0 -12px 40px rgba(0,0,0,0.45), 0 0 22px ${withAlpha(ac, 10)}`,
              paddingBlock: `${space[5]}px ${space[10]}px`,
              paddingInline: space[5],
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top sheen */}
            <span aria-hidden="true" style={{ position: "absolute", insetBlockStart: 0, insetInlineStart: "20%", insetInlineEnd: "20%", blockSize: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)`, pointerEvents: "none" }} />
            {/* Pull handle premium with glow */}
            <div aria-hidden="true" style={{
              inlineSize: 40, blockSize: 4,
              background: `linear-gradient(90deg, ${withAlpha(ac, 40)} 0%, ${withAlpha(ac, 70)} 50%, ${withAlpha(ac, 40)} 100%)`,
              borderRadius: 99,
              margin: `0 auto ${space[4]}px`,
              boxShadow: `0 0 8px ${withAlpha(ac, 30)}`,
            }} />

            {/* Header — eyebrow + title + close */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space[3], marginBlockEnd: space[4] }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5 }}>
                    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%)`, boxShadow: `0 0 6px ${ac}` }} />
                  </span>
                  <span style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 500,
                    color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
                    textShadow: `0 0 6px ${withAlpha(ac, 50)}`,
                  }}>
                    Historial · {total} sesiones
                  </span>
                </span>
                <h3 id={titleId} style={{
                  fontSize: 26, fontWeight: 300, color: t1,
                  letterSpacing: -0.6, lineHeight: 1.05, margin: 0,
                }}>
                  Trayectoria neural
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar historial"
                style={{
                  inlineSize: 38, blockSize: 38,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(180deg, ${withAlpha(ac, 14)} 0%, ${withAlpha(ac, 4)} 100%)`,
                  border: `0.5px solid ${withAlpha(ac, 35)}`,
                  borderRadius: "50%",
                  color: ac,
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13">
                  <path d="M3 3 L10 10 M10 3 L3 10" stroke={ac} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Trend bar — Señal sparkline (glass + accent ring) */}
            {trendData.length >= 3 && (
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10,
                  paddingBlock: 12, paddingInline: 14,
                  marginBlockEnd: space[4],
                  borderRadius: 16,
                  background: `radial-gradient(ellipse 60% 100% at 100% 50%, ${withAlpha(bioQColor(trendData[trendData.length - 1]), 16)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`,
                  border: `0.5px solid ${withAlpha(bioQColor(trendData[trendData.length - 1]), 22)}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(bioQColor(trendData[trendData.length - 1]), 14)}, 0 4px 14px rgba(0,0,0,0.24)`,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 8.5, fontWeight: 500,
                    color: bioQColor(trendData[trendData.length - 1]),
                    letterSpacing: "0.24em", textTransform: "uppercase",
                    textShadow: `0 0 5px ${withAlpha(bioQColor(trendData[trendData.length - 1]), 50)}`,
                  }}>
                    Señal · {trendData.length} sesiones
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 22, fontWeight: 250,
                      color: t1,
                      letterSpacing: -0.5, fontVariantNumeric: "tabular-nums",
                      textShadow: `0 0 10px ${withAlpha(bioQColor(trendData[trendData.length - 1]), 35)}`,
                    }}>
                      {trendData[trendData.length - 1]}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: t3 }}>%</span>
                  </div>
                </div>
                <BioSparkline
                  data={trendData}
                  width={150}
                  height={32}
                  color={bioQColor(trendData[trendData.length - 1])}
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
                  {/* Group label — mono caps tracked + accent line */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    marginBlockStart: space[3], marginBlockEnd: space[2],
                  }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 8.5, fontWeight: 500,
                      color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
                      textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
                    }}>
                      {groupLabel}
                    </span>
                    {isOlder && gi.length > OLDER_PAGE && (
                      <span style={{
                        fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: t3,
                        letterSpacing: "0.10em", fontVariantNumeric: "tabular-nums",
                      }}>
                        · {visible.length}/{gi.length}
                      </span>
                    )}
                    <span aria-hidden="true" style={{
                      flex: 1, blockSize: 1,
                      background: `linear-gradient(90deg, ${withAlpha(ac, 30)} 0%, ${withAlpha(ac, 5)} 70%, transparent 100%)`,
                    }} />
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {visible.map((h, i) => {
                      const tm = new Date(h.ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
                      const ml = (st.moodLog || []).find((m) => Math.abs(m.ts - h.ts) < 10000);
                      const moodIcon = ml ? MOODS[(ml.mood || 3) - 1]?.icon || "neutral" : null;
                      const moodLabel = ml ? MOODS[(ml.mood || 3) - 1]?.label || "neutral" : "";
                      const moodColor = ml ? (MOODS[(ml.mood || 3) - 1]?.color || t3) : t3;
                      const itemAria = `${h.p}, ${tm}` + (h.bioQ ? `, calidad ${h.bioQ}%` : "") + (ml ? `, ánimo ${moodLabel}` : "") + `, +${h.vc} V-Cores`;
                      const qcolor = h.bioQ ? bioQColor(h.bioQ) : ac;
                      return (
                        <li
                          key={i}
                          aria-label={itemAria}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            paddingBlock: 10, paddingInline: 12,
                            background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${withAlpha(qcolor, 10)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.08) 100%)`,
                            border: `0.5px solid rgba(255,255,255,0.06)`,
                            borderRadius: 12,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 0.5px ${withAlpha(qcolor, 12)}`,
                          }}
                        >
                          {/* IconTile mini squircle (consistente con dashboard) */}
                          <span aria-hidden="true" style={{
                            position: "relative",
                            flexShrink: 0,
                            inlineSize: 32, blockSize: 32,
                            borderRadius: 9,
                            background: `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 50%), linear-gradient(145deg, ${withAlpha(qcolor, 32)} 0%, ${withAlpha(qcolor, 10)} 100%)`,
                            border: `0.5px solid ${withAlpha(qcolor, 50)}`,
                            boxShadow: `inset 0 1.2px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 10px ${withAlpha(qcolor, 28)}`,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden",
                          }}>
                            <span aria-hidden="true" style={{ position: "absolute", insetBlockStart: 0, insetInlineStart: "14%", insetInlineEnd: "14%", blockSize: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)` }} />
                            <Icon name="bolt" size={14} color={qcolor} />
                          </span>
                          {/* Identity stack */}
                          <div style={{ flex: 1, minInlineSize: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: t1, letterSpacing: -0.2, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {h.p}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBlockStart: 3, flexWrap: "wrap" }}>
                              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: t3, letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>{tm}</span>
                              {moodIcon && (
                                <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", filter: `drop-shadow(0 0 4px ${withAlpha(moodColor, 50)})` }}>
                                  <Icon name={moodIcon} size={11} color={moodColor} />
                                </span>
                              )}
                              {h.bioQ && (
                                <span style={{
                                  fontFamily: MONO, fontSize: 9.5, fontWeight: 500,
                                  color: qcolor, letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums",
                                  textShadow: `0 0 5px ${withAlpha(qcolor, 50)}`,
                                }}>
                                  {h.bioQ}%
                                </span>
                              )}
                              {(() => { const b = qualityBadge(h.quality); return (
                                <span
                                  title={`Sello: ${b.label}${h.partial ? " · parcial" : ""}${h.hiddenSec ? ` · ${h.hiddenSec}s en segundo plano` : ""}`}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                    paddingInline: 6, paddingBlock: 1.5,
                                    borderRadius: 99,
                                    background: withAlpha(b.color, 12),
                                    border: `0.5px solid ${withAlpha(b.color, 28)}`,
                                    color: b.color,
                                    fontFamily: MONO, fontSize: 8, fontWeight: 500,
                                    letterSpacing: "0.10em", textTransform: "uppercase",
                                    textShadow: `0 0 4px ${withAlpha(b.color, 40)}`,
                                  }}
                                >
                                  {b.label}
                                </span>
                              ); })()}
                            </div>
                          </div>
                          {/* V-Cores reward */}
                          <div style={{ textAlign: "end", flexShrink: 0 }} aria-hidden="true">
                            <span style={{
                              fontFamily: MONO, fontSize: 14, fontWeight: 500,
                              color: ac, letterSpacing: -0.2, fontVariantNumeric: "tabular-nums",
                              textShadow: `0 0 6px ${withAlpha(ac, 50)}`,
                            }}>
                              +{h.vc}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {isOlder && hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setOlderShown((n) => n + OLDER_PAGE)}
                      aria-label={`Cargar ${Math.min(OLDER_PAGE, hiddenCount)} sesiones más`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        inlineSize: "100%",
                        marginBlockStart: space[2],
                        marginBlockEnd: space[3],
                        paddingBlock: 12, paddingInline: 14,
                        borderRadius: 14,
                        background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${withAlpha(ac, 12)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
                        border: `0.5px solid ${withAlpha(ac, 30)}`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(ac, 14)}, 0 4px 14px rgba(0,0,0,0.24)`,
                        cursor: "pointer",
                        fontFamily: MONO,
                        fontSize: 9, fontWeight: 500,
                        color: ac,
                        letterSpacing: "0.20em", textTransform: "uppercase",
                        textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
                        minBlockSize: 44,
                      }}
                    >
                      Ver <span style={{ fontVariantNumeric: "tabular-nums", color: t1 }}>{Math.min(OLDER_PAGE, hiddenCount)}</span> más
                      <span style={{ color: t3, fontWeight: 400 }}>· {hiddenCount} restantes</span>
                      <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                        <path d="M1.5 3.5 L5.5 7.5 L9.5 3.5" stroke={ac} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
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
