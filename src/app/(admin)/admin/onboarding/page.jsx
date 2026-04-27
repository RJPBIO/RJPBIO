import Link from "next/link";
import { resolveOrg } from "../../../../server/tenancy";
import { gatherOnboardingState } from "../../../../server/onboarding";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { KPITile } from "@/components/admin/KPITile";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  evaluateSteps, summarizeProgress, isCriticalComplete,
  stepsForCategory, categoryLabel, importanceLabel,
  ONBOARDING_CATEGORIES, IMPORTANCE_TONE,
} from "@/lib/onboarding";

export const dynamic = "force-dynamic";

const TONE_VARIANT = {
  danger: "danger",
  warn: "warn",
  soft: "soft",
};

export default async function Onboarding() {
  const org = await resolveOrg();
  if (!org) return null;

  const state = await gatherOnboardingState(org.id);
  if (!state) return null;

  const steps = evaluateSteps(state.evidence);
  const summary = summarizeProgress(steps);
  const criticalDone = isCriticalComplete(steps);

  return (
    <article style={{ color: cssVar.text, fontFamily: cssVar.fontSans }}>
      <PageHeader
        eyebrow="Setup · production-readiness"
        italic="Enciende"
        title="tu organización."
        subtitle={`${summary.done}/${summary.total} completados — ${summary.percent}% del camino${criticalDone ? ". Critical-level ✓" : ""}.`}
        actions={
          <Badge variant={criticalDone ? "success" : "warn"} size="md">
            {criticalDone ? "Production-ready" : "Pendiente"}
          </Badge>
        }
      />

      <div>
        <Progress value={summary.done} max={summary.total} tone="accent" size="md" />
      </div>

      {/* Per-category breakdown — editorial KPI tiles */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: space[3],
        marginBlockStart: space[4],
      }}>
        {ONBOARDING_CATEGORIES.map((cat) => {
          const c = summary.byCategory[cat];
          if (!c || c.total === 0) return null;
          const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
          return (
            <KPITile
              key={cat}
              label={categoryLabel(cat)}
              value={`${c.done}/${c.total}`}
              sub={`${pct}% completado`}
              tone={pct === 100 ? "success" : pct >= 50 ? "signal" : "neutral"}
              glow={pct === 100}
            />
          );
        })}
      </div>

      {summary.percent === 100 && (
        <div role="status" style={{
          marginTop: space[4],
          padding: space[4],
          background: cssVar.accentSoft,
          border: `1px solid ${cssVar.accent}`,
          borderRadius: radius.md,
          color: cssVar.text,
        }}>
          <strong style={{ color: cssVar.accent }}>Listo ✓</strong>
          <span style={{ marginInlineStart: space[2], color: cssVar.textMuted, fontSize: font.size.sm }}>
            Tu organización está completamente configurada. Puedes seguir afinando cualquier paso desde su sección.
          </span>
        </div>
      )}

      {/* Sections per category */}
      {ONBOARDING_CATEGORIES.map((cat) => {
        const inCat = stepsForCategory(steps, cat);
        if (inCat.length === 0) return null;
        return (
          <section key={cat} style={{ marginBlockStart: space[5] }}>
            <h2 style={{
              fontSize: font.size.lg,
              fontWeight: font.weight.bold,
              margin: 0,
              color: cssVar.text,
            }}>
              {categoryLabel(cat)}
            </h2>
            <ol style={{
              listStyle: "none",
              padding: 0,
              margin: `${space[3]}px 0 0`,
              display: "grid",
              gap: space[2],
            }}>
              {inCat.map((s) => (
                <li
                  key={s.id}
                  style={{
                    padding: space[3],
                    border: `1px solid ${s.done ? cssVar.accent : cssVar.border}`,
                    borderRadius: radius.md,
                    background: s.done ? cssVar.accentSoft : cssVar.surface,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: space[3],
                  }}
                >
                  <span style={{
                    color: s.done ? cssVar.accent : cssVar.text,
                    fontWeight: font.weight.medium,
                    display: "flex",
                    alignItems: "center",
                    gap: space[2],
                    flex: 1,
                  }}>
                    <span aria-hidden style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 22,
                      height: 22,
                      borderRadius: radius.full,
                      background: s.done ? cssVar.accent : "transparent",
                      color: s.done ? cssVar.accentInk : cssVar.textMuted,
                      border: s.done ? "none" : `1px solid ${cssVar.border}`,
                      fontSize: 12,
                      fontWeight: font.weight.bold,
                      flexShrink: 0,
                    }}>
                      {s.done ? "✓" : ""}
                    </span>
                    <span className="bi-sr-only">{s.done ? "Completado:" : "Pendiente:"}</span>
                    <span>{s.label}</span>
                    <Badge
                      variant={TONE_VARIANT[IMPORTANCE_TONE[s.importance]] || "soft"}
                      size="sm"
                    >
                      {importanceLabel(s.importance)}
                    </Badge>
                  </span>
                  <Link
                    href={s.href}
                    prefetch
                    style={{
                      color: cssVar.accent,
                      fontWeight: font.weight.semibold,
                      fontSize: font.size.sm,
                      textDecoration: "none",
                      flexShrink: 0,
                    }}
                  >
                    {s.done ? "Revisar →" : "Ir →"}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </article>
  );
}
