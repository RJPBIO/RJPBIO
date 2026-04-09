"use client";
import { useState } from "react";
import { Ic } from "./Icons";

const MOODS_CAL = [
  { v: 1, label: "Muy bajo", icon: "drain", color: "#DC2626", desc: "Drenado, sin recursos" },
  { v: 2, label: "Bajo", icon: "stress", color: "#F59E0B", desc: "Tenso o cansado" },
  { v: 3, label: "Neutro", icon: "neutral", color: "#64748B", desc: "Estable, funcional" },
  { v: 4, label: "Bien", icon: "sharp", color: "#10B981", desc: "Activo y claro" },
  { v: 5, label: "Pico", icon: "peak", color: "#0EA5E9", desc: "Energía máxima" },
];

const ENERGIES = [
  { v: 1, label: "Baja", desc: "Necesito recargar" },
  { v: 2, label: "Media", desc: "Funcional" },
  { v: 3, label: "Alta", desc: "Lista para usar" },
];

const INTENTS_CAL = [
  { id: "calma", label: "Calma", icon: "calm", desc: "Bajar revoluciones, respirar", color: "#10B981" },
  { id: "enfoque", label: "Enfoque", icon: "focus", desc: "Concentración dirigida", color: "#6366F1" },
  { id: "energia", label: "Energía", icon: "energy", desc: "Activación motivacional", color: "#F59E0B" },
  { id: "reset", label: "Reset", icon: "reset", desc: "Reorganizar el sistema", color: "#0EA5E9" },
];

export function OnboardingCalibration({ isDark, ac, t1, t2, t3, bd, cd, onComplete }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [intent, setIntent] = useState("");

  const next = () => setStep(s => s + 1);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(0,0,0,.7)", backdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: isDark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.96)", borderRadius: 28, padding: "32px 24px", maxWidth: 400, width: "100%", animation: "calibStep .5s cubic-bezier(.34,1.56,.64,1)", border: "1px solid " + bd }}>

        <div style={{ display: "flex", gap: 4, marginBottom: 22, justifyContent: "center" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: i === step ? 22 : 8, height: 4, borderRadius: 2, background: i <= step ? ac : bd, transition: "all .3s" }} />
          ))}
        </div>

        {step === 0 && (
          <div style={{ textAlign: "center", animation: "fi .4s ease" }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: "0 auto 16px", display: "block" }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke={ac} strokeWidth="2" opacity=".5" />
              <circle cx="32" cy="32" r="20" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="6 4" style={{ animation: "innerRing 5s linear infinite", transformOrigin: "32px 32px" }} />
              <circle cx="32" cy="32" r="8" fill={ac} opacity=".4" style={{ animation: "pu 3s ease infinite", transformOrigin: "32px 32px" }} />
            </svg>
            <div style={{ fontSize: 26, fontWeight: 800, color: t1, marginBottom: 6, letterSpacing: "-0.8px" }}>BIO-IGNICIÓN</div>
            <div style={{ fontSize: 10, color: ac, fontWeight: 700, letterSpacing: 3, marginBottom: 18, textTransform: "uppercase" }}>Calibración Neural</div>
            <div style={{ fontSize: 12, color: t2, lineHeight: 1.6, marginBottom: 22 }}>
              Antes de empezar necesito calibrar tu sistema. Tres preguntas. 30 segundos.
              <br /><br />
              No hay respuestas correctas. Sólo hay lo que sientes ahora.
            </div>
            <button onClick={next} style={{ width: "100%", padding: "16px", borderRadius: 50, background: ac, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", animation: "gl 2s ease infinite" }}>EMPEZAR CALIBRACIÓN</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: "fi .4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: t1 }}>¿Cómo está tu mood ahora?</div>
              <div style={{ fontSize: 11, color: t3, marginTop: 4 }}>Tu línea base inicial</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {MOODS_CAL.map(m => (
                <button key={m.v} onClick={() => setMood(m.v)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13, border: mood === m.v ? `2px solid ${m.color}` : `1.5px solid ${bd}`, background: mood === m.v ? m.color + "10" : cd, cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
                  <Ic name={m.icon} size={22} color={mood === m.v ? m.color : t3} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: mood === m.v ? m.color : t1 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: t3, marginTop: 1 }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={next} disabled={!mood} style={{ width: "100%", padding: "14px", borderRadius: 50, background: mood ? ac : bd, border: "none", color: mood ? "#fff" : t3, fontSize: 12, fontWeight: 800, cursor: mood ? "pointer" : "default", letterSpacing: 2, textTransform: "uppercase" }}>CONTINUAR</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fi .4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: t1 }}>¿Y tu energía física?</div>
              <div style={{ fontSize: 11, color: t3, marginTop: 4 }}>Recursos disponibles ahora mismo</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {ENERGIES.map(e => (
                <button key={e.v} onClick={() => setEnergy(e.v)} style={{ flex: 1, padding: "16px 8px", borderRadius: 13, border: energy === e.v ? `2px solid ${ac}` : `1.5px solid ${bd}`, background: energy === e.v ? ac + "10" : cd, cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: energy === e.v ? ac : t1 }}>{e.label}</div>
                  <div style={{ fontSize: 9, color: t3, marginTop: 4 }}>{e.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={next} disabled={!energy} style={{ width: "100%", padding: "14px", borderRadius: 50, background: energy ? ac : bd, border: "none", color: energy ? "#fff" : t3, fontSize: 12, fontWeight: 800, cursor: energy ? "pointer" : "default", letterSpacing: 2, textTransform: "uppercase" }}>CONTINUAR</button>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fi .4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: t1 }}>¿Qué necesitas hoy?</div>
              <div style={{ fontSize: 11, color: t3, marginTop: 4 }}>Tu intención principal</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              {INTENTS_CAL.map(i => (
                <button key={i.id} onClick={() => setIntent(i.id)} style={{ padding: "16px 10px", borderRadius: 13, border: intent === i.id ? `2px solid ${i.color}` : `1.5px solid ${bd}`, background: intent === i.id ? i.color + "10" : cd, cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                  <Ic name={i.icon} size={22} color={intent === i.id ? i.color : t3} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: intent === i.id ? i.color : t1, marginTop: 6 }}>{i.label}</div>
                  <div style={{ fontSize: 9, color: t3, marginTop: 2, lineHeight: 1.3 }}>{i.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => onComplete({ mood, energy, intent: intent || "calma" })}
              disabled={!intent}
              style={{ width: "100%", padding: "16px", borderRadius: 50, background: intent ? ac : bd, border: "none", color: intent ? "#fff" : t3, fontSize: 12, fontWeight: 800, cursor: intent ? "pointer" : "default", letterSpacing: 2, textTransform: "uppercase", animation: intent ? "gl 2s ease infinite" : "none" }}
            >COMPLETAR CALIBRACIÓN</button>
          </div>
        )}
      </div>
    </div>
  );
}
