"use client";
/* ═══════════════════════════════════════════════════════════════
   SETTINGS SHEET — bottom-sheet dialog (full a11y + tokens)
   ═══════════════════════════════════════════════════════════════
   - role="dialog" aria-modal + focus trap + Escape.
   - Toggles: role="switch" aria-checked; Escenas: role="radiogroup".
   - Reduced-motion aware. Semantic tokens, no hardcoded hex.
   ═══════════════════════════════════════════════════════════════ */

import { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import LocaleSelect from "./ui/LocaleSelect";
import { SOUNDSCAPES } from "../lib/constants";
import { exportData } from "../lib/audio";
import { resolveTheme, withAlpha, ty, font, space, radius, z } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap, KEY } from "../lib/a11y";
import { useT } from "../hooks/useT";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const numStyle = (color, weight = 700) => ({
  fontFamily: MONO,
  fontWeight: weight,
  color,
  letterSpacing: -0.1,
  fontVariantNumeric: "tabular-nums",
});

export default function SettingsSheet({
  show, onClose, st, setSt, isDark, ac, voiceOn, setVoiceOn, H,
}) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const { t } = useT();

  const toggles = [
    { l: t("settings.sound"),   k: "soundOn",  d: t("settings.soundDesc"),   ic: "volume-on" },
    { l: t("settings.vibrate"), k: "hapticOn", d: t("settings.vibrateDesc"), ic: "vibrate" },
    { l: t("settings.voice"),   k: "_voice",   d: t("settings.voiceDesc"),   ic: "mind" },
  ];

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
              background: cd,
              borderStartStartRadius: radius["2xl"],
              borderStartEndRadius: radius["2xl"],
              paddingBlock: `${space[5]}px ${space[10]}px`,
              paddingInline: space[5],
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
              {t("settings.title")}
            </h3>

            {toggles.map((s) => {
              const checked = s.k === "_voice" ? voiceOn : !!st[s.k];
              const toggle = () => {
                if (s.k === "_voice") setVoiceOn(!voiceOn);
                else setSt({ ...st, [s.k]: !st[s.k] });
              };
              return (
                <div
                  key={s.k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBlock: space[3],
                    borderBlockEnd: `1px solid ${bd}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                    <Icon name={s.ic} size={15} color={t3} />
                    <div>
                      <div style={ty.title(t1)}>{s.l}</div>
                      <div style={{ ...ty.caption(t3), marginBlockStart: 1 }}>{s.d}</div>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={checked}
                    aria-label={`${s.l}: ${checked ? t("settings.on") : t("settings.off")}`}
                    onClick={toggle}
                    style={{
                      inlineSize: 42,
                      blockSize: 24,
                      borderRadius: 12,
                      background: checked ? ac : bd,
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: reduced ? "none" : "background .3s",
                      padding: 0,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "block",
                        inlineSize: 20,
                        blockSize: 20,
                        borderRadius: 10,
                        background: "#fff",
                        position: "absolute",
                        insetBlockStart: 2,
                        insetInlineStart: checked ? 20 : 2,
                        transition: reduced ? "none" : "inset-inline-start .3s",
                        boxShadow: "0 1px 3px rgba(0,0,0,.15)",
                      }}
                    />
                  </button>
                </div>
              );
            })}

            <div
              role="radiogroup"
              aria-label={t("settings.themeLabel")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBlock: space[3],
                borderBlockEnd: `1px solid ${bd}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                <Icon name="palette" size={15} color={t3} />
                <div style={ty.title(t1)}>{t("settings.theme")}</div>
              </div>
              <div style={{ display: "flex", gap: space[1] }}>
                {[
                  { id: "auto",  label: t("settings.themeAuto") },
                  { id: "light", label: t("settings.themeLight") },
                  { id: "dark",  label: t("settings.themeDark") },
                ].map((m) => {
                  const active = (st.themeMode || "auto") === m.id;
                  return (
                    <button
                      key={m.id}
                      role="radio"
                      aria-checked={active}
                      aria-label={`${t("settings.theme")}: ${m.label}`}
                      onClick={() => setSt({ ...st, themeMode: m.id })}
                      style={{
                        paddingBlock: space[1],
                        paddingInline: space[3],
                        borderRadius: radius.sm - 1,
                        border: `1px solid ${active ? ac : bd}`,
                        background: active ? withAlpha(ac, 6) : cd,
                        color: active ? ac : t3,
                        ...ty.caption(active ? ac : t3),
                        cursor: "pointer",
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBlock: space[3],
                borderBlockEnd: `1px solid ${bd}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                <Icon name="mind" size={15} color={t3} />
                <div style={ty.title(t1)}>{t("settings.language")}</div>
              </div>
              <LocaleSelect variant="radiogroup" />
            </div>

            <fieldset
              style={{
                border: "none",
                padding: 0,
                margin: 0,
                paddingBlock: space[3],
                borderBlockEnd: `1px solid ${bd}`,
              }}
            >
              <legend style={{ padding: 0, marginBlockEnd: space[2.5] || 10, display: "block", inlineSize: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                  <Icon name="breath" size={15} color={t3} />
                  <div>
                    <div style={ty.title(t1)}>{t("settings.soundscape")}</div>
                    <div style={ty.caption(t3)}>{t("settings.soundscapeDesc")}</div>
                  </div>
                </div>
              </legend>
              <div
                role="radiogroup"
                aria-label={t("settings.soundscape")}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
              >
                {SOUNDSCAPES.map((s) => {
                  const unlocked = (st.unlockedSS || ["off"]).includes(s.id);
                  const active = (st.soundscape || "off") === s.id;
                  const affordable = unlocked || (st.vCores || 0) >= s.cost;
                  const onClick = () => {
                    if (unlocked) {
                      setSt({ ...st, soundscape: s.id });
                      H("tap");
                    } else if ((st.vCores || 0) >= s.cost) {
                      setSt({
                        ...st,
                        soundscape: s.id,
                        unlockedSS: [...(st.unlockedSS || ["off"]), s.id],
                        vCores: (st.vCores || 0) - s.cost,
                      });
                      H("ok");
                    }
                  };
                  const status = active
                    ? t("settings.active")
                    : unlocked
                      ? t("settings.unlocked")
                      : t("settings.costHint", { cost: s.cost });
                  return (
                    <motion.button
                      key={s.id}
                      role="radio"
                      aria-checked={active}
                      aria-label={`${s.n}, ${status}`}
                      aria-disabled={!affordable}
                      whileTap={reduced || !affordable ? {} : { scale: 0.95 }}
                      onClick={affordable ? onClick : undefined}
                      style={{
                        paddingBlock: 10,
                        paddingInline: 8,
                        borderRadius: 12,
                        border: active
                          ? `2px solid ${ac}`
                          : unlocked
                          ? `1.5px solid ${bd}`
                          : `1.5px dashed ${bd}`,
                        background: active ? withAlpha(ac, 6) : cd,
                        cursor: affordable ? "pointer" : "not-allowed",
                        opacity: affordable ? 1 : 0.5,
                        textAlign: "center",
                      }}
                    >
                      <div style={ty.title(active ? ac : unlocked ? t1 : t3)}>{s.n}</div>
                      {!unlocked && (
                        <div
                          style={{
                            marginBlockStart: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 3,
                          }}
                        >
                          <Icon name="sparkle" size={9} color={ac} aria-hidden="true" />
                          <span style={{ ...numStyle(ac, 800), fontSize: font.size.sm }}>{s.cost}</span>
                        </div>
                      )}
                      {unlocked && active && (
                        <div
                          style={{
                            fontSize: font.size.xs,
                            fontWeight: font.weight.bold,
                            color: ac,
                            marginBlockStart: 2,
                          }}
                        >
                          {t("settings.active")}
                        </div>
                      )}
                      {unlocked && !active && (
                        <div style={{ fontSize: font.size.xs, color: t3, marginBlockStart: 2 }}>{t("settings.unlocked")}</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </fieldset>

            <div style={{ display: "flex", gap: space[1.5] || 6, marginBlockStart: space[4] }}>
              <motion.button
                whileTap={reduced ? {} : { scale: 0.96 }}
                onClick={() => exportData(st)}
                aria-label={t("settings.exportJsonLabel")}
                style={{
                  flex: 1,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  paddingInline: 12,
                  borderRadius: radius.md,
                  border: `1px solid ${bd}`,
                  background: cd,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space[2],
                  color: t2,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: -0.05,
                }}
              >
                <Icon name="export" size={16} color={t2} aria-hidden="true" />
                {t("settings.exportJson")}
              </motion.button>
              <motion.button
                whileTap={reduced ? {} : { scale: 0.96 }}
                onClick={() => exportNOM035(st)}
                aria-label={t("settings.exportNomLabel")}
                style={{
                  flex: 1,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  paddingInline: 12,
                  borderRadius: radius.md,
                  border: `1.5px solid ${semantic.success}`,
                  background: withAlpha(semantic.success, 4),
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space[2],
                  color: semantic.success,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: -0.05,
                }}
              >
                <Icon name="file" size={16} color={semantic.success} aria-hidden="true" />
                {t("settings.exportNom")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function exportNOM035(st){try{
  const ml=st.moodLog||[];const h=st.history||[];const now=new Date();
  const totalMin=Math.round((st.totalTime||0)/60);
  const withPre=ml.filter(m=>m.pre>0);
  const delta=withPre.length?+(withPre.reduce((a,m)=>a+(m.mood-m.pre),0)/withPre.length).toFixed(2):0;
  const riskCount=ml.filter(m=>m.mood<=2).length;
  const riskPct=ml.length?Math.round((riskCount/ml.length)*100):0;
  const protos={};h.forEach(x=>{protos[x.p]=(protos[x.p]||0)+1;});
  const topProtos=Object.entries(protos).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const uniqueDays=new Set(h.map(x=>new Date(x.ts).toDateString())).size;
  const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe NOM-035</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;color:#0F172A;background:#fff;padding:40px;max-width:800px;margin:0 auto;font-size:14px}.header{border-bottom:3px solid #059669;padding-bottom:20px;margin-bottom:30px}.logo{font-size:24px;font-weight:800;color:#059669}h2{font-size:16px;margin:28px 0 14px;border-bottom:1px solid #E2E8F0;padding-bottom:6px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px}.card .v{font-size:22px;font-weight:800}.card .l{font-size:10px;color:#64748B;margin-top:2px;text-transform:uppercase}.imp{font-size:28px;font-weight:800;color:${delta>=0?"#059669":"#DC2626"};text-align:center;padding:20px;background:${delta>=0?"#F0FDF4":"#FEF2F2"};border-radius:12px;margin-bottom:20px}.footer{margin-top:40px;border-top:2px solid #E2E8F0;padding-top:16px;font-size:10px;color:#94A3B8;text-align:center}</style></head><body><div class="header"><div class="logo">BIO-IGNICIÓN</div><div style="font-size:11px;color:#64748B;margin-top:4px">Informe de Bienestar Laboral — NOM-035-STPS-2018</div><div style="font-size:11px;color:#475569;margin-top:8px">Fecha: ${now.toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"})}</div></div><h2>Resumen</h2><div class="grid"><div class="card"><div class="v">${st.totalSessions}</div><div class="l">Sesiones</div></div><div class="card"><div class="v">${totalMin}min</div><div class="l">Tiempo</div></div><div class="card"><div class="v">${uniqueDays}</div><div class="l">Días activos</div></div></div><div class="imp">${delta>=0?"+":""}${delta} puntos<br><span style="font-size:11px;font-weight:400;color:#64748B">Mejora promedio por sesión</span></div><h2>Protocolos</h2>${topProtos.map(([n,c])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9"><span>${n}</span><span>${c}x (${Math.round(c/st.totalSessions*100)}%)</span></div>`).join("")}<h2>Riesgo</h2><div style="padding:14px;background:${riskPct>30?"#FEF2F2":"#F0FDF4"};border-radius:10px;margin-bottom:20px"><div style="font-size:20px;font-weight:800;color:${riskPct>30?"#DC2626":"#059669"}">${riskPct}%</div><div style="font-size:11px;color:${riskPct>30?"#DC2626":"#059669"}">Sesiones con tensión alta</div></div><div class="footer"><p><strong>BIO-IGNICIÓN</strong> — Generado: ${now.toLocaleString("es-MX")}</p></div></body></html>`;
  const blob=new Blob([html],{type:"text/html"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`NOM035-${now.toISOString().split("T")[0]}.html`;a.click();URL.revokeObjectURL(url);
}catch(e){console.error(e);}}
