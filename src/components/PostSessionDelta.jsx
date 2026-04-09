"use client";
import { Ic } from "./Icons";

const MOOD_LABELS = ["", "Muy bajo", "Bajo", "Neutro", "Bien", "Pico"];
const MOOD_COLORS = ["", "#DC2626", "#F59E0B", "#64748B", "#10B981", "#0EA5E9"];

function deltaMessage(d) {
  if (d >= 2) return { title: "Transformación profunda", body: "Tu sistema acaba de dar un salto. Esto es lo que pasa cuando confías en el proceso." };
  if (d === 1) return { title: "Cambio real registrado", body: "Subiste un nivel completo. Tu cerebro acaba de aprender algo nuevo." };
  if (d === 0) return { title: "Sostuviste tu estado", body: "Mantenerte estable es una victoria. No siempre se trata de subir." };
  if (d <= -1) return { title: "Tu estado bajó", body: "A veces el sistema necesita procesar. La conciencia es el primer paso." };
  return { title: "Sesión completada", body: "Cada ignición construye tu base." };
}

export function PostSessionDelta({ preMood, postMood, postVC, bioQuality, protocol, duration, isDark, ac, t1, t2, t3, bd, cd, onContinue }) {
  const delta = (postMood || 0) - (preMood || 0);
  const msg = deltaMessage(delta);
  const deltaColor = delta > 0 ? "#10B981" : delta < 0 ? "#DC2626" : t2;
  const showBars = preMood > 0 && postMood > 0;

  return (
    <div style={{ background: isDark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.96)", borderRadius: 24, padding: "24px 20px", maxWidth: 400, width: "100%", animation: "deltaReveal .6s cubic-bezier(.34,1.56,.64,1)", border: "1px solid " + bd }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ width: 60, height: 60, margin: "0 auto 12px", borderRadius: "50%", background: `radial-gradient(circle at 40% 40%, ${ac}30, ${ac}10, transparent)`, animation: "pu 3s ease infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: ac, opacity: .5 }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: t1 }}>{msg.title}</div>
        <div style={{ fontSize: 11, color: t2, marginTop: 6, lineHeight: 1.5 }}>{msg.body}</div>
      </div>

      {showBars && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 18, padding: "16px 12px", marginBottom: 14, background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 42, height: 70, background: bd, borderRadius: 8, position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", background: MOOD_COLORS[preMood], height: `${(preMood / 5) * 100}%`, borderRadius: 8, transition: "height .8s ease", animation: "barFill .8s ease" }} />
            </div>
            <Ic name="user" size={14} color={MOOD_COLORS[preMood]} />
            <div style={{ fontSize: 9, color: t3, marginTop: 2, fontWeight: 700 }}>ANTES</div>
            <div style={{ fontSize: 10, color: MOOD_COLORS[preMood], fontWeight: 700 }}>{MOOD_LABELS[preMood]}</div>
          </div>

          <div style={{ paddingBottom: 28, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: deltaColor, lineHeight: 1 }}>{delta > 0 ? "+" + delta : delta === 0 ? "=" : delta}</div>
            <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>delta</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ width: 42, height: 70, background: bd, borderRadius: 8, position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", background: MOOD_COLORS[postMood], height: `${(postMood / 5) * 100}%`, borderRadius: 8, transition: "height .8s ease", animation: "barFill 1s ease" }} />
            </div>
            <Ic name="user" size={14} color={MOOD_COLORS[postMood]} />
            <div style={{ fontSize: 9, color: t3, marginTop: 2, fontWeight: 700 }}>DESPUÉS</div>
            <div style={{ fontSize: 10, color: MOOD_COLORS[postMood], fontWeight: 700 }}>{MOOD_LABELS[postMood]}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, padding: "10px 8px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 11, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: ac }}>+{postVC}</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>V-Cores</div>
        </div>
        {bioQuality && (
          <div style={{ flex: 1, padding: "10px 8px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 11, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: bioQuality.quality === "alta" ? "#10B981" : bioQuality.quality === "media" ? "#F59E0B" : "#DC2626" }}>{bioQuality.score}</div>
            <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>Bio-Quality</div>
          </div>
        )}
        <div style={{ flex: 1, padding: "10px 8px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 11, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t1 }}>{duration}s</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>duración</div>
        </div>
      </div>

      {bioQuality && (
        <div style={{ display: "flex", gap: 4, marginBottom: 14, padding: "8px 10px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 9 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t1 }}>{bioQuality.iScore}%</div>
            <div style={{ fontSize: 8, color: t3 }}>interacción</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t1 }}>{bioQuality.tScore}%</div>
            <div style={{ fontSize: 8, color: t3 }}>presencia</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t1 }}>{bioQuality.mScore}%</div>
            <div style={{ fontSize: 8, color: t3 }}>movimiento</div>
          </div>
        </div>
      )}

      <button onClick={onContinue} style={{ width: "100%", padding: "14px", borderRadius: 50, background: ac, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" }}>CONTINUAR</button>
    </div>
  );
}
