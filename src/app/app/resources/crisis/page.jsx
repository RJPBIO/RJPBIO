/* /app/resources/crisis — Phase 6F SP-F
   ═══════════════════════════════════════════════════════════════
   Página pública (no requiere auth — accessible incluso si user
   no logueado, porque alguien en crisis no debería pasar por auth
   gate). Lista recursos profesionales de salud mental con tel:
   links + horarios + región.

   Marketing copy (D8): "Bio-Ignición no es dispositivo médico ni
   sustituye atención profesional" + reminder explícito de buscar
   psicólogo/psiquiatra certificado.
   ═══════════════════════════════════════════════════════════════ */

import { colors, typography, spacing, radii, withAlpha, layout } from "@/components/app/v2/tokens";

export const metadata = {
  title: "Recursos de apoyo · Bio-Ignición",
  description: "Líneas profesionales de salud mental disponibles 24/7 en México.",
};

const RESOURCES = [
  {
    name: "SAPTEL",
    description: "Línea de apoyo emocional gratuita y confidencial 24 horas, 365 días al año (México)",
    phone: "800 290 0024",
    href: "tel:8002900024",
    region: "Nacional",
    primary: true,
  },
  {
    name: "Línea de la Vida",
    description: "Línea de prevención del suicidio y atención de crisis emocionales (México)",
    phone: "800 911 2000",
    href: "tel:8009112000",
    region: "Nacional",
    primary: true,
  },
  {
    name: "Cruz Roja Mexicana · Atención emocional",
    description: "Atención psicológica gratuita 24/7",
    phone: "55 5557 5757",
    href: "tel:5555575757",
    region: "Ciudad de México",
  },
  {
    name: "INPRFM Salud Mental",
    description: "Instituto Nacional de Psiquiatría — orientación y referencia a tratamiento",
    phone: "55 4160 5160",
    href: "tel:5541605160",
    region: "Ciudad de México",
  },
  {
    name: "UNAM · Línea de Atención Psicológica",
    description: "Apoyo psicológico estudiantes UNAM y comunidad",
    phone: "55 5025 0855",
    href: "tel:5550250855",
    region: "Ciudad de México",
  },
];

export default function CrisisResourcesPage() {
  return (
    <main
      data-v2-crisis-resources-page
      style={{
        minBlockSize: "100dvh",
        background: colors.bg.base,
        color: colors.text.primary,
        paddingBlock: spacing.s32,
        paddingInline: layout.contentPadInline,
        maxInlineSize: layout.maxContentWidth,
        marginInline: "auto",
        display: "flex",
        flexDirection: "column",
        gap: spacing.s24,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href="/app"
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
            textDecoration: "none",
          }}
        >
          ← Volver
        </a>
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
          }}
        >
          Recursos de apoyo
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 32,
            fontWeight: typography.weight.light,
            color: colors.text.strong,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          Líneas profesionales de salud mental
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            lineHeight: 1.55,
          }}
        >
          Si te encuentras en crisis o necesitas apoyo emocional, estas líneas
          profesionales están disponibles. Llamar es <strong>gratuito y confidencial</strong>.
        </p>
      </header>

      <section
        data-v2-resources-list
        aria-label="Líneas de apoyo profesional"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}
      >
        {RESOURCES.map((r) => (
          <ResourceCard key={r.name} resource={r} />
        ))}
      </section>

      <section
        data-v2-medical-disclaimer
        aria-label="Recordatorio importante"
        style={{
          marginBlockStart: spacing.s16,
          padding: spacing.s16,
          background: colors.bg.raised,
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panel,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
          }}
        >
          Recordatorio importante
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            color: colors.text.secondary,
            lineHeight: 1.55,
          }}
        >
          Bio-Ignición <strong>no es un dispositivo médico</strong> ni sustituye atención
          profesional. Las señales de wellbeing que muestra son indicadores sugerentes,
          no diagnósticos. Si necesitas ayuda profesional, contacta a un psicólogo o
          psiquiatra certificado.
        </p>
      </section>
    </main>
  );
}

function ResourceCard({ resource }) {
  const { name, description, phone, href, region, primary } = resource;
  const accent = primary
    ? withAlpha(colors.accent.phosphorCyanRgb, 8)
    : colors.bg.raised;
  const border = primary
    ? withAlpha(colors.accent.phosphorCyanRgb, 24)
    : colors.separator;
  return (
    <article
      data-v2-resource-card
      data-primary={primary || undefined}
      style={{
        background: accent,
        border: `0.5px solid ${border}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: spacing.s8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
          }}
        >
          {name}
        </h2>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          {region}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.secondary,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <a
        href={href}
        data-testid={`resource-tel-${phone.replace(/\s/g, "")}`}
        style={{
          appearance: "none",
          background: primary ? colors.accent.phosphorCyan : "transparent",
          color: primary ? colors.bg.base : colors.accent.phosphorCyan,
          border: primary ? "none" : `0.5px solid ${colors.accent.phosphorCyan}`,
          borderRadius: radii.pill,
          padding: `${spacing.s8 + 4}px ${spacing.s16}px`,
          fontFamily: typography.familyMono,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.06em",
          textDecoration: "none",
          alignSelf: "flex-start",
          minBlockSize: 44,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {phone}
      </a>
    </article>
  );
}
