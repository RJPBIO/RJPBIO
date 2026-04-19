"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font, radius } from "@/components/ui/tokens";

function fmt(n) {
  return `$ ${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.00$/, "")}`;
}

export default function PricingCards({ plans, copy }) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <div
        role="tablist"
        aria-label={copy.cadenceLabel}
        style={{
          display: "inline-flex",
          padding: 4,
          borderRadius: radius.full,
          border: `1px solid ${cssVar.border}`,
          background: cssVar.surface,
          marginInline: "auto",
          marginBlockEnd: space[6],
        }}
      >
        {[
          { id: false, label: copy.cadenceMonthly },
          { id: true,  label: copy.cadenceAnnual },
        ].map((opt) => {
          const active = annual === opt.id;
          return (
            <button
              key={String(opt.id)}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setAnnual(opt.id)}
              style={{
                padding: `${space[2]}px ${space[4]}px`,
                borderRadius: radius.full,
                border: "none",
                background: active ? cssVar.accent : "transparent",
                color: active ? cssVar.accentInk : cssVar.textDim,
                fontSize: font.size.sm,
                fontWeight: font.weight.bold,
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <section
        aria-label={copy.plansLabel}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: space[5] }}
      >
        {plans.map((p) => {
          const priceDisplay = p.priceMonthly == null
            ? p.customLabel
            : annual
              ? fmt(p.priceMonthly * 0.8)
              : fmt(p.priceMonthly);
          const unit = p.priceMonthly == null
            ? copy.unitYear
            : annual
              ? copy.unitAnnualBilled
              : copy.unitMonthly;
          const hint = p.priceMonthly == null
            ? "\u00A0"
            : annual
              ? copy.savingsHint(fmt(p.priceMonthly), fmt(p.priceMonthly * 0.8))
              : copy.crossSellHint(fmt(p.priceMonthly * 0.8));

          return (
            <Card as="article" key={p.id} featured={p.featured} aria-labelledby={`plan-${p.id}`} padding={6}>
              {p.featured && (
                <div style={{
                  position: "absolute", top: -12, insetInlineStart: 20,
                  background: cssVar.accent, color: cssVar.accentInk,
                  padding: "3px 10px", borderRadius: 999,
                  fontSize: 11, fontWeight: font.weight.bold,
                  textTransform: "uppercase", letterSpacing: "1px",
                }}>
                  {copy.featured}
                </div>
              )}
              <h2 id={`plan-${p.id}`} style={{ margin: 0, fontSize: 22 }}>{p.name}</h2>
              <p style={{ minHeight: 52, color: cssVar.textDim, fontSize: 13, lineHeight: 1.5 }}>{p.tagline}</p>

              <div style={{ marginBlockStart: space[3], display: "flex", alignItems: "baseline", gap: space[2] }}>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  style={{ fontSize: 42, fontWeight: font.weight.black, fontFamily: cssVar.fontMono, letterSpacing: "-1px" }}
                >
                  {priceDisplay}
                </span>
                <span style={{ fontSize: 13, color: cssVar.textDim }}>{unit}</span>
              </div>
              <p
                aria-live="polite"
                style={{ minHeight: 18, margin: `${space[1]}px 0 ${space[3]}px`, fontSize: 12, color: cssVar.textMuted }}
              >
                {hint}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: `0 0 ${space[5]}px`, fontSize: 14, lineHeight: 1.8 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: space[2] }}>
                    <span aria-hidden style={{ color: cssVar.accent }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button variant={p.featured ? "primary" : "secondary"} href={p.cta.href} block>
                {p.cta.label}
              </Button>
            </Card>
          );
        })}
      </section>
    </>
  );
}
