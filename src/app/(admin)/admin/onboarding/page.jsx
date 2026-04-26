import Link from "next/link";
import { resolveOrg } from "../../../../server/tenancy";
import { gatherOnboardingState } from "../../../../server/onboarding";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
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
    <article style={{
      maxWidth: 880,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
    }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: space[3] }}>
        <div>
          <h1 style={{
            fontSize: font.size["2xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
            margin: 0,
          }}>
            Configuración inicial
          </h1>
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
            {summary.done}/{summary.total} completados ({summary.percent}%)
            {criticalDone && (
              <span style={{ marginInlineStart: space[2], color: "#10B981" }}>
                · Critical-level ✓
              </span>
            )}
          </p>
        </div>
        <Badge variant={criticalDone ? "success" : "warn"} size="sm">
          {criticalDone ? "Production-ready" : "Pendiente"}
        </Badge>
      </header>

      <div style={{ marginTop: space[3] }}>
        <Progress value={summary.done} max={summary.total} tone="accent" size="md" />
      </div>

      {/* Per-category breakdown */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: space[2],
        marginBlockStart: space[4],
      }}>
        {ONBOARDING_CATEGORIES.map((cat) => {
          const c = summary.byCategory[cat];
          if (!c || c.total === 0) return null;
          const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
          return (
            <div key={cat} style={{
              padding: space[3],
              background: cssVar.surface,
              border: `1px solid ${cssVar.border}`,
              borderRadius: radius.sm,
            }}>
              <div style={{
                fontSize: font.size.xs,
                color: cssVar.textDim,
                textTransform: "uppercase",
                letterSpacing: font.tracking.wide,
                fontWeight: font.weight.semibold,
              }}>
                {categoryLabel(cat)}
              </div>
              <div style={{
                marginTop: space[1],
                fontSize: font.size.xl,
                fontWeight: font.weight.black,
                color: pct === 100 ? "#10B981" : cssVar.text,
                fontFamily: cssVar.fontMono,
              }}>
                {c.done}/{c.total}
              </div>
              <div style={{ fontSize: font.size.xs, color: cssVar.textMuted, marginTop: 2 }}>
                {pct}%
              </div>
            </div>
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
