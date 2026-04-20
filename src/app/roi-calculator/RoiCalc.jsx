"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Field, inputStyle } from "@/components/ui/Field";
import { cssVar, space, font } from "@/components/ui/tokens";
import { useT } from "@/hooks/useT";
import { fmtNumber } from "@/lib/i18n";

const DEFAULTS = {
  effectSizeCap: 0.35,
  residualFactor: 2.0,
  sessionsPerDay: 2,
  sessionMinutes: 3,
  workDays: 220,
  complianceRate: 0.6,
};

const SCENARIOS = {
  conservador: { lift: 0.15, labelEs: "Conservador", labelEn: "Conservative", hintEs: "15% lift", hintEn: "15% lift" },
  baseline: { lift: 0.22, labelEs: "Baseline", labelEn: "Baseline", hintEs: "22% lift · observado", hintEn: "22% lift · observed" },
  agresivo: { lift: 0.30, labelEs: "Agresivo", labelEn: "Aggressive", hintEs: "30% lift · < cap", hintEn: "30% lift · < cap" },
};

const PLAN_PRICE = { starter: 9, growth: 19, enterprise: 29 };
const STORAGE_KEY = "bio-roi-inputs-v2";
const MERCER_MEDIAN_USD = 900;

function fmtMoney(n, curr, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(n);
}

const INITIAL = { employees: 120, hourlyCost: 60, plan: "growth", currency: "USD", scenario: "baseline" };
const CLAMP = { employees: { min: 1, max: 100000 }, hourlyCost: { min: 5, max: 500 } };

export default function RoiCalc() {
  const { t, locale } = useT();
  const en = locale === "en";
  const [inputs, setInputs] = useState(INITIAL);
  const [drafts, setDrafts] = useState({ employees: "", hourlyCost: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setInputs((prev) => ({ ...prev, ...saved }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch {}
  }, [inputs, hydrated]);

  const { employees, hourlyCost, plan, currency, scenario } = inputs;

  const result = useMemo(() => {
    const observedLift = SCENARIOS[scenario]?.lift ?? SCENARIOS.baseline.lift;
    const lift = Math.min(observedLift, DEFAULTS.effectSizeCap);
    const minutesPerEmployee = DEFAULTS.sessionsPerDay * DEFAULTS.sessionMinutes * DEFAULTS.workDays * DEFAULTS.complianceRate;
    const recoveredHoursPerEmp = (minutesPerEmployee * lift * DEFAULTS.residualFactor) / 60;
    const totalRecoveredHours = recoveredHoursPerEmp * employees;
    const grossValue = totalRecoveredHours * hourlyCost;
    const pricePerEmpYearUSD = PLAN_PRICE[plan] * 12;
    const annualLicenseCost = employees * PLAN_PRICE[plan] * 12;
    const netValue = grossValue - annualLicenseCost;
    const threeYearNet = netValue * 3;
    const roiMultiple = annualLicenseCost > 0 ? grossValue / annualLicenseCost : null;
    const paybackMonths = grossValue > 0 ? (annualLicenseCost / grossValue) * 12 : null;
    const wellnessDeltaPct = pricePerEmpYearUSD > 0 && pricePerEmpYearUSD < MERCER_MEDIAN_USD
      ? Math.round((1 - pricePerEmpYearUSD / MERCER_MEDIAN_USD) * 100)
      : null;
    return { recoveredHoursPerEmp, totalRecoveredHours, grossValue, annualLicenseCost, netValue, threeYearNet, roiMultiple, paybackMonths, wellnessDeltaPct, liftApplied: lift };
  }, [employees, hourlyCost, plan, scenario]);

  const reset = () => {
    setInputs(INITIAL);
    setDrafts({ employees: "", hourlyCost: "" });
  };

  const onNumDraft = (key) => (e) => setDrafts((d) => ({ ...d, [key]: e.target.value }));
  const onNumCommit = (key) => () => {
    const raw = drafts[key];
    if (raw === "") { setDrafts((d) => ({ ...d, [key]: "" })); return; }
    const { min, max } = CLAMP[key];
    const parsed = Number(raw);
    const safe = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : inputs[key];
    setInputs((s) => ({ ...s, [key]: safe }));
    setDrafts((d) => ({ ...d, [key]: "" }));
  };

  const netPositive = result.netValue > 0;

  return (
    <div className="bi-roicc">
      {/* ─── Inputs panel ─── */}
      <aside aria-labelledby="roi-inputs-heading" className="bi-roi-panel">
        <div className="bi-roi-panel-head">
          <span className="bi-roi-panel-kicker">INPUTS · TU ORGANIZACIÓN</span>
          <h3 id="roi-inputs-heading" className="bi-roi-panel-title">
            {en ? "Your data" : "Tus datos"}
          </h3>
        </div>

        <Field label={t("roi.employees")} hint={en ? "Staff covered by the license." : "Personal cubierto por la licencia."}>
          {(p) => (
            <input
              {...p}
              type="number"
              inputMode="numeric"
              min={CLAMP.employees.min}
              max={CLAMP.employees.max}
              value={drafts.employees !== "" ? drafts.employees : employees}
              onChange={onNumDraft("employees")}
              onBlur={onNumCommit("employees")}
              style={inputStyle}
            />
          )}
        </Field>

        <Field label={`${t("roi.hourlyCost")} (${currency})`} hint={en ? "Salary + benefits + overhead per hour." : "Salario + beneficios + overhead por hora."}>
          {(p) => (
            <input
              {...p}
              type="number"
              inputMode="decimal"
              min={CLAMP.hourlyCost.min}
              max={CLAMP.hourlyCost.max}
              value={drafts.hourlyCost !== "" ? drafts.hourlyCost : hourlyCost}
              onChange={onNumDraft("hourlyCost")}
              onBlur={onNumCommit("hourlyCost")}
              style={inputStyle}
            />
          )}
        </Field>

        <Field label={t("roi.plan")} hint={en ? "Per user / month. Enterprise shown as a working estimate — real pricing is custom." : "Por usuario / mes. Enterprise se muestra como estimación — el precio real es a medida."}>
          {(p) => (
            <select {...p} value={plan} onChange={(e) => setInputs({ ...inputs, plan: e.target.value })} style={inputStyle}>
              <option value="starter">Starter · $9 / {en ? "mo" : "mes"}</option>
              <option value="growth">Growth · $19 / {en ? "mo" : "mes"}</option>
              <option value="enterprise">Enterprise · $29 / {en ? "mo (approx.)" : "mes (aprox.)"}</option>
            </select>
          )}
        </Field>

        <Field label={t("roi.currency")}>
          {(p) => (
            <select {...p} value={currency} onChange={(e) => setInputs({ ...inputs, currency: e.target.value })} style={inputStyle}>
              <option value="USD">USD</option>
              <option value="MXN">MXN</option>
              <option value="EUR">EUR</option>
            </select>
          )}
        </Field>

        <div className="bi-roi-scenario" role="radiogroup" aria-label={en ? "Sensitivity scenario" : "Escenario de sensibilidad"}>
          <span className="bi-roi-scenario-label">
            {en ? "Sensitivity · lift assumption" : "Sensibilidad · supuesto de lift"}
          </span>
          <div className="bi-roi-scenario-group">
            {Object.keys(SCENARIOS).map((key) => {
              const s = SCENARIOS[key];
              const active = scenario === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`bi-roi-scenario-btn${active ? " is-active" : ""}`}
                  onClick={() => setInputs((prev) => ({ ...prev, scenario: key }))}
                >
                  <span className="bi-roi-scenario-name">{en ? s.labelEn : s.labelEs}</span>
                  <span className="bi-roi-scenario-hint">{en ? s.hintEn : s.hintEs}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={reset} className="bi-roi-reset">
          {t("roi.reset")}
        </button>

        <p className="bi-roi-panel-note">
          {en
            ? "Everything computes in your browser — no server storage. "
            : "Todo corre en tu navegador — sin almacenamiento en servidor. "}
          <Link href="/docs#roi-model" className="bi-roi-link">
            {en ? "See the model." : "Ver el modelo."}
          </Link>
        </p>
      </aside>

      {/* ─── Result panel ─── */}
      <section aria-labelledby="roi-result-heading" className="bi-roi-result">
        <h3 id="roi-result-heading" className="bi-sr-only">{en ? "Results" : "Resultados"}</h3>

        <div className={`bi-roi-hero-card${netPositive ? " is-positive" : " is-negative"}`}>
          <div className="bi-roi-hero-kicker">
            {en ? "ANNUAL NET VALUE" : "VALOR NETO ANUAL"}
            <span className="bi-roi-hero-scenario">
              · {en ? SCENARIOS[scenario].labelEn : SCENARIOS[scenario].labelEs}
            </span>
          </div>
          <div className="bi-roi-hero-figure" aria-live="polite">
            {fmtMoney(result.netValue, currency, locale)}
          </div>
          <div className="bi-roi-hero-row">
            {result.roiMultiple ? (
              <span className="bi-roi-hero-badge">
                <span className="v">{result.roiMultiple.toFixed(1)}×</span>
                <span className="l">{en ? "ROI multiple" : "Múltiplo ROI"}</span>
              </span>
            ) : null}
            {result.paybackMonths && result.paybackMonths > 0 && result.paybackMonths <= 60 ? (
              <span className="bi-roi-hero-badge bi-roi-hero-badge--alt">
                <span className="v">{result.paybackMonths.toFixed(1)}</span>
                <span className="l">{en ? "months payback" : "meses payback"}</span>
              </span>
            ) : null}
            <span className="bi-roi-hero-badge bi-roi-hero-badge--ghost">
              <span className="v">{(result.liftApplied * 100).toFixed(0)}%</span>
              <span className="l">{en ? "lift applied" : "lift aplicado"}</span>
            </span>
          </div>
        </div>

        <div className="bi-roi-3yr" aria-label={en ? "3-year view" : "Vista a 3 años"}>
          <div className="bi-roi-3yr-cell">
            <span className="y">{en ? "Year 1 net" : "Neto Año 1"}</span>
            <span className="v" aria-live="polite">{fmtMoney(result.netValue, currency, locale)}</span>
          </div>
          <div className="bi-roi-3yr-cell">
            <span className="y">{en ? "Year 2 net" : "Neto Año 2"}</span>
            <span className="v" aria-live="polite">{fmtMoney(result.netValue * 2, currency, locale)}</span>
          </div>
          <div className="bi-roi-3yr-cell cum">
            <span className="y">{en ? "Cumulative Y3" : "Acumulado A3"}</span>
            <span className="v" aria-live="polite">{fmtMoney(result.threeYearNet, currency, locale)}</span>
          </div>
        </div>

        <ul className="bi-roi-insight-row" aria-label={en ? "Context insights" : "Insights de contexto"}>
          <li className="bi-roi-insight-chip loss">
            {en ? "Hours currently leaking: " : "Horas fugando hoy: "}
            <strong>{fmtNumber(Math.round(result.totalRecoveredHours))}</strong>
            {en ? " / yr" : " / año"}
          </li>
          {result.wellnessDeltaPct ? (
            <li className="bi-roi-insight-chip peer">
              {en ? "vs. Mercer wellness median · " : "vs. mediana Mercer wellness · "}
              <strong>{result.wellnessDeltaPct}%</strong>
              {en ? " less per employee" : " menos por empleado"}
            </li>
          ) : null}
        </ul>

        <ul className="bi-roi-metric-grid" aria-label={en ? "Supporting metrics" : "Métricas de soporte"}>
          <li>
            <span className="k">{en ? "Hours / employee / yr" : "Horas / empleado / año"}</span>
            <span className="v" aria-live="polite">{result.recoveredHoursPerEmp.toFixed(1)}</span>
          </li>
          <li>
            <span className="k">{en ? "Total recovered hours" : "Horas recuperadas totales"}</span>
            <span className="v" aria-live="polite">{fmtNumber(Math.round(result.totalRecoveredHours))}</span>
          </li>
          <li>
            <span className="k">{en ? "Annual gross value" : "Valor bruto anual"}</span>
            <span className="v" aria-live="polite">{fmtMoney(result.grossValue, currency, locale)}</span>
          </li>
          <li>
            <span className="k">{en ? "Annual license cost" : "Costo licencia anual"}</span>
            <span className="v" aria-live="polite">{fmtMoney(result.annualLicenseCost, currency, locale)}</span>
            <span className="s">{employees} × ${PLAN_PRICE[plan]} × 12</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
