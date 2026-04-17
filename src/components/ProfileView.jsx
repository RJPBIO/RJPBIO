"use client";
/* ═══════════════════════════════════════════════════════════════
   PROFILE — OPERATOR DOSSIER
   Personal clinical record. No avatar glow. No gradient hero.
   Hierarchical data, hairline dividers, weight-300 metrics.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import AnimatedNumber from "./AnimatedNumber";
import { MOODS, DS } from "../lib/constants";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  calcNeuralFingerprint, suggestOptimalTime, analyzeStreakChain,
} from "../lib/neural";
import { resolveTheme, ty, font, space, radius, layout, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

export default function ProfileView({ st, setSt, isDark, ac, onShowSettings, onShowHist, onShowCalibration }) {
  const { t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";

  const lv = gL(st.totalSessions);
  const lPct = lvPct(st.totalSessions);
  const nLv = nxtLv(st.totalSessions);
  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const nSt = getStatus(perf);
  const avgMood = useMemo(() => {
    const ml = st.moodLog || []; if (!ml.length) return 0;
    return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1);
  }, [st.moodLog]);

  const totalHours = Math.floor((st.totalTime || 0) / 3600);
  const totalMins = Math.floor(((st.totalTime || 0) % 3600) / 60);

  return (
    <div style={{ padding: `24px 20px ${layout.bottomSafe}px` }}>
      {/* ─── HEADER — operator identity ─── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{ borderBottom: hairline(isDark), paddingBottom: 20, marginBottom: 28 }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ ...CAPS, color: t3 }}>Operador</div>
          <div style={{ ...MICRO, color: t3 }}>{nSt.label}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 200, color: t1, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {lv.n}
          </span>
          <span style={{ fontSize: 14, fontWeight: 400, color: t2, letterSpacing: "0.02em" }}>
            nivel · {perf}% rendimiento
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6, marginBottom: 16 }}>
          {nLv
            ? `Progreso hacia ${nLv.n} — ${lPct}%.`
            : `Nivel máximo alcanzado.`}
        </div>

        {/* Level progress — hairline bar */}
        <div style={{ height: 2, background: isDark ? "#232836" : "#E5E7EB", borderRadius: 0, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: lPct + "%" }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ height: "100%", background: teal }}
          />
        </div>
      </motion.div>

      {/* ─── CORE STATS — three-column executive row ─── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: hairline(isDark), borderBottom: hairline(isDark),
        marginBottom: 32,
      }}>
        {[
          { l: "Sesiones", v: st.totalSessions, u: "" },
          { l: "Tiempo", v: `${totalHours}h${totalMins.toString().padStart(2, "0")}`, u: "" },
          { l: "Cadena", v: st.streak, u: "d" },
        ].map((m, i) => (
          <div key={i} style={{
            padding: "18px 12px",
            borderLeft: i > 0 ? hairline(isDark) : "none",
          }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>{m.l}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 28, fontWeight: 300, color: t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.v}</span>
              {m.u && <span style={{ fontSize: 10, fontWeight: 500, color: t3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.u}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ─── NEURAL FINGERPRINT ─── */}
      {(() => {
        let fp; try { fp = calcNeuralFingerprint(st); } catch (e) { fp = null; }
        if (!fp) return null;
        return (
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 14, paddingLeft: 2 }}>Firma Neural</div>
            <div style={{
              background: isDark ? "#141820" : "#FFFFFF",
              borderRadius: radius.lg, border: hairline(isDark),
            }}>
              {[
                { l: "Hora pico", v: `${fp.peakHour}:00`, c: t1 },
                { l: "Mejor protocolo", v: fp.bestProto, c: teal },
                { l: "Calidad media", v: `${fp.avgQuality}%`, c: fp.avgQuality >= 70 ? teal : semantic.warning },
                { l: "Adaptación", v: fp.adaptationRate > 0 ? `+${fp.adaptationRate}` : `${fp.adaptationRate}`, c: fp.adaptationRate > 0 ? teal : semantic.danger },
              ].map((d, i, arr) => (
                <div key={i} style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                }}>
                  <span style={{ ...CAPS, color: t3 }}>{d.l}</span>
                  <span style={{ fontSize: 18, fontWeight: 300, color: d.c, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{d.v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── V-CORES + MOOD ─── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        background: isDark ? "#141820" : "#FFFFFF",
        border: hairline(isDark), borderRadius: radius.lg,
        marginBottom: 32,
      }}>
        <div style={{ padding: 20, borderRight: hairline(isDark) }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 10 }}>V-Cores</div>
          <AnimatedNumber value={st.vCores || 0} color={teal} size={28} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 10 }}>Mood · 7d</div>
          {avgMood > 0 ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 300, color: MOODS[Math.round(avgMood) - 1]?.color || t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{avgMood}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: t3, letterSpacing: "0.08em" }}>/5</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 400, color: t3 }}>Sin datos</div>
          )}
        </div>
      </div>

      {/* ─── OPTIMAL TIME ─── */}
      {(() => {
        let ot; try { ot = suggestOptimalTime(st); } catch (e) { ot = null; }
        if (!ot || !ot.best) return null;
        return (
          <div style={{
            marginBottom: 20,
            padding: "18px 20px",
            background: isDark ? "#141820" : "#FFFFFF",
            border: hairline(isDark), borderRadius: radius.lg,
          }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Hora Óptima</div>
            <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6 }}>{ot.recommendation}</div>
          </div>
        );
      })()}

      {/* ─── STREAK CHAIN ─── */}
      {(() => {
        let sc; try { sc = analyzeStreakChain(st); } catch (e) { sc = null; }
        if (!sc) return null;
        return (
          <div style={{
            marginBottom: 32,
            background: isDark ? "#141820" : "#FFFFFF",
            border: hairline(isDark), borderRadius: radius.lg,
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: hairline(isDark) }}>
              <div style={{ ...CAPS, color: t3 }}>Análisis de Cadena</div>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: hairline(isDark),
            }}>
              {[
                { l: "Récord", v: `${sc.maxStreak}d`, c: teal },
                { l: "Promedio", v: `${sc.avgStreak}d`, c: t1 },
                { l: "Quiebre", v: `${sc.avgBreakPoint}d`, c: t1 },
              ].map((d, i) => (
                <div key={i} style={{
                  padding: "16px 12px",
                  borderLeft: i > 0 ? hairline(isDark) : "none",
                }}>
                  <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>{d.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 300, color: d.c, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{d.v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 20px", fontSize: 14, fontWeight: 400, color: t2, lineHeight: 1.6 }}>
              {sc.prediction}
            </div>
          </div>
        );
      })()}

      {/* ─── ACTIONS — clinical row buttons ─── */}
      <div style={{
        background: isDark ? "#141820" : "#FFFFFF",
        border: hairline(isDark), borderRadius: radius.lg,
        marginBottom: 14,
      }}>
        {[
          { l: "Ajustes", ic: "gear", on: onShowSettings },
          { l: "Historial completo", ic: "clock", on: onShowHist, sub: `${(st.history || []).length} registros` },
          { l: "Recalibrar baseline", ic: "radar", on: onShowCalibration, accent: true },
        ].map((a, i, arr) => (
          <button
            key={i}
            onClick={a.on}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              background: "transparent",
              border: "none",
              borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
              cursor: "pointer", minHeight: 52,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name={a.ic} size={14} color={a.accent ? teal : t2} strokeWidth={1} />
              <span style={{ fontSize: 14, fontWeight: 500, color: a.accent ? teal : t1, letterSpacing: "-0.01em" }}>{a.l}</span>
            </div>
            {a.sub && <span style={{ ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>{a.sub}</span>}
          </button>
        ))}
      </div>

      {/* ─── DESTRUCTIVE — reset ─── */}
      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los datos del operador?")) {
            setSt({ ...DS, weekNum: getWeekNum() });
          }
        }}
        style={{
          width: "100%", padding: "14px 20px",
          border: hairline(isDark),
          background: "transparent",
          color: semantic.danger,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
          borderRadius: radius.md,
          cursor: "pointer", minHeight: 44,
        }}
      >
        Reiniciar datos
      </button>
    </div>
  );
}
