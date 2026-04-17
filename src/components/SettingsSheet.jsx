"use client";
/* ═══════════════════════════════════════════════════════════════
   SETTINGS SHEET — Clinical configuration panel.
   Toggle = hairline-bordered pill with teal fill. No gradients, no shadows.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SOUNDSCAPES } from "../lib/constants";
import { exportData } from "../lib/audio";
import { resolveTheme, radius, z, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

function Toggle({ on, onToggle, isDark }) {
  const teal = "#0F766E";
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      style={{
        width: 40, height: 22,
        borderRadius: 999,
        background: on ? teal : (isDark ? "#232836" : "#E5E7EB"),
        cursor: "pointer", position: "relative",
        transition: "background 280ms cubic-bezier(0.25,0.46,0.45,0.94)",
        border: "none", padding: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 999,
        background: "#FFFFFF",
        position: "absolute", top: 2, left: on ? 20 : 2,
        transition: "left 280ms cubic-bezier(0.25,0.46,0.45,0.94)",
      }} />
    </button>
  );
}

export default function SettingsSheet({
  show, onClose, st, setSt, isDark, ac, voiceOn, setVoiceOn, H,
}) {
  const { t1, t2, t3, bg } = resolveTheme(isDark);
  const teal = "#0F766E";
  const [exportMsg, setExportMsg] = useState("");

  function handleExportJSON() {
    try {
      exportData(st);
      setExportMsg("JSON exportado");
      setTimeout(() => setExportMsg(""), 2500);
    } catch (e) {
      setExportMsg("Error al exportar");
      setTimeout(() => setExportMsg(""), 3000);
    }
  }

  function handleExportNOM035() {
    try {
      exportNOM035(st);
      setExportMsg("NOM-035 exportado");
      setTimeout(() => setExportMsg(""), 2500);
    } catch (e) {
      setExportMsg("Error al generar informe");
      setTimeout(() => setExportMsg(""), 3000);
    }
  }

  const toggleRows = [
    { l: "Sonido ambiente", k: "soundOn", d: "Acordes, ruido, binaural" },
    { l: "Vibración", k: "hapticOn", d: "Feedback háptico" },
    { l: "Voz guiada", k: "_voice", d: "Narración de fases" },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Configuración"
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
            <div style={{
              width: 28, height: 2, background: isDark ? "#232836" : "#E5E7EB",
              margin: "12px auto 0",
            }} />

            {/* Header */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: hairline(isDark),
            }}>
              <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Instrumento</div>
              <div style={{ fontSize: 24, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Configuración
              </div>
            </div>

            {/* Toggle rows */}
            <div>
              {toggleRows.map((s, i, arr) => {
                const on = s.k === "_voice" ? voiceOn : st[s.k] !== false;
                return (
                  <div key={s.k} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                    minHeight: 64,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: "-0.01em" }}>{s.l}</div>
                      <div style={{ fontSize: 12, fontWeight: 400, color: t3, marginTop: 3, letterSpacing: "0.01em" }}>{s.d}</div>
                    </div>
                    <Toggle
                      on={on}
                      onToggle={() => {
                        if (s.k === "_voice") setVoiceOn(!voiceOn);
                        else setSt({ ...st, [s.k]: st[s.k] === false ? true : false });
                      }}
                      isDark={isDark}
                    />
                  </div>
                );
              })}
            </div>

            {/* Theme — segmented */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderTop: hairline(isDark),
              borderBottom: hairline(isDark),
              minHeight: 64,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: "-0.01em" }}>Tema</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: t3, marginTop: 3 }}>Auto · claro · oscuro</div>
              </div>
              <div style={{ display: "flex", border: hairline(isDark), borderRadius: radius.md, overflow: "hidden" }}>
                {["auto", "light", "dark"].map((m, i, arr) => {
                  const isActive = (st.themeMode || "auto") === m;
                  return (
                    <button
                      key={m}
                      aria-pressed={isActive}
                      onClick={() => setSt({ ...st, themeMode: m })}
                      style={{
                        padding: "8px 14px", minHeight: 36,
                        background: isActive ? teal : "transparent",
                        color: isActive ? "#FFFFFF" : t2,
                        border: "none",
                        borderLeft: i > 0 ? hairline(isDark) : "none",
                        cursor: "pointer",
                        ...MICRO,
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soundscape grid */}
            <div style={{ padding: "20px", borderBottom: hairline(isDark) }}>
              <div style={{ ...CAPS, color: t3, marginBottom: 14 }}>Paisaje Sonoro</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SOUNDSCAPES.map(s => {
                  const unlocked = (st.unlockedSS || ["off"]).includes(s.id);
                  const active = (st.soundscape || "off") === s.id;
                  const canAfford = (st.vCores || 0) >= s.cost;
                  return (
                    <button
                      key={s.id}
                      aria-label={`${s.n}${active ? " activo" : ""}${!unlocked ? ` — ${s.cost} V-Cores` : ""}`}
                      onClick={() => {
                        if (unlocked) { setSt({ ...st, soundscape: s.id }); H && H("tap"); }
                        else if (canAfford) {
                          setSt({
                            ...st, soundscape: s.id,
                            unlockedSS: [...(st.unlockedSS || ["off"]), s.id],
                            vCores: (st.vCores || 0) - s.cost,
                          });
                          H && H("ok");
                        }
                      }}
                      style={{
                        padding: "14px 10px",
                        borderRadius: radius.md,
                        border: active ? `1px solid ${teal}` : hairline(isDark),
                        background: "transparent",
                        cursor: unlocked || canAfford ? "pointer" : "not-allowed",
                        opacity: unlocked || canAfford ? 1 : 0.45,
                        textAlign: "left",
                        minHeight: 64,
                      }}
                    >
                      <div style={{
                        fontSize: 13, fontWeight: 500,
                        color: active ? teal : unlocked ? t1 : t2,
                        letterSpacing: "-0.01em",
                      }}>
                        {s.n}
                      </div>
                      <div style={{ marginTop: 6, ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>
                        {active ? "Activo" : unlocked ? "Desbloqueado" : `${s.cost} V-Cores`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Export buttons */}
            <div style={{ padding: "20px", display: "flex", gap: 10 }}>
              <button
                aria-label="Exportar datos JSON"
                onClick={handleExportJSON}
                style={{
                  flex: 1, padding: "14px",
                  borderRadius: radius.md, border: hairline(isDark),
                  background: "transparent",
                  cursor: "pointer", minHeight: 52,
                  ...CAPS, color: t2,
                }}
              >
                Exportar · JSON
              </button>
              <button
                aria-label="Exportar informe NOM-035"
                onClick={handleExportNOM035}
                style={{
                  flex: 1, padding: "14px",
                  borderRadius: radius.md, border: `1px solid ${teal}`,
                  background: "transparent", color: teal,
                  cursor: "pointer", minHeight: 52,
                  ...CAPS,
                }}
              >
                NOM-035
              </button>
            </div>

            <AnimatePresence>
              {exportMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.28 }}
                  style={{
                    margin: "0 20px 20px",
                    padding: "12px 16px",
                    borderRadius: radius.md,
                    border: hairline(isDark),
                    borderLeft: `2px solid ${exportMsg.includes("Error") ? semantic.danger : teal}`,
                    ...MICRO,
                    color: exportMsg.includes("Error") ? semantic.danger : teal,
                  }}
                >
                  {exportMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function exportNOM035(st) {
  const ml = st.moodLog || [];
  const h = st.history || [];
  const now = new Date();
  const totalMin = Math.round((st.totalTime || 0) / 60);
  const sessions = st.totalSessions || 0;
  if (sessions === 0) throw new Error("No hay sesiones para exportar");

  const withPre = ml.filter(m => m.pre > 0);
  const delta = withPre.length ? +(withPre.reduce((a, m) => a + (m.mood - m.pre), 0) / withPre.length).toFixed(2) : 0;
  const riskCount = ml.filter(m => m.mood <= 2).length;
  const riskPct = ml.length ? Math.round((riskCount / ml.length) * 100) : 0;
  const protos = {};
  h.forEach(x => { protos[x.p] = (protos[x.p] || 0) + 1; });
  const topProtos = Object.entries(protos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const uniqueDays = new Set(h.map(x => new Date(x.ts).toDateString())).size;

  const safeSessions = Number.isFinite(sessions) ? sessions : 0;
  const safeTotalMin = Number.isFinite(totalMin) ? totalMin : 0;
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  const safeRiskPct = Number.isFinite(riskPct) ? riskPct : 0;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe NOM-035</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,sans-serif;color:#0A0E14;background:#F8F9FB;padding:48px;max-width:760px;margin:0 auto;font-size:14px;font-feature-settings:"tnum"}.header{border-bottom:0.5px solid #0A0E14;padding-bottom:20px;margin-bottom:32px}.kicker{font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280}.title{font-size:28px;font-weight:300;letter-spacing:-0.02em;margin-top:8px}h2{font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;margin:32px 0 14px;padding-top:14px;border-top:0.5px solid rgba(10,14,20,.08)}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:0.5px solid rgba(10,14,20,.08);border-bottom:0.5px solid rgba(10,14,20,.08);margin-bottom:24px}.card{padding:18px 14px}.card+.card{border-left:0.5px solid rgba(10,14,20,.08)}.card .v{font-size:28px;font-weight:300;letter-spacing:-0.01em;font-variant-numeric:tabular-nums;line-height:1}.card .l{font-size:10px;color:#6B7280;margin-top:8px;text-transform:uppercase;letter-spacing:0.12em;font-weight:600}.imp{font-size:40px;font-weight:200;color:${safeDelta >= 0 ? "#0F766E" : "#B91C1C"};padding:24px 0;font-variant-numeric:tabular-nums;letter-spacing:-0.02em}.sub{font-size:12px;color:#6B7280;margin-top:6px}.row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:0.5px solid rgba(10,14,20,.08);font-size:14px}.footer{margin-top:48px;padding-top:18px;border-top:0.5px solid rgba(10,14,20,.08);font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em}</style></head><body><div class="header"><div class="kicker">BIO — IGNICIÓN · NOM-035-STPS-2018</div><div class="title">Informe de Bienestar Laboral</div><div class="sub">${now.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</div></div><h2>Resumen</h2><div class="grid"><div class="card"><div class="v">${safeSessions}</div><div class="l">Sesiones</div></div><div class="card"><div class="v">${safeTotalMin}<span style="font-size:14px;color:#6B7280;margin-left:3px">min</span></div><div class="l">Tiempo</div></div><div class="card"><div class="v">${uniqueDays}</div><div class="l">Días activos</div></div></div><div class="imp">${safeDelta >= 0 ? "+" : ""}${safeDelta}<span style="font-size:13px;color:#6B7280;margin-left:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:500">pts · mejora promedio</span></div><h2>Protocolos Utilizados</h2>${topProtos.map(([n, c]) => `<div class="row"><span>${n}</span><span style="font-variant-numeric:tabular-nums">${c}× · ${Math.round(c / safeSessions * 100)}%</span></div>`).join("")}<h2>Riesgo Detectado</h2><div class="row"><span>Sesiones con tensión alta</span><span style="font-variant-numeric:tabular-nums;color:${safeRiskPct > 30 ? "#B91C1C" : "#0F766E"};font-weight:500">${safeRiskPct}%</span></div><div class="footer">Bio-Ignición · ${now.toLocaleString("es-MX")}</div></body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NOM035-${now.toISOString().split("T")[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
