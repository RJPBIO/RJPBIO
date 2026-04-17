"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS, ENERGY_LEVELS, WORK_TAGS } from "../lib/constants";
import { resolveTheme, withAlpha, font, space, radius, z, semantic } from "../lib/theme";

/* ═══════════════════════════════════════════════════════════════
   POST-SESSION FLOW — Clinical diagnostic presentation
   Not celebration. A lab result.
   What changed, in which dimension, by how much, why it matters.
   ═══════════════════════════════════════════════════════════════ */

export default function PostSessionFlow({
  postStep, ts, ac, isDark,
  pr, durMult, st,
  checkMood, setCheckMood, checkEnergy, setCheckEnergy, checkTag, setCheckTag,
  preMood, postVC, postMsg, moodDiff,
  H, submitCheckin, onSetPostStep, onReset,
}) {
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(10,14,20,0.08)";
  const softHairline = isDark ? "rgba(255,255,255,0.06)" : "rgba(10,14,20,0.06)";

  return (
    <>
      {/* ═══ STEP 1: CHECK-IN ═══ */}
      <AnimatePresence>
        {postStep === "breathe" && ts === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: "fixed", inset: 0, zIndex: z.postSession,
              background: bg,
              display: "flex", alignItems: "flex-start", justifyContent: "center",
              padding: "60px 20px 40px",
              overflowY: "auto",
              fontFamily: font.family,
            }}
          >
            <div style={{ maxWidth: 390, width: "100%" }}>
              {/* Header — clinical */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.24em", color: t3, textTransform: "uppercase", marginBottom: 12 }}>
                  Check-in post-sesión
                </div>
                <div style={{ fontSize: 28, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  ¿Cómo te sientes ahora?
                </div>
                <div style={{ fontSize: 13, fontWeight: 400, color: t3, marginTop: 10, lineHeight: 1.6 }}>
                  {pr.n} · {Math.round(pr.d * durMult)}s
                </div>
              </div>

              {/* Mood check-in */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 12 }}>Estado</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {MOODS.map(m => {
                    const active = checkMood === m.value;
                    return (
                      <button
                        key={m.id}
                        onClick={() => { setCheckMood(m.value); H("tap"); }}
                        style={{
                          flex: 1, height: 52,
                          borderRadius: radius.md,
                          border: active ? `1px solid ${m.color}` : `0.5px solid ${hairline}`,
                          background: active ? withAlpha(m.color, 6) : "transparent",
                          cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                          transition: "all 0.18s ease-out",
                          fontFamily: font.family,
                        }}
                      >
                        <Icon name={m.icon} size={16} color={active ? m.color : t3} />
                        <span style={{ fontSize: 9, fontWeight: 600, color: active ? m.color : t3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 12 }}>Energía</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {ENERGY_LEVELS.map(e => {
                    const active = checkEnergy === e.v;
                    return (
                      <button
                        key={e.id}
                        onClick={() => { setCheckEnergy(e.v); H("tap"); }}
                        style={{
                          flex: 1, padding: "14px 0",
                          borderRadius: radius.md,
                          border: active ? `1px solid ${ac}` : `0.5px solid ${hairline}`,
                          background: active ? withAlpha(ac, 4) : "transparent",
                          color: active ? ac : t2,
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          letterSpacing: "0.04em",
                          cursor: "pointer",
                          transition: "all 0.18s ease-out",
                          fontFamily: font.family,
                        }}
                      >
                        {e.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Context tags */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 12 }}>Contexto</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {WORK_TAGS.map(tg => {
                    const active = checkTag === tg;
                    return (
                      <button
                        key={tg}
                        onClick={() => { setCheckTag(active ? "" : tg); H("tap"); }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: radius.full,
                          border: active ? `1px solid ${ac}` : `0.5px solid ${hairline}`,
                          background: active ? withAlpha(ac, 4) : "transparent",
                          color: active ? ac : t2,
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          letterSpacing: "0.01em",
                          cursor: "pointer",
                          transition: "all 0.18s ease-out",
                          fontFamily: font.family,
                        }}
                      >
                        {tg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={submitCheckin}
                style={{
                  width: "100%", padding: "18px 0",
                  borderRadius: radius.md,
                  background: checkMood > 0 ? ac : "transparent",
                  border: `1px solid ${checkMood > 0 ? ac : hairline}`,
                  color: checkMood > 0 ? "#fff" : t3,
                  fontFamily: font.family,
                  fontSize: 13, fontWeight: 600,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: "pointer", minHeight: 56,
                  transition: "all 0.18s ease-out",
                }}
              >
                {checkMood > 0 ? "Continuar" : "Selecciona un estado"}
              </button>
              <button
                onClick={() => onSetPostStep("summary")}
                style={{
                  width: "100%", padding: "14px 0", marginTop: 8,
                  background: "transparent", border: "none",
                  color: t3,
                  fontSize: 11, fontWeight: 500,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Omitir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ STEP 2: DIAGNOSTIC RESULT ═══ */}
      <AnimatePresence>
        {postStep === "summary" && ts === "done" && (() => {
          const isFirst = st.totalSessions <= 1;
          const isMilestone = [10, 25, 50, 100, 200, 500].includes(st.totalSessions);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: "fixed", inset: 0, zIndex: z.postSession,
                background: bg,
                display: "flex", alignItems: "flex-start", justifyContent: "center",
                padding: "60px 20px 40px",
                overflowY: "auto",
                fontFamily: font.family,
              }}
            >
              <div style={{ maxWidth: 390, width: "100%" }}>
                {/* Clinical header */}
                <div style={{ marginBottom: 40, paddingBottom: 24, borderBottom: `0.5px solid ${softHairline}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.24em", color: t3, textTransform: "uppercase" }}>
                      {isMilestone ? `Sesión ${st.totalSessions}` : isFirst ? "Primera ignición" : "Resultado"}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: t3, letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>
                      {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {pr.n}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: t3, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(pr.d * durMult)}s · {pr.ph.length} fases completadas
                  </div>
                </div>

                {/* Mood delta — diagnostic result */}
                {preMood > 0 && checkMood > 0 && (
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 16 }}>
                      Cambio emocional
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center", padding: "20px 0" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 8 }}>Antes</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name={MOODS[preMood - 1].icon} size={18} color={MOODS[preMood - 1].color} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: t1 }}>{MOODS[preMood - 1].label}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 40, fontWeight: 200, color: moodDiff > 0 ? semantic.success : moodDiff < 0 ? semantic.danger : t3, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                          {moodDiff > 0 ? "+" + moodDiff : moodDiff === 0 ? "0" : moodDiff}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginTop: 6 }}>Δ</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 8 }}>Después</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: t1 }}>{MOODS[checkMood - 1].label}</span>
                          <Icon name={MOODS[checkMood - 1].icon} size={18} color={MOODS[checkMood - 1].color} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinical metrics grid */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 16 }}>
                    Métricas
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: `0.5px solid ${softHairline}`, borderBottom: `0.5px solid ${softHairline}` }}>
                    {[
                      { l: "V-Cores", v: "+" + postVC, c: ac },
                      { l: "Enfoque", v: st.coherencia + "%", c: t1 },
                      { l: "Calma", v: st.resiliencia + "%", c: t1 },
                    ].map((m, i) => (
                      <div key={i} style={{
                        padding: "20px 12px", textAlign: "center",
                        borderRight: i < 2 ? `0.5px solid ${softHairline}` : "none",
                      }}>
                        <div style={{ fontSize: 32, fontWeight: 200, color: m.c, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginTop: 10 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streak context */}
                {st.streak >= 3 && (
                  <div style={{ marginBottom: 32, padding: "16px 0", borderBottom: `0.5px solid ${softHairline}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase" }}>Cadena activa</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: t2, marginTop: 4 }}>
                        {st.streak >= 30 ? "Imparable" : st.streak >= 14 ? "Disciplinado" : st.streak >= 7 ? "Constante" : "En construcción"}
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 200, color: semantic.warning, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                      {st.streak}<span style={{ fontSize: 11, fontWeight: 500, color: t3, marginLeft: 4 }}>días</span>
                    </div>
                  </div>
                )}

                {/* Interpretation */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: t3, textTransform: "uppercase", marginBottom: 12 }}>
                    Interpretación
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6 }}>{postMsg}</div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => { onReset(); onSetPostStep("none"); }}
                  style={{
                    width: "100%", padding: "18px 0",
                    borderRadius: radius.md,
                    background: ac,
                    border: `1px solid ${ac}`,
                    color: "#fff",
                    fontFamily: font.family,
                    fontSize: 13, fontWeight: 600,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", minHeight: 56,
                    transition: "all 0.18s ease-out",
                  }}
                >
                  Cerrar informe
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
