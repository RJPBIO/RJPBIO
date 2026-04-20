"use client";
import { useState, useMemo } from "react";

/* PricingROICalc — interactive ROI widget. The client does simple
   math the server can't personalize: a seat slider drives a yearly
   cost estimate vs a category baseline, then subtracts an evidence-
   anchored productivity lift. All numbers are explicit and overridable
   by the copy prop so i18n + disclosure stays honest. */
export default function PricingROICalc({ copy }) {
  const [seats, setSeats] = useState(copy.defaultSeats ?? 60);

  const numbers = useMemo(() => {
    // Our rates (monthly USD, annual billed × 0.8 for 20% off)
    const ourPerSeatMo = copy.ourPerSeat ?? 39;
    const altPerSeatMo = copy.altPerSeat ?? 50;

    // Volume discount tiers
    const discount =
      seats >= 250 ? 0.20 :
      seats >= 100 ? 0.15 :
      seats >= 50  ? 0.10 : 0;

    const ourAnnualBase = seats * ourPerSeatMo * 12 * 0.8;     // 20% annual off
    const ourAnnual     = Math.round(ourAnnualBase * (1 - discount));
    const altAnnual     = Math.round(seats * altPerSeatMo * 12);

    // Productivity lift — conservative: 0.5h per seat per month saved
    // at ~$30 fully-loaded hourly cost = $15 / seat / mo → $180 / yr
    const liftPerSeatYr = copy.liftPerSeatYr ?? 180;
    const productivityLift = seats * liftPerSeatYr;

    const net = productivityLift - ourAnnual;
    const roi = ourAnnual > 0 ? (productivityLift / ourAnnual) : 0;

    return {
      ourAnnual,
      altAnnual,
      savingsVsAlt: altAnnual - ourAnnual,
      productivityLift,
      net,
      roiMultiple: roi,
      discount,
    };
  }, [seats, copy.ourPerSeat, copy.altPerSeat, copy.liftPerSeatYr]);

  const fmt = (n) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

  const min = copy.min ?? 5;
  const max = copy.max ?? 500;
  const pct = ((seats - min) / (max - min)) * 100;
  const roiMultipleLabel = copy.roiMultipleLabel ?? (numbers.roiMultiple >= 1
    ? `${numbers.roiMultiple.toFixed(1)}×`
    : "—");

  return (
    <div className="bi-roi-calc">
      <div className="bi-roi-calc-grid">
        <div className="bi-roi-calc-input">
          <label htmlFor="roi-seats">{copy.seatsLabel}</label>
          <div className="num" aria-live="polite" aria-atomic="true">
            {fmt(seats)} <small>{copy.seatsUnit}</small>
          </div>
          <div className="bi-roi-slider-wrap" style={{ "--bi-roi-progress": `${pct}%` }} data-progress={pct}>
            <input
              id="roi-seats"
              type="range"
              min={min}
              max={max}
              step={copy.step ?? 5}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              aria-valuenow={seats}
              aria-valuetext={`${fmt(seats)} ${copy.seatsUnit}`}
              list="roi-seats-ticks"
            />
            <datalist id="roi-seats-ticks">
              <option value="50" />
              <option value="100" />
              <option value="250" />
            </datalist>
            <div className="bi-roi-ticks" aria-hidden>
              {[50, 100, 250].filter((t) => t > min && t < max).map((t) => (
                <span
                  key={t}
                  className="bi-roi-tick"
                  style={{ "--bi-tick-pos": `${((t - min) / (max - min)) * 100}%` }}
                  data-active={seats >= t ? "true" : undefined}
                />
              ))}
            </div>
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--bi-text-muted)",
            letterSpacing: "0.14em", textTransform: "uppercase",
            marginBlockStart: 6,
          }}>
            <span>{min}</span>
            <span>{max}</span>
          </div>
          {numbers.discount > 0 && (
            <p style={{
              marginBlockStart: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#22D3EE",
              fontWeight: 700,
            }}>
              {copy.volumeApplied} −{Math.round(numbers.discount * 100)}%
            </p>
          )}
        </div>

        <div className="bi-roi-calc-out">
          <div className="bi-roi-calc-line">
            <span className="k">{copy.rowOur}</span>
            <span className="v">${fmt(numbers.ourAnnual)}</span>
          </div>
          <div className="bi-roi-calc-line">
            <span className="k">{copy.rowAlt}</span>
            <span className="v">${fmt(numbers.altAnnual)}</span>
          </div>
          <div className="bi-roi-calc-line">
            <span className="k">{copy.rowLift}</span>
            <span className="v">${fmt(numbers.productivityLift)}</span>
          </div>
          <div className="bi-roi-calc-line net">
            <span className="k">{copy.rowNet}</span>
            <span className="v">${fmt(numbers.net)}</span>
          </div>
          {numbers.roiMultiple > 0 && (
            <div className="bi-roi-multiple" aria-live="polite">
              <span className="bi-roi-multiple-value">{roiMultipleLabel}</span>
              <span className="bi-roi-multiple-label">{copy.roiMultipleSub ?? "ROI anual estimado"}</span>
            </div>
          )}
          <p style={{
            marginBlockStart: 14,
            fontSize: 12,
            color: "var(--bi-text-muted)",
            lineHeight: 1.5,
          }}>
            {copy.disclosure}
          </p>
        </div>
      </div>
    </div>
  );
}
