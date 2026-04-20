"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font } from "@/components/ui/tokens";

const CURRENCIES = {
  USD: { symbol: "$",  rate: 1,    decimals: 0, code: "USD" },
  MXN: { symbol: "$",  rate: 18.5, decimals: 0, code: "MXN" },
  EUR: { symbol: "€",  rate: 0.92, decimals: 0, code: "EUR" },
};

function fmtPrice(priceUsd, cur, annual) {
  if (priceUsd == null) return null;
  const base = annual ? priceUsd * 0.8 : priceUsd;
  const converted = base * cur.rate;
  const rounded = cur.code === "MXN"
    ? Math.round(converted / 5) * 5
    : Math.round(converted);
  return `${cur.symbol}${rounded}`;
}

function fmtAnnualTotal(priceUsd, cur) {
  if (priceUsd == null) return null;
  const annualPerSeat = priceUsd * 0.8 * 12;
  const converted = annualPerSeat * cur.rate;
  const rounded = cur.code === "MXN"
    ? Math.round(converted / 10) * 10
    : Math.round(converted);
  return `${cur.symbol}${rounded.toLocaleString()}`;
}

export default function PricingCards({ plans, copy }) {
  const [annual, setAnnual] = useState(true);
  const [currencyKey, setCurrencyKey] = useState("USD");
  const cur = CURRENCIES[currencyKey];

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: space[4],
          justifyContent: "center",
          alignItems: "center",
          marginBlockEnd: space[6],
        }}
      >
        <div role="tablist" aria-label={copy.cadenceLabel} className="bi-pricing-toggle">
          {[
            { id: false, label: copy.cadenceMonthly },
            { id: true,  label: copy.cadenceAnnual },
          ].map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              role="tab"
              className="bi-pricing-toggle-btn"
              aria-selected={annual === opt.id}
              onClick={() => setAnnual(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div role="tablist" aria-label={copy.currencyLabel} className="bi-pricing-toggle">
          {Object.entries(CURRENCIES).map(([key, c]) => (
            <button
              key={key}
              type="button"
              role="tab"
              className="bi-pricing-toggle-btn"
              aria-selected={currencyKey === key}
              onClick={() => setCurrencyKey(key)}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>

      <section
        aria-label={copy.plansLabel}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: space[5],
          alignItems: "stretch",
        }}
      >
        {plans.map((p) => {
          const priceDisplay = p.priceMonthly == null
            ? (p.customLabel || "Custom")
            : fmtPrice(p.priceMonthly, cur, annual);
          const unit = p.priceMonthly == null
            ? copy.unitCustom
            : annual ? copy.unitAnnualBilled : copy.unitMonthly;

          return (
            <article
              key={p.id}
              className="bi-pricing-card bi-spot"
              data-featured={p.featured ? "true" : undefined}
              aria-labelledby={`plan-${p.id}`}
            >
              {p.featured && <div className="bi-pricing-badge">{copy.featured}</div>}

              <div className="bi-pricing-kicker">{p.kicker}</div>
              <h2 id={`plan-${p.id}`} style={{
                margin: 0,
                fontSize: 26,
                fontWeight: font.weight.black,
                letterSpacing: "-0.02em",
                color: cssVar.text,
              }}>
                {p.name}
              </h2>
              <p style={{
                margin: `${space[2]}px 0 ${space[4]}px`,
                minHeight: 44,
                color: cssVar.textDim,
                fontSize: font.size.sm,
                lineHeight: 1.5,
              }}>
                {p.tagline}
              </p>

              <div className="bi-pricing-price">
                <span aria-live="polite" aria-atomic="true" className="bi-pricing-price-value">
                  {priceDisplay}
                </span>
                <span className="bi-pricing-price-unit">{unit}</span>
              </div>
              {p.priceMonthly != null && annual && (
                <p className="bi-pricing-annual-total" aria-live="polite">
                  <strong>{fmtAnnualTotal(p.priceMonthly, cur)}</strong> {copy.annualTotalSuffix || "/ user / year"}
                </p>
              )}
              <p aria-live="polite" style={{
                margin: `${space[1]}px 0 0`,
                fontSize: 12,
                color: cssVar.textMuted,
                minHeight: 18,
              }}>
                {p.priceMonthly == null
                  ? copy.customHint
                  : annual
                    ? copy.savingsHint
                        .replaceAll("{m}", fmtPrice(p.priceMonthly, cur, false))
                        .replaceAll("{a}", fmtPrice(p.priceMonthly, cur, true))
                        .replaceAll("{code}", cur.code)
                    : copy.crossSellHint
                        .replaceAll("{a}", fmtPrice(p.priceMonthly, cur, true))
                        .replaceAll("{code}", cur.code)}
              </p>

              <div className="bi-pricing-meta">
                <span className="bi-pricing-meta-item">
                  <span>{copy.seatsLabel}</span>
                  <strong>{p.seats}</strong>
                </span>
                <span className="bi-pricing-meta-item">
                  <span>{copy.trialLabel}</span>
                  <strong>{p.trial}</strong>
                </span>
              </div>

              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: `0 0 ${space[5]}px`,
                fontSize: font.size.sm,
                lineHeight: 1.7,
                display: "grid",
                gap: 6,
              }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: space[2], alignItems: "flex-start" }}>
                    <span aria-hidden style={{
                      color: p.featured ? "#22D3EE" : cssVar.accent,
                      fontWeight: font.weight.bold,
                      marginTop: 1,
                    }}>✓</span>
                    <span style={{ color: cssVar.text }}>{f}</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: "auto" }}>
                <Button
                  variant={p.featured ? "primary" : "secondary"}
                  className={p.featured ? "bi-ignite" : "bi-refined"}
                  href={p.cta.href}
                  block
                  style={p.featured ? {
                    height: 48,
                    fontWeight: font.weight.bold,
                    fontSize: font.size.md,
                  } : undefined}
                >
                  {p.cta.label}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
