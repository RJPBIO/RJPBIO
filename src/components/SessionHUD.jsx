"use client";
import { Ic } from "./Icons";

/**
 * SessionHUD — Heads-Up Display durante sesión activa
 *
 * Muestra EN TIEMPO REAL:
 * 1. Fase actual (1/6) con nombre y progreso
 * 2. Instrucción clave del protocolo (ph.k)
 * 3. Instrucción detallada expandible (ph.i)
 * 4. Respaldo neurocientífico (ph.sc)
 * 5. Siguiente fase (preview)
 * 6. Timeline visual de fases
 *
 * Lee directamente de /lib/protocols — cada campo ph[i].k, ph[i].i, ph[i].sc
 * se renderiza en contexto durante la ejecución.
 *
 * UI ADAPTATIVA según estado:
 * - STRESS → solo instrucción clave (mínimo estímulo)
 * - FOCUS → instrucción + ciencia
 * - OPTIMAL → todo visible
 * - BURNOUT → ultra minimal
 */
export function SessionHUD({
  pr, pi, sec, totalDur, durMult,
  ac, isDark, t1, t2, t3, bd,
  theme, isBr, bL, bCnt,
  sessionData, onInteraction,
}) {
  const ph = pr.ph[pi];
  const nextPh = pi < pr.ph.length - 1 ? pr.ph[pi + 1] : null;
  const scale = durMult || 1;
  const elapsed = totalDur - sec;

  // Calculate phase progress
  const phaseStart = Math.round(ph.s * scale);
  const phaseEnd = pi < pr.ph.length - 1
    ? Math.round(pr.ph[pi + 1].s * scale)
    : totalDur;
  const phaseDur = phaseEnd - phaseStart;
  const phaseElapsed = elapsed - phaseStart;
  const phasePct = Math.min(100, Math.max(0, Math.round((phaseElapsed / phaseDur) * 100)));

  // UI complexity based on neural state
  const complexity = theme.state === "critical" ? "minimal"
    : theme.state === "stressed" ? "reduced"
    : "full";

  // Seconds until next phase
  const secsToNext = nextPh ? Math.round(nextPh.s * scale) - elapsed : 0;

  return (
    <div style={{
      padding: "0 20px",
      marginTop: 12,
      animation: "fi .4s ease",
    }}>
      {/* ═══ PHASE TIMELINE ═══ */}
      <PhaseTimeline
        phases={pr.ph}
        currentIndex={pi}
        elapsed={elapsed}
        totalDur={totalDur}
        scale={scale}
        ac={ac}
        isDark={isDark}
        t3={t3}
      />

      {/* ═══ PHASE HEADER — Phase X/Y + Name ═══ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10, marginTop: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `${ac}10`,
            border: `1px solid ${ac}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic name={ph.ic || "bolt"} size={14} color={ac} />
          </div>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2,
              color: ac, textTransform: "uppercase",
            }}>
              Fase {pi + 1}/{pr.ph.length}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 800, color: t1,
              letterSpacing: "-0.3px",
            }}>{ph.l}</div>
          </div>
        </div>
        {/* Phase progress mini-bar */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: t3,
          }}>{phasePct}%</div>
          <div style={{
            width: 40, height: 3, borderRadius: 2,
            background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)",
            overflow: "hidden", marginTop: 3,
          }}>
            <div style={{
              width: phasePct + "%", height: "100%",
              background: ac, borderRadius: 2,
              transition: "width .95s linear",
            }} />
          </div>
        </div>
      </div>

      {/* ═══ KEY INSTRUCTION — always visible ═══ */}
      <div style={{
        padding: "14px 16px",
        background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.025)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${ac}12`,
        borderRadius: 16,
        marginBottom: 8,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Accent line */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: ac, borderRadius: "3px 0 0 3px",
        }} />
        <div style={{
          fontSize: 14, fontWeight: 700, color: t1,
          lineHeight: 1.55, paddingLeft: 4,
        }}>{ph.k}</div>
      </div>

      {/* ═══ DETAILED INSTRUCTION — expandable, shows in full/reduced complexity ═══ */}
      {complexity !== "minimal" && ph.i && (
        <details style={{ marginBottom: 8 }} onClick={() => onInteraction && onInteraction()}>
          <summary style={{
            padding: "10px 14px",
            background: isDark ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.015)",
            borderRadius: 14,
            border: `1px solid ${isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"}`,
            fontSize: 11, fontWeight: 600, color: t2,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Ic name="rec" size={10} color={t3} />
            Instrucciones detalladas
          </summary>
          <div style={{
            padding: "12px 14px",
            background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.01)",
            borderRadius: "0 0 14px 14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)"}`,
            borderTop: "none",
          }}>
            <div style={{
              fontSize: 12, color: t2, lineHeight: 1.7,
              fontWeight: 500,
            }}>{ph.i}</div>
          </div>
        </details>
      )}

      {/* ═══ NEUROSCIENCE BACKING — always visible in full mode ═══ */}
      {complexity === "full" && ph.sc && (
        <div style={{
          padding: "10px 14px",
          background: isDark ? "rgba(99,102,241,.04)" : "rgba(99,102,241,.03)",
          border: "1px solid rgba(99,102,241,.08)",
          borderRadius: 14,
          marginBottom: 8,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "rgba(99,102,241,.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
          }}>
            <Ic name="focus" size={10} color="#6366F1" />
          </div>
          <div style={{
            fontSize: 11, color: isDark ? "#818CF8" : "#6366F1",
            lineHeight: 1.6, fontWeight: 500,
            opacity: 0.85,
          }}>{ph.sc}</div>
        </div>
      )}

      {/* In reduced mode, show science as collapsible */}
      {complexity === "reduced" && ph.sc && (
        <details style={{ marginBottom: 8 }}>
          <summary style={{
            padding: "8px 12px",
            borderRadius: 12,
            fontSize: 10, fontWeight: 600, color: "#818CF8",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Ic name="focus" size={9} color="#6366F1" />
            Neurociencia
          </summary>
          <div style={{
            padding: "8px 12px",
            fontSize: 11, color: "#818CF8", lineHeight: 1.5,
            opacity: 0.8,
          }}>{ph.sc}</div>
        </details>
      )}

      {/* ═══ NEXT PHASE PREVIEW ═══ */}
      {nextPh && secsToNext <= 15 && secsToNext > 0 && (
        <div style={{
          padding: "10px 14px",
          background: isDark ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.015)",
          borderRadius: 14,
          border: `1px solid ${isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"}`,
          marginBottom: 8,
          animation: "fi .4s ease",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: `${ac}0A`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic name={nextPh.ic || "bolt"} size={11} color={ac} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
              color: ac, textTransform: "uppercase", opacity: 0.7,
            }}>Siguiente en {secsToNext}s</div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: t1,
            }}>{nextPh.l}</div>
          </div>
        </div>
      )}

      {/* ═══ ANTI-TRAMPA INDICATOR ═══ */}
      {sessionData && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, padding: "6px 0", marginTop: 4,
        }}>
          <SessionMetric
            label="Interacciones"
            value={sessionData.interactions || 0}
            target={3}
            color={ac}
            isDark={isDark}
            t3={t3}
          />
          <div style={{ width: 1, height: 14, background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)" }} />
          <SessionMetric
            label="Bio-Quality"
            value={sessionData.touchHolds > 0 ? "Activo" : "Pendiente"}
            color={sessionData.touchHolds > 0 ? "#10B981" : t3}
            isDark={isDark}
            t3={t3}
          />
        </div>
      )}
    </div>
  );
}

/**
 * PhaseTimeline — Visual phase progress bar
 * Shows all phases as segments, highlights current, fills completed.
 */
function PhaseTimeline({ phases, currentIndex, elapsed, totalDur, scale, ac, isDark, t3 }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {phases.map((ph, i) => {
        const phStart = Math.round(ph.s * scale);
        const phEnd = i < phases.length - 1
          ? Math.round(phases[i + 1].s * scale)
          : totalDur;
        const phDur = phEnd - phStart;
        const phElapsed = Math.max(0, elapsed - phStart);
        const pct = i < currentIndex ? 100
          : i === currentIndex ? Math.min(100, Math.round((phElapsed / phDur) * 100))
          : 0;
        const isActive = i === currentIndex;

        return (
          <div key={i} style={{
            flex: phDur, height: isActive ? 5 : 4,
            borderRadius: 3, overflow: "hidden",
            background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)",
            transition: "height .3s ease",
          }}>
            <div style={{
              width: pct + "%", height: "100%",
              background: isActive ? ac : `${ac}80`,
              borderRadius: 3,
              transition: "width .95s linear",
              boxShadow: isActive ? `0 0 6px ${ac}40` : "none",
            }} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * SessionMetric — Tiny inline metric for anti-cheat display
 */
function SessionMetric({ label, value, target, color, isDark, t3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: t3 }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color }}>
        {typeof value === "number" && target ? `${value}/${target}` : value}
      </span>
    </div>
  );
}
