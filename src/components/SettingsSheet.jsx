"use client";
/* ═══════════════════════════════════════════════════════════════
   SETTINGS SHEET — bottom-sheet dialog (full a11y + tokens)
   ═══════════════════════════════════════════════════════════════
   - role="dialog" aria-modal + focus trap + Escape.
   - Toggles: role="switch" aria-checked; Escenas: role="radiogroup".
   - Reduced-motion aware. Semantic tokens, no hardcoded hex.
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "../lib/easings";
import Icon from "./Icon";
import LocaleSelect from "./ui/LocaleSelect";
import { SOUNDSCAPES } from "../lib/constants";
import { exportData, listAvailableVoices, loadVoices, hapticSignature, diagnoseHaptic } from "../lib/audio";
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
  const { t, locale } = useT();

  // Voice list para voice picker. Se carga async (Web Speech API);
  // refresh tras 200ms cubre el primer voiceschanged event.
  const [voiceList, setVoiceList] = useState([]);
  useEffect(() => {
    if (!show) return;
    try { loadVoices(); } catch (e) {}
    const refresh = () => {
      try { setVoiceList(listAvailableVoices(locale || "es")); } catch (e) {}
    };
    refresh();
    const tid = setTimeout(refresh, 200);
    return () => clearTimeout(tid);
  }, [show, locale]);

  // Permisos de notificaciones se otorgan al instalar la PWA, no en
  // toggle. El toggle solo guarda la preferencia. Si los permisos no
  // fueron otorgados al instalar, las notificaciones no disparan, pero
  // la preferencia queda registrada para cuando se otorguen.

  const handleSignOut = async () => {
    try {
      // next-auth v5 client signOut
      const m = await import("next-auth/react");
      if (m && typeof m.signOut === "function") {
        await m.signOut({ callbackUrl: "/" });
      }
    } catch (e) {
      // Fallback: navegar a /signout (server-side)
      try { window.location.href = "/signout"; } catch {}
    }
  };

  // ─── Helper subcomponents — ADN unified (Menu Strip /perfil + IconTile dimensional + Trinity colors) ───

  // IconTile mini (squircle 32px) for ToggleRow/SegmentedRow icons
  const ICON_TILE = (iconName, color) => (
    <span aria-hidden="true" style={{
      position: "relative",
      flexShrink: 0,
      inlineSize: 32, blockSize: 32,
      borderRadius: 9,
      background: `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 50%), linear-gradient(145deg, ${withAlpha(color, 32)} 0%, ${withAlpha(color, 12)} 100%)`,
      border: `0.5px solid ${withAlpha(color, 50)}`,
      boxShadow: `inset 0 1.2px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 12px ${withAlpha(color, 28)}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <span aria-hidden="true" style={{ position: "absolute", insetBlockStart: 0, insetInlineStart: "14%", insetInlineEnd: "14%", blockSize: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)` }} />
      <Icon name={iconName} size={14} color={color} />
    </span>
  );

  const SectionLabel = ({ children, icon }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      paddingBlockStart: space[4], paddingBlockEnd: space[2],
      marginBlockStart: space[2],
    }}>
      <span aria-hidden="true" style={{
        fontFamily: MONO, fontSize: 8.5, fontWeight: 500,
        color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
        textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
      }}>
        {children}
      </span>
      <span aria-hidden="true" style={{
        flex: 1, blockSize: 1,
        background: `linear-gradient(90deg, ${withAlpha(ac, 30)} 0%, ${withAlpha(ac, 5)} 70%, transparent 100%)`,
      }} />
    </div>
  );

  const ToggleRow = ({ label, desc, icon, checked, onToggle, color }) => {
    const tone = color || ac;
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
        paddingBlock: space[3],
        borderBlockEnd: `0.5px solid ${withAlpha("#FFFFFF", 8)}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minInlineSize: 0 }}>
          {icon && ICON_TILE(icon, tone)}
          <div style={{ minInlineSize: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: -0.2, lineHeight: 1.25 }}>
              {label}
            </div>
            {desc && (
              <div style={{ fontSize: 11, fontWeight: 400, color: t3, letterSpacing: 0, lineHeight: 1.35, marginBlockStart: 2 }}>
                {desc}
              </div>
            )}
          </div>
        </div>
        <button
          role="switch"
          aria-checked={checked}
          aria-label={`${label}: ${checked ? t("settings.on") : t("settings.off")}`}
          onClick={onToggle}
          style={{
            position: "relative",
            inlineSize: 44, blockSize: 24,
            borderRadius: 99,
            background: checked
              ? `linear-gradient(180deg, ${tone} 0%, ${withAlpha(tone, 80)} 100%)`
              : "rgba(255,255,255,0.10)",
            border: checked ? `0.5px solid ${withAlpha(tone, 50)}` : "0.5px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            padding: 0,
            boxShadow: checked
              ? `inset 0 1px 0 rgba(255,255,255,0.30), 0 0 10px ${withAlpha(tone, 40)}`
              : "inset 0 1px 0 rgba(255,255,255,0.06)",
            transition: reduced ? "none" : "background .25s, box-shadow .25s",
            flexShrink: 0,
          }}
        >
          <span aria-hidden="true" style={{
            display: "block",
            inlineSize: 18, blockSize: 18,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            insetBlockStart: 2,
            insetInlineStart: checked ? 22 : 2,
            transition: reduced ? "none" : "inset-inline-start .25s cubic-bezier(0.22, 1, 0.36, 1)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.30)",
          }} />
        </button>
      </div>
    );
  };

  const SegmentedRow = ({ label, icon, value, options, onChange, ariaLabel, color }) => {
    const tone = color || ac;
    return (
      <div role="radiogroup" aria-label={ariaLabel || label} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
        paddingBlock: space[3],
        borderBlockEnd: `0.5px solid ${withAlpha("#FFFFFF", 8)}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minInlineSize: 0 }}>
          {icon && ICON_TILE(icon, tone)}
          <div style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: -0.2, lineHeight: 1.25 }}>{label}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, padding: 2, background: "rgba(255,255,255,0.04)", borderRadius: 99, border: "0.5px solid rgba(255,255,255,0.08)" }}>
          {options.map((m) => {
            const active = value === m.id;
            return (
              <button
                key={m.id}
                role="radio"
                aria-checked={active}
                aria-label={`${label}: ${m.label}`}
                onClick={() => onChange(m.id)}
                style={{
                  paddingBlock: 4, paddingInline: 11,
                  borderRadius: 99,
                  border: "none",
                  background: active ? `linear-gradient(180deg, ${withAlpha(tone, 28)} 0%, ${withAlpha(tone, 12)} 100%)` : "transparent",
                  color: active ? tone : t3,
                  fontFamily: MONO,
                  fontSize: 9.5,
                  fontWeight: 500,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  textShadow: active ? `0 0 5px ${withAlpha(tone, 50)}` : "none",
                  boxShadow: active ? `inset 0 0.5px 0 rgba(255,255,255,0.18), 0 0 0 0.5px ${withAlpha(tone, 35)}` : "none",
                  transition: reduced ? "none" : "all .2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const SliderRow = ({ label, icon, value, min = 0, max = 1, step = 0.05, formatValue, onChange, color }) => {
    const tone = color || ac;
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        paddingBlock: space[3],
        borderBlockEnd: `0.5px solid ${withAlpha("#FFFFFF", 8)}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minInlineSize: 0 }}>
            {icon && ICON_TILE(icon, tone)}
            <div style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: -0.2, lineHeight: 1.25 }}>{label}</div>
          </div>
          <span style={{
            fontFamily: MONO, fontSize: 11, fontWeight: 500, color: tone,
            letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums",
            paddingInline: 8, paddingBlock: 3,
            background: withAlpha(tone, 14),
            border: `0.5px solid ${withAlpha(tone, 30)}`,
            borderRadius: 99,
            textShadow: `0 0 5px ${withAlpha(tone, 50)}`,
          }}>
            {formatValue ? formatValue(value) : `${Math.round(value * 100)}%`}
          </span>
        </div>
        <div style={{ position: "relative", padding: "8px 0" }}>
          <div aria-hidden="true" style={{
            position: "absolute", insetBlockStart: "50%", insetInlineStart: 0, insetInlineEnd: 0,
            transform: "translateY(-50%)",
            blockSize: 4,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 99,
            overflow: "hidden",
          }}>
            <div style={{
              blockSize: "100%",
              inlineSize: `${pct}%`,
              background: `linear-gradient(90deg, ${withAlpha(tone, 50)} 0%, ${tone} 100%)`,
              borderRadius: 99,
              boxShadow: `0 0 8px ${withAlpha(tone, 50)}`,
            }} />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            aria-label={label}
            style={{
              position: "relative",
              inlineSize: "100%",
              accentColor: tone,
              cursor: "pointer",
              opacity: 0.0001,
              blockSize: 22,
              zIndex: 2,
            }}
          />
          <div aria-hidden="true" style={{
            position: "absolute",
            insetBlockStart: "50%",
            insetInlineStart: `${pct}%`,
            transform: "translate(-50%, -50%)",
            inlineSize: 18, blockSize: 18,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, ${tone} 0%, ${withAlpha(tone, 80)} 100%)`,
            border: `0.5px solid ${withAlpha(tone, 60)}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.40), 0 0 0 1px ${withAlpha(tone, 40)}, 0 0 10px ${withAlpha(tone, 50)}, 0 2px 6px rgba(0,0,0,0.25)`,
            pointerEvents: "none",
          }} />
        </div>
      </div>
    );
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
              maxBlockSize: "88dvh",
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top sheen */}
            <span aria-hidden="true" style={{ position: "absolute", insetBlockStart: 0, insetInlineStart: "20%", insetInlineEnd: "20%", blockSize: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)`, pointerEvents: "none" }} />
            {/* Pull handle — premium with glow */}
            <div aria-hidden="true" style={{
              inlineSize: 40,
              blockSize: 4,
              background: `linear-gradient(90deg, ${withAlpha(ac, 40)} 0%, ${withAlpha(ac, 70)} 50%, ${withAlpha(ac, 40)} 100%)`,
              borderRadius: 99,
              margin: `0 auto ${space[5]}px`,
              boxShadow: `0 0 8px ${withAlpha(ac, 30)}`,
            }} />
            {/* Header eyebrow + title */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBlockEnd: space[3] }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%)`, boxShadow: `0 0 6px ${ac}` }} />
                </span>
                <span style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 500,
                  color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
                  textShadow: `0 0 6px ${withAlpha(ac, 50)}`,
                }}>
                  Preferencias · audio · háptica · sesión
                </span>
              </span>
              <h3 id={titleId} style={{
                fontSize: 26, fontWeight: 300, color: t1,
                letterSpacing: -0.6, lineHeight: 1.05,
                margin: 0,
              }}>
                {t("settings.title")}
              </h3>
            </div>

            {/* ═══ AUDIO ═══ */}
            <SectionLabel icon="volume-on">Audio</SectionLabel>
            <ToggleRow
              label={t("settings.sound")}
              desc={t("settings.soundDesc")}
              icon="volume-on"
              checked={!!st.soundOn}
              onToggle={() => setSt({ ...st, soundOn: !st.soundOn })}
            />
            <SliderRow
              label="Volumen"
              icon="volume-on"
              value={typeof st.masterVolume === "number" ? st.masterVolume : 1}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setSt({ ...st, masterVolume: v })}
            />
            <ToggleRow
              label="Pad armónico"
              desc="Capa musical sutil bajo la sesión"
              icon="breath"
              checked={st.musicBedOn !== false}
              onToggle={() => setSt({ ...st, musicBedOn: !(st.musicBedOn !== false) })}
            />
            <ToggleRow
              label="Beats binaurales"
              desc="Tonos diferenciales por intent (calma/enfoque/energía)"
              icon="mind"
              checked={st.binauralOn !== false}
              onToggle={() => setSt({ ...st, binauralOn: !(st.binauralOn !== false) })}
            />

            {/* ═══ VOZ ═══ */}
            <SectionLabel icon="mind">Voz</SectionLabel>
            <ToggleRow
              label={t("settings.voice")}
              desc={t("settings.voiceDesc")}
              icon="mind"
              checked={voiceOn}
              onToggle={() => setVoiceOn(!voiceOn)}
            />
            <SegmentedRow
              label="Velocidad"
              icon="mind"
              value={(() => {
                const r = typeof st.voiceRate === "number" ? st.voiceRate : 0.83;
                return r <= 0.78 ? "slow" : r >= 0.95 ? "fast" : "normal";
              })()}
              options={[
                { id: "slow", label: "Lenta" },
                { id: "normal", label: "Normal" },
                { id: "fast", label: "Rápida" },
              ]}
              onChange={(id) => setSt({ ...st, voiceRate: id === "slow" ? 0.74 : id === "fast" ? 1.05 : 0.83 })}
              ariaLabel="Velocidad de la voz"
            />
            {/* Voice picker — solo si hay >1 voz disponible */}
            {voiceList.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBlock: space[3],
                  borderBlockEnd: `1px solid ${bd}`,
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: space[2], minInlineSize: 0 }}>
                  <Icon name="mind" size={15} color={t3} />
                  <div style={{ minInlineSize: 0 }}>
                    <div style={ty.title(t1)}>Voz</div>
                    <div style={{ ...ty.caption(t3), marginBlockStart: 1 }}>
                      {voiceList.find((v) => v.name === st.voicePreference)?.isPremium ? "Premium" : "Auto-pick"}
                    </div>
                  </div>
                </div>
                <select
                  aria-label="Seleccionar voz"
                  value={st.voicePreference || ""}
                  onChange={(e) => setSt({ ...st, voicePreference: e.target.value || null })}
                  style={{
                    flexShrink: 0,
                    maxInlineSize: 180,
                    paddingBlock: space[1],
                    paddingInline: space[2],
                    borderRadius: radius.sm,
                    border: `1px solid ${bd}`,
                    background: cd,
                    color: t1,
                    fontSize: 12,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Auto (premium)</option>
                  {voiceList.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}{v.isPremium ? " ★" : ""}{v.isLocal ? " ◇" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ═══ VIBRACIÓN ═══ */}
            <SectionLabel icon="vibrate">Vibración</SectionLabel>
            {(() => {
              // Detect API support — iOS Safari no implementa vibrate.
              const hasVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
              return (
                <>
                  <ToggleRow
                    label={t("settings.vibrate")}
                    desc={hasVibrate ? t("settings.vibrateDesc") : "Tu navegador no soporta vibración (iOS Safari)"}
                    icon="vibrate"
                    checked={!!st.hapticOn}
                    onToggle={() => setSt({ ...st, hapticOn: !st.hapticOn })}
                  />
                  <SegmentedRow
                    label="Intensidad"
                    icon="vibrate"
                    value={st.hapticIntensity || "medium"}
                    options={[
                      { id: "light", label: "Suave" },
                      { id: "medium", label: "Media" },
                      { id: "strong", label: "Fuerte" },
                    ]}
                    onChange={(id) => {
                      setSt({ ...st, hapticIntensity: id });
                      // Feedback inmediato: pattern phaseShift al nivel nuevo.
                      // El usuario siente la diferencia entre Suave/Media/Fuerte
                      // sin tener que iniciar una sesión.
                      setTimeout(() => { try { hapticSignature("phaseShift"); } catch (e) {} }, 50);
                    }}
                    ariaLabel="Intensidad de vibración"
                  />
                  {/* Sprint 72 — Probar + diagnóstico: ahora muestra
                      resultado claro al usuario.
                      · Verde "✓ Vibración detectada" → se disparó OK
                      · Ámbar "Sin respuesta" → API existe pero el browser
                        o el modo silencio del teléfono la bloqueó
                      · Gris "No soportado" → device sin Vibration API (iOS)
                      · "Desactivada" → user apagó el toggle
                      Antes el botón llamaba hapticSignature("ignition")
                      sin feedback — si no vibraba, el user no sabía
                      por qué. */}
                  <HapticDiagnoseButton
                    enabled={!!st.hapticOn}
                    hasVibrate={hasVibrate}
                    accentColor={ac}
                  />
                  {!hasVibrate && (
                    <p style={{ marginBlockStart: 8, fontSize: 11, color: t3, lineHeight: 1.5 }}>
                      iOS Safari no soporta la Vibration API por decisión de Apple. La aplicación reemplaza la vibración con un destello visual sincronizado.
                    </p>
                  )}
                </>
              );
            })()}

            {/* ═══ SESIÓN ═══ */}
            <SectionLabel icon="bolt">Sesión</SectionLabel>
            <ToggleRow
              label="Mantener pantalla activa"
              desc="Evita que la pantalla se apague durante la sesión"
              icon="bolt"
              checked={st.wakeLockEnabled !== false}
              onToggle={() => setSt({ ...st, wakeLockEnabled: !(st.wakeLockEnabled !== false) })}
            />

            {/* ═══ RECORDATORIOS ═══ */}
            <SectionLabel icon="bell">Recordatorios</SectionLabel>
            <ToggleRow
              label="Recordatorio diario"
              desc="Notificación a la misma hora cada día"
              icon="bell"
              checked={!!st.remindersEnabled}
              onToggle={() => setSt({ ...st, remindersEnabled: !st.remindersEnabled })}
            />
            {st.remindersEnabled && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBlock: space[3],
                  borderBlockEnd: `1px solid ${bd}`,
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                  <Icon name="bell" size={15} color={t3} />
                  <div style={ty.title(t1)}>Hora</div>
                </div>
                <input
                  type="time"
                  aria-label="Hora del recordatorio"
                  value={`${String(st.reminderHour ?? 9).padStart(2, "0")}:${String(st.reminderMinute ?? 0).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    setSt({ ...st, reminderHour: h, reminderMinute: m });
                  }}
                  style={{
                    paddingBlock: space[1],
                    paddingInline: space[2],
                    borderRadius: radius.sm,
                    border: `1px solid ${bd}`,
                    background: cd,
                    color: t1,
                    fontSize: 13,
                    fontFamily: MONO,
                    cursor: "pointer",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </div>
            )}

            {/* ═══ DISPLAY ═══ */}
            <SectionLabel icon="palette">Display</SectionLabel>
            <SegmentedRow
              label={t("settings.theme")}
              icon="palette"
              value={st.themeMode || "auto"}
              options={[
                { id: "auto", label: t("settings.themeAuto") },
                { id: "light", label: t("settings.themeLight") },
                { id: "dark", label: t("settings.themeDark") },
              ]}
              onChange={(id) => setSt({ ...st, themeMode: id })}
              ariaLabel={t("settings.themeLabel")}
            />
            <SegmentedRow
              label="Animación"
              icon="palette"
              value={st.reducedMotionOverride || "auto"}
              options={[
                { id: "auto", label: "Auto" },
                { id: "never", label: "Total" },
                { id: "always", label: "Reducida" },
              ]}
              onChange={(id) => setSt({ ...st, reducedMotionOverride: id })}
              ariaLabel="Preferencia de animación: auto, total, o reducida"
            />
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

            {/* ═══ AMBIENTES ═══ */}
            <SectionLabel icon="breath">Ambientes</SectionLabel>
            <fieldset
              style={{
                border: "none",
                padding: 0,
                margin: 0,
                paddingBlockStart: space[2],
                paddingBlockEnd: space[3],
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

            {/* ═══ DATOS — portabilidad GDPR ═══ */}
            <SectionLabel icon="export">Tus datos</SectionLabel>
            <div style={{ display: "flex", gap: space[1.5] || 6, marginBlockStart: space[2] }}>
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
                onClick={openNOM035Report}
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

            {/* ═══ CUENTA ═══ */}
            <SectionLabel icon="user">Cuenta</SectionLabel>
            <motion.button
              whileTap={reduced ? {} : { scale: 0.97 }}
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
              style={{
                inlineSize: "100%",
                minBlockSize: 44,
                paddingBlock: 12,
                paddingInline: 16,
                marginBlockStart: space[2],
                borderRadius: radius.md,
                border: `1px solid ${bd}`,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: space[2],
                color: t2,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: -0.05,
              }}
            >
              <Icon name="logout" size={14} color={t2} aria-hidden="true" />
              Cerrar sesión
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Sprint 71 — abre el reporte NOM-035 oficial (server-side, 5 páginas,
// marca canónica) en pestaña nueva. Reemplaza la función vieja
// exportNOM035(st) que generaba un HTML mínimo desde datos de uso de
// la app (history/moodLog) y se llamaba "NOM-035" engañosamente —
// los datos eran de uso del producto, no del cuestionario oficial
// Guía III. La ruta /nom35/aplicador/reporte lee Nom35Response real
// del usuario; si aún no completó el cuestionario, muestra un mensaje
// claro invitando a hacerlo.
function openNOM035Report() {
  if (typeof window === "undefined") return;
  window.open("/nom35/aplicador/reporte", "_blank", "noopener,noreferrer");
}

// Sprint 72 — botón que dispara diagnoseHaptic() y muestra resultado.
// Reemplaza el botón anterior que solo llamaba hapticSignature("ignition")
// sin retroalimentación — si no vibraba, el usuario no sabía si el
// problema era browser, modo silencio, o el toggle apagado.
function HapticDiagnoseButton({ enabled, hasVibrate, accentColor }) {
  const [result, setResult] = useState(null);
  const handleTest = () => {
    try {
      const r = diagnoseHaptic();
      setResult(r);
      // Limpia el estado después de 4s para que el user pueda probar de nuevo
      setTimeout(() => setResult(null), 4000);
    } catch (e) {
      setResult({ supported: false, enabled: false, fired: false, reason: "exception" });
    }
  };
  const statusText = (() => {
    if (!result) return null;
    if (!result.supported) return { text: "✗ Tu dispositivo no soporta Vibration API", color: "#94A3B8" };
    if (!result.enabled) return { text: "Vibración desactivada en ajustes", color: "#94A3B8" };
    if (result.fired) return { text: "✓ Vibración detectada", color: "#059669" };
    return { text: "Sin respuesta — verifica modo silencio del teléfono", color: "#D97706" };
  })();
  return (
    <>
      <button
        type="button"
        onClick={handleTest}
        disabled={!hasVibrate || !enabled}
        style={{
          inlineSize: "100%",
          marginBlockStart: 6,
          paddingBlock: 8,
          paddingInline: 12,
          borderRadius: 8,
          border: `1px dashed ${hasVibrate && enabled ? `${accentColor}55` : "#94A3B855"}`,
          background: "transparent",
          color: hasVibrate && enabled ? accentColor : "#94A3B8",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          cursor: hasVibrate && enabled ? "pointer" : "not-allowed",
          opacity: hasVibrate && enabled ? 1 : 0.6,
        }}
        aria-label="Probar vibración con diagnóstico"
      >
        Probar vibración
      </button>
      {statusText && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginBlockStart: 6,
            fontSize: 11,
            fontWeight: 600,
            color: statusText.color,
            letterSpacing: 0.2,
            textAlign: "center",
            paddingBlock: 4,
          }}
        >
          {statusText.text}
        </div>
      )}
    </>
  );
}
