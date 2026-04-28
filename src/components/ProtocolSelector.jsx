"use client";
/* ═══════════════════════════════════════════════════════════════
   PROTOCOL SELECTOR — Sheet modal accesible
   ═══════════════════════════════════════════════════════════════
   - role="dialog" aria-modal con focus trap + Escape cierre.
   - Arrow-key navigation entre items de la lista.
   - Favorito como <button role="switch" aria-pressed>.
   - Backdrop con aria-hidden y clic para cerrar también.
   - Reduced-motion: sin spring en el sheet.
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect } from "react";
import Icon from "./Icon";
import EvidenceBadge from "./EvidenceBadge";
import { CATS, INTENTS, DIF_LABELS } from "../lib/constants";
import { protocolDisplayName, protocolDisplaySubtitle } from "../lib/localize";
import { useT } from "../hooks/useT";
import { predictSessionImpact } from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, z, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap, KEY } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const numStyle = (color, weight = 700) => ({
  fontFamily: MONO,
  fontWeight: weight,
  color,
  letterSpacing: -0.1,
  fontVariantNumeric: "tabular-nums",
});

export default function ProtocolSelector({
  show, onClose, st, isDark, ac, pr, sc, setSc, fl, favs, toggleFav,
  lastProto, smartPick, protoSens, sp, H,
}) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const { locale } = useT();
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);
  const listRef = useRef(null);

  useEffect(() => {
    if (!show || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [show]);

  const sortedProtocols = [...fl].sort(
    (a, b) => (favs.includes(b.n) ? 1 : 0) - (favs.includes(a.n) ? 1 : 0)
  );

  const onListKeyDown = (e) => {
    if (![KEY.UP, KEY.DOWN, KEY.HOME, KEY.END].includes(e.key)) return;
    e.preventDefault();
    const items = Array.from(listRef.current?.querySelectorAll("[data-proto-item]") || []);
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement);
    let nextIdx = idx;
    if (e.key === KEY.DOWN) nextIdx = idx < items.length - 1 ? idx + 1 : 0;
    if (e.key === KEY.UP) nextIdx = idx > 0 ? idx - 1 : items.length - 1;
    if (e.key === KEY.HOME) nextIdx = 0;
    if (e.key === KEY.END) nextIdx = items.length - 1;
    items[nextIdx]?.focus();
  };

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
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
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
            aria-labelledby="proto-sheet-title"
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
            style={{
              inlineSize: "100%",
              maxInlineSize: 430,
              maxBlockSize: "82vh",
              background: cd,
              borderStartStartRadius: radius["2xl"],
              borderStartEndRadius: radius["2xl"],
              paddingInline: space[5],
              paddingBlockStart: space[5],
              paddingBlockEnd: space[10],
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div aria-hidden="true" style={{ inlineSize: 36, blockSize: 4, background: bd, borderRadius: 2, marginInline: "auto", marginBlockEnd: space[4] }} />
            <div style={{ marginBlockEnd: space[3] }}>
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBlockEnd: 6,
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: font.weight.bold,
                  letterSpacing: font.tracking.caps,
                  textTransform: "uppercase",
                  color: withAlpha(brand.primary, 70),
                }}
              >
                <span
                  style={{
                    inlineSize: 4,
                    blockSize: 4,
                    borderRadius: "50%",
                    background: brand.primary,
                    boxShadow: `0 0 6px ${withAlpha(brand.primary, 80)}`,
                  }}
                />
                <span>Instrumentos neurales</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: space[2] }}>
                <div style={{ flex: 1, minInlineSize: 0 }}>
                  <h3 id="proto-sheet-title" style={{ ...ty.heroHeading(t1), fontSize: font.size.xl, margin: 0 }}>
                    Protocolos
                  </h3>
                  <div
                    style={{
                      marginBlockStart: 2,
                      fontSize: 11,
                      color: t3,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ ...numStyle(t2, 700), fontSize: 12 }}>{fl.length}</span>
                    <span>protocolos</span>
                    <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
                    <span>filtra por intención</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar selector de protocolos"
                  style={{
                    inlineSize: 44, blockSize: 44, borderRadius: radius.full,
                    border: `1px solid ${bd}`, background: cd,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="x" size={16} color={t2} />
                </button>
              </div>
            </div>

            <div
              role="radiogroup"
              aria-label="Filtrar por intención"
              style={{ display: "flex", gap: 6, marginBlockEnd: 12, overflowX: "auto", paddingBlockEnd: 4 }}
            >
              {INTENTS.map((i) => {
                const isActive = sc === i.id;
                return (
                  <motion.button
                    key={i.id}
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`Intención: ${i.label}`}
                    whileTap={reduced ? {} : { scale: 0.93 }}
                    onClick={() => { H?.("tap"); setSc(isActive ? "Protocolo" : i.id); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      minBlockSize: 36,
                      paddingInline: space[4], paddingBlock: space[2],
                      borderRadius: radius.xl,
                      border: isActive
                        ? `1.5px solid ${withAlpha(i.color, 55)}`
                        : `1px solid ${bd}`,
                      background: isActive ? withAlpha(i.color, 10) : cd,
                      flexShrink: 0,
                      transition: "all .2s",
                      boxShadow: isActive ? `0 0 0 3px ${withAlpha(i.color, 8)}` : "none",
                    }}
                  >
                    <Icon
                      name={i.icon}
                      size={14}
                      color={isActive ? i.color : withAlpha(i.color, 55)}
                    />
                    <span
                      style={{
                        ...ty.caption(isActive ? i.color : t2),
                        fontWeight: isActive ? font.weight.bold : font.weight.semibold,
                      }}
                    >
                      {i.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div
              role="tablist"
              aria-label="Filtrar por categoría"
              style={{
                display: "flex",
                background: isDark ? "#1A1E28" : "#EEF2F7",
                borderRadius: radius.md,
                padding: 3,
                marginBlockEnd: space[4],
              }}
            >
              {CATS.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={sc === c}
                  onClick={() => { H?.("tap"); setSc(c); }}
                  style={{
                    flex: 1,
                    minBlockSize: 36,
                    paddingBlock: space[2],
                    paddingInline: 0,
                    borderRadius: radius.sm,
                    border: "none",
                    background: sc === c ? cd : "transparent",
                    color: sc === c ? t1 : t3,
                    ...ty.title(sc === c ? t1 : t3),
                    transition: "all .3s",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div
              ref={listRef}
              onKeyDown={onListKeyDown}
              role="list"
              aria-label="Lista de protocolos"
              style={{ display: "flex", flexDirection: "column", gap: space[1] }}
            >
              {sortedProtocols.map((p) => {
                const isLast = lastProto === p.n;
                const isFav = favs.includes(p.n);
                const isSmart = smartPick?.id === p.id;
                const isCurrent = pr.id === p.id;
                const pred = predictSessionImpact(st, p);
                const diffLabel = DIF_LABELS[(p.dif || 1) - 1];
                const sens = protoSens[p.n];
                const ariaDescription = [
                  `${p.sb}`,
                  `${p.ph.length} fases, ${p.d} segundos`,
                  `Dificultad: ${diffLabel}`,
                  isSmart ? "Motor sugiere este protocolo" : null,
                  isLast ? "Última sesión" : null,
                  isCurrent ? "Seleccionado actualmente" : null,
                  pred.predictedDelta > 0 ? `Impacto estimado +${pred.predictedDelta}` : null,
                  sens && sens.sessions >= 2 ? `Sensibilidad promedio ${sens.avgDelta > 0 ? "+" : ""}${sens.avgDelta}` : null,
                ].filter(Boolean).join(". ");

                return (
                  <div
                    key={p.id}
                    role="listitem"
                    style={{ position: "relative", display: "flex", gap: space[2], alignItems: "stretch" }}
                  >
                    <motion.button
                      data-proto-item
                      whileTap={reduced ? {} : { scale: 0.98 }}
                      onClick={() => { H?.("tap"); sp(p); }}
                      aria-label={`${p.n}. ${ariaDescription}`}
                      aria-current={isCurrent ? "true" : undefined}
                      style={{
                        flex: 1,
                        padding: space[3],
                        borderRadius: radius.lg,
                        border: isSmart
                          ? `2px solid ${ac}`
                          : isCurrent
                          ? `2px solid ${p.cl}`
                          : `1.5px solid ${bd}`,
                        background: isSmart
                          ? withAlpha(ac, 2)
                          : isCurrent
                          ? withAlpha(p.cl, 4)
                          : cd,
                        textAlign: "start",
                        display: "flex",
                        gap: space[3],
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          insetInlineStart: 0,
                          insetBlockStart: 0,
                          insetBlockEnd: 0,
                          inlineSize: 3,
                          borderStartEndRadius: 2,
                          borderEndEndRadius: 2,
                          background: p.cl,
                        }}
                      />
                      <motion.div
                        layoutId={reduced ? undefined : `proto-glyph-${p.id}`}
                        transition={{ type: "spring", stiffness: 360, damping: 32 }}
                        aria-hidden="true"
                        style={{
                          inlineSize: 40, blockSize: 40,
                          borderRadius: radius.sm + 3,
                          background: withAlpha(p.cl, 6),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          ...ty.title(p.cl),
                          fontWeight: font.weight.black,
                          flexShrink: 0,
                          marginInlineStart: space[1],
                        }}
                      >
                        {p.tg}
                      </motion.div>
                      <div style={{ flex: 1, minInlineSize: 0 }}>
                        <div style={{ ...ty.title(t1), display: "flex", alignItems: "center", gap: space[1], flexWrap: "wrap" }}>
                          {protocolDisplayName(p, locale)}
                          <EvidenceBadge protocol={p} />
                          {isLast && <span style={ty.badge(t3, isDark ? "#1A1E28" : "#F1F5F9")}>último</span>}
                          {isSmart && (
                            <span
                              aria-label="Recomendado por el motor neural"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontFamily: MONO,
                                fontSize: 9,
                                fontWeight: font.weight.black,
                                letterSpacing: font.tracking.caps,
                                textTransform: "uppercase",
                                color: ac,
                                paddingInline: 7,
                                paddingBlock: 3,
                                borderRadius: radius.full,
                                background: withAlpha(ac, 10),
                                border: `1px solid ${withAlpha(ac, 28)}`,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  inlineSize: 4,
                                  blockSize: 4,
                                  borderRadius: "50%",
                                  background: ac,
                                  boxShadow: `0 0 6px ${withAlpha(ac, 90)}`,
                                }}
                              />
                              Motor sugiere
                            </span>
                          )}
                        </div>
                        <div style={{ ...ty.caption(t2), marginBlockEnd: 2 }}>{protocolDisplaySubtitle(p, locale)}</div>
                        <div style={{ ...ty.caption(t3), display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span><span style={numStyle(t2, 700)}>{p.ph.length}</span> fases</span>
                          <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
                          <span style={numStyle(t2, 700)}>{p.d}s</span>
                          <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span
                              aria-hidden="true"
                              style={{
                                inlineSize: 5,
                                blockSize: 5,
                                borderRadius: "50%",
                                background: p.dif === 1 ? brand.primary : p.dif === 2 ? semantic.warning : semantic.danger,
                              }}
                            />
                            <span style={{ color: t3 }}>{diffLabel}</span>
                          </span>
                          {pred.predictedDelta > 0 && (
                            <>
                              <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
                              <span
                                aria-label={`Mejora estimada de readiness: más ${pred.predictedDelta}`}
                                title="Δ readiness estimado"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 2,
                                  fontFamily: MONO,
                                  fontWeight: font.weight.black,
                                  color: brand.primary,
                                  fontVariantNumeric: "tabular-nums",
                                  letterSpacing: -0.1,
                                  paddingInline: 5,
                                  paddingBlock: 1,
                                  borderRadius: radius.sm,
                                  background: withAlpha(brand.primary, 8),
                                  border: `1px solid ${withAlpha(brand.primary, 22)}`,
                                }}
                              >
                                Δ +{pred.predictedDelta}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {sens && sens.sessions >= 2 && (
                        <span
                          aria-hidden="true"
                          style={{
                            ...numStyle(sens.avgDelta > 0 ? brand.primary : semantic.danger, 800),
                            fontSize: font.size.sm,
                            marginInlineEnd: space[1],
                          }}
                        >
                          {sens.avgDelta > 0 ? "+" : ""}{sens.avgDelta}
                        </span>
                      )}
                      {isCurrent && <Icon name="check" size={16} color={p.cl} />}
                    </motion.button>

                    <button
                      role="switch"
                      aria-checked={isFav}
                      aria-label={isFav ? `Quitar ${p.n} de favoritos` : `Añadir ${p.n} a favoritos`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(p.n);
                        H("tap");
                      }}
                      style={{
                        inlineSize: 44,
                        blockSize: "auto",
                        borderRadius: radius.sm,
                        border: `1px solid ${bd}`,
                        background: cd,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="star" size={16} color={isFav ? ac : bd} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
