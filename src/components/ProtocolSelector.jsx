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
import { useRef } from "react";
import Icon from "./Icon";
import { CATS, INTENTS, DIF_LABELS } from "../lib/constants";
import { predictSessionImpact } from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, z } from "../lib/theme";
import { useReducedMotion, useFocusTrap, KEY } from "../lib/a11y";

export default function ProtocolSelector({
  show, onClose, st, isDark, ac, pr, sc, setSc, fl, favs, toggleFav,
  lastProto, smartPick, protoSens, sp, H,
}) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);
  const listRef = useRef(null);

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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: space[3] }}>
              <h3 id="proto-sheet-title" style={{ ...ty.heroHeading(t1), fontSize: font.size.xl, margin: 0 }}>
                Protocolos
              </h3>
              <button
                onClick={onClose}
                aria-label="Cerrar selector de protocolos"
                style={{
                  inlineSize: 32, blockSize: 32, borderRadius: radius.full,
                  border: `1px solid ${bd}`, background: cd,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="x" size={14} color={t2} />
              </button>
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
                    onClick={() => setSc(isActive ? "Protocolo" : i.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      paddingInline: space[4], paddingBlock: space[2],
                      borderRadius: radius.xl,
                      border: isActive ? `2px solid ${i.color}` : `1.5px solid ${bd}`,
                      background: isActive ? withAlpha(i.color, 4) : cd,
                      flexShrink: 0,
                      transition: "all .2s",
                    }}
                  >
                    <Icon name={i.icon} size={14} color={isActive ? i.color : t3} />
                    <span style={ty.caption(isActive ? i.color : t3)}>{i.label}</span>
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
                  onClick={() => setSc(c)}
                  style={{
                    flex: 1,
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
                  isSmart ? "Recomendado por IA" : null,
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
                      onClick={() => sp(p)}
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
                      <div
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
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...ty.title(t1), display: "flex", alignItems: "center", gap: space[1], flexWrap: "wrap" }}>
                          {p.n}
                          {isLast && <span style={ty.badge(t3, isDark ? "#1A1E28" : "#F1F5F9")}>último</span>}
                          {isSmart && <span style={ty.badge(ac, withAlpha(ac, 6))}>IA recomienda</span>}
                        </div>
                        <div style={{ ...ty.caption(t2), marginBlockEnd: 2 }}>{p.sb}</div>
                        <div style={{ ...ty.caption(t3), display: "flex", alignItems: "center", gap: 6 }}>
                          {p.ph.length} fases · {p.d}s ·{" "}
                          <span style={{ color: p.dif === 1 ? "#059669" : p.dif === 2 ? "#D97706" : "#DC2626" }}>
                            {diffLabel}
                          </span>
                          {pred.predictedDelta > 0 && (
                            <span style={{ color: "#059669", fontWeight: font.weight.bold }}>
                              {" "}· +{pred.predictedDelta} est.
                            </span>
                          )}
                        </div>
                      </div>
                      {sens && sens.sessions >= 2 && (
                        <span
                          aria-hidden="true"
                          style={{
                            ...ty.caption(sens.avgDelta > 0 ? "#059669" : "#DC2626"),
                            fontWeight: font.weight.black,
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
