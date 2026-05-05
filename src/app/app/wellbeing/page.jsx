/* /app/wellbeing — Phase 6F SP-F
   ═══════════════════════════════════════════════════════════════
   Vista standalone del wellbeing assessment + signals + sparkline
   historial + crisis resources. Server component pattern (clon de
   /app/program/today SP-B): auth + buildSnapshot + assess + render.

   Decision A3 + B3: el banner en HomeV2 trae al user aquí cuando
   level≥warn. Esta página es destino del CTA "Ver detalle".

   Decision Task 5.2 Opción B: query directo a BurnoutScore.findMany
   para sparkline history (NO endpoint /history dedicado).

   Marketing copy (D8): NO "burnout score" — eyebrow "WELLBEING TRENDS",
   disclaimer SAPTEL prominente, methodology footer.
   ═══════════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { buildUserSnapshot } from "@/server/snapshot";
import { assessBurnoutEnhanced, wellbeingCopy } from "@/lib/burnoutEnhanced";
import WellbeingSignalsList from "@/components/app/v2/wellbeing/WellbeingSignalsList";
import WellbeingSparkline from "@/components/app/v2/wellbeing/WellbeingSparkline";
import { colors, typography, spacing, radii, withAlpha, layout } from "@/components/app/v2/tokens";

export const metadata = { title: "Wellbeing trends" };
export const dynamic = "force-dynamic";

const DEFAULT_DAYS = 28;
const HISTORY_DAYS = 90;
const MIN_DAYS = 7;
const MAX_DAYS = 90;

export default async function WellbeingPage(props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/app/wellbeing");
  }

  const searchParams = await Promise.resolve(props?.searchParams).catch(() => ({}));
  const daysRaw = Number(searchParams?.days || DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(daysRaw)))
    : DEFAULT_DAYS;

  const snapshot = await buildUserSnapshot(session.user.id, { days });
  if (!snapshot) {
    return <SinDatosBlock />;
  }

  const assessment = assessBurnoutEnhanced(snapshot);
  const copy = wellbeingCopy(assessment.level);

  // History para sparkline — server query directo (Decision Task 5.2 Opción B).
  const orm = await db();
  let history = [];
  try {
    history = await orm.burnoutScore.findMany({
      where: {
        userId: session.user.id,
        computedAt: { gte: new Date(Date.now() - HISTORY_DAYS * 86400_000) },
      },
      orderBy: { computedAt: "asc" },
    });
  } catch {
    history = [];
  }

  await auditLog({
    actorId: session.user.id,
    orgId: snapshot.user?.orgId || undefined,
    action: "me.wellbeing.viewed",
    target: session.user.id,
    payload: {
      level: assessment.level,
      signalsCount: assessment.signals?.length || 0,
      historyN: history.length,
      days,
    },
  }).catch(() => {});

  return (
    <main
      data-v2-wellbeing-page
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
        <div style={eyebrowStyle}>Wellbeing trends · {days} días</div>
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
          {copy.title}
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
          {copy.subtitle}
        </p>
      </header>

      <section
        data-v2-wellbeing-signals-section
        style={{ display: "flex", flexDirection: "column", gap: spacing.s16 }}
      >
        <div style={eyebrowStyle}>
          Señales detectadas · {assessment.signals?.length || 0}
        </div>
        <WellbeingSignalsList
          signals={assessment.signals}
          metrics={assessment.metrics}
        />
      </section>

      <section
        data-v2-wellbeing-history-section
        style={{ display: "flex", flexDirection: "column", gap: spacing.s16 }}
      >
        <div style={eyebrowStyle}>
          Historial · {HISTORY_DAYS} días
        </div>
        <WellbeingSparkline history={history} />
      </section>

      {copy.cta && (
        <section data-v2-wellbeing-cta-section>
          <a
            href={copy.cta.target}
            data-testid="wellbeing-page-primary-cta"
            style={{
              appearance: "none",
              background: colors.accent.phosphorCyan,
              color: colors.bg.base,
              border: "none",
              borderRadius: radii.pill,
              padding: `${spacing.s8 + 6}px ${spacing.s16 + 8}px`,
              fontFamily: typography.family,
              fontSize: 12,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              minBlockSize: 48,
            }}
          >
            {copy.cta.label}
          </a>
        </section>
      )}

      <CrisisResourcesBlock />

      <DisclaimerFooter snapshot={assessment.snapshot} />
    </main>
  );
}

function CrisisResourcesBlock() {
  return (
    <section
      data-v2-wellbeing-crisis
      style={{
        background: withAlpha(colors.accent.phosphorCyanRgb, 6),
        border: `0.5px solid ${withAlpha(colors.accent.phosphorCyanRgb, 24)}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      <div style={{ ...eyebrowStyle, color: colors.accent.phosphorCyan }}>
        Recursos de apoyo · 24/7
      </div>
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontSize: typography.size.bodyMin,
        color: colors.text.strong,
        lineHeight: 1.5,
      }}>
        Si necesitas hablar con alguien, estas líneas profesionales son gratuitas y confidenciales:
      </p>
      <ul
        data-v2-crisis-resources
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}
      >
        <li style={resourceRowStyle}>
          <span style={resourceNameStyle}>SAPTEL</span>
          <a
            href="tel:8002900024"
            data-testid="wellbeing-page-saptel-link"
            style={resourcePhoneStyle}
          >
            800 290 0024
          </a>
        </li>
        <li style={resourceRowStyle}>
          <span style={resourceNameStyle}>Línea de la Vida</span>
          <a href="tel:8009112000" style={resourcePhoneStyle}>
            800 911 2000
          </a>
        </li>
        <li>
          <a
            href="/app/resources/crisis"
            data-testid="wellbeing-page-resources-link"
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              color: colors.accent.phosphorCyan,
              textDecoration: "none",
            }}
          >
            Ver más recursos →
          </a>
        </li>
      </ul>
    </section>
  );
}

function DisclaimerFooter({ snapshot }) {
  return (
    <footer
      data-v2-wellbeing-disclaimer
      style={{
        marginBlockStart: spacing.s8,
        paddingBlockStart: spacing.s16,
        borderBlockStart: `0.5px solid ${colors.separator}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontSize: typography.size.caption,
        color: colors.text.muted,
        lineHeight: 1.55,
      }}>
        {snapshot?.disclaimer}
      </p>
      {snapshot?.methodology && (
        <p style={{
          margin: 0,
          fontFamily: typography.familyMono,
          fontSize: 10,
          letterSpacing: "0.08em",
          color: colors.text.muted,
          opacity: 0.7,
        }}>
          Methodology: {snapshot.methodology} · Version {snapshot.version || "v1"}
        </p>
      )}
    </footer>
  );
}

function SinDatosBlock() {
  return (
    <main
      data-v2-wellbeing-no-data
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
        gap: spacing.s16,
      }}
    >
      <a href="/app" style={{ color: colors.text.muted, textDecoration: "none" }}>
        ← Volver
      </a>
      <h1 style={{ margin: 0, color: colors.text.strong }}>
        Sin datos
      </h1>
      <p style={{ color: colors.text.secondary, lineHeight: 1.55 }}>
        Necesitamos más actividad reciente para evaluar tu wellbeing. Continúa
        usando Bio-Ignición y vuelve a esta vista en unos días.
      </p>
    </main>
  );
}

const eyebrowStyle = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.microCaps,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: colors.text.muted,
  fontWeight: typography.weight.medium,
};

const resourceRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.s8,
};

const resourceNameStyle = {
  fontFamily: typography.family,
  fontSize: typography.size.bodyMin,
  fontWeight: typography.weight.medium,
  color: colors.text.strong,
};

const resourcePhoneStyle = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.body,
  fontWeight: typography.weight.medium,
  color: colors.accent.phosphorCyan,
  letterSpacing: "0.04em",
  textDecoration: "none",
};
