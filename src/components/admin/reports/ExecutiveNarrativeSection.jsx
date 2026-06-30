/* ═══════════════════════════════════════════════════════════════
   ExecutiveNarrativeSection — el resumen ejecutivo que lidera el dossier.
   ───────────────────────────────────────────────────────────────
   Renderiza la narrativa (lib/executiveNarrative + server LLM wrapper):
   lead + secciones (Qué funcionó / A vigilar / Correlación / Próximos 90
   días). Prosa interpretativa sobre datos agregados — lo que vuelve el
   panel un documento que el CHRO presenta al board. Server component;
   mismo ADN que el resto de OrgExecutiveReport (pantalla + print).
   ═══════════════════════════════════════════════════════════════ */
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";

export default function ExecutiveNarrativeSection({ narrative }) {
  if (!narrative || !narrative.summary) return null;
  const sections = Array.isArray(narrative.sections) ? narrative.sections : [];

  return (
    <section
      data-v2-executive-narrative
      aria-label="Resumen ejecutivo"
      style={{
        padding: space[5],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        display: "flex",
        flexDirection: "column",
        gap: space[4],
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: bioSignal.phosphorCyanInk,
          fontWeight: font.weight.semibold,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: bioSignal.phosphorCyan,
            boxShadow: `0 0 8px ${bioSignal.phosphorCyan}`,
          }}
        />
        Resumen ejecutivo
      </div>

      {/* Lead */}
      <p
        style={{
          margin: 0,
          fontSize: font.size.lg,
          fontWeight: font.weight.medium,
          color: cssVar.text,
          letterSpacing: font.tracking.tight,
          lineHeight: 1.5,
        }}
      >
        {narrative.summary}
      </p>

      {/* Secciones */}
      {sections.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: space[4],
          }}
        >
          {sections.map((s, i) => (
            <div key={`${s.title}-${i}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  fontFamily: cssVar.fontMono,
                  fontSize: font.size.xs,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: cssVar.textDim,
                  fontWeight: font.weight.semibold,
                }}
              >
                {s.title}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: font.size.sm,
                  color: cssVar.textMuted,
                  lineHeight: 1.55,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          margin: 0,
          fontSize: font.size.xs,
          color: cssVar.textDim,
          lineHeight: 1.5,
        }}
      >
        Síntesis automática sobre datos agregados (k≥5). Interpretación orientativa, no diagnóstica.
      </p>
    </section>
  );
}
