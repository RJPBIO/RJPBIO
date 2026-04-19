"use client";
import { useEffect, useMemo, useState } from "react";
import { Field, inputStyle } from "@/components/ui/Field";
import { Kpi } from "@/components/ui/Kpi";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font } from "@/components/ui/tokens";
import { useT } from "@/hooks/useT";
import { fmtNumber } from "@/lib/i18n";

const DEFAULTS = {
  effectSizeCap: 0.35,
  residualFactor: 2.0,
  observedLift: 0.22,
  sessionsPerDay: 2,
  sessionMinutes: 3,
  workDays: 220,
  complianceRate: 0.6,
};

const PLAN_PRICE = { starter: 9, growth: 19, enterprise: 29 };
const STORAGE_KEY = "bio-roi-inputs";

function fmtMoney(n, curr, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(n);
}

const INITIAL = { employees: 120, hourlyCost: 60, plan: "growth", currency: "USD" };
const CLAMP = { employees: { min: 1, max: 100000 }, hourlyCost: { min: 5, max: 500 } };

export default function RoiCalc() {
  const { t, locale } = useT();
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

  const { employees, hourlyCost, plan, currency } = inputs;

  const result = useMemo(() => {
    const lift = Math.min(DEFAULTS.observedLift, DEFAULTS.effectSizeCap);
    const minutesPerEmployee = DEFAULTS.sessionsPerDay * DEFAULTS.sessionMinutes * DEFAULTS.workDays * DEFAULTS.complianceRate;
    const recoveredHoursPerEmp = (minutesPerEmployee * lift * DEFAULTS.residualFactor) / 60;
    const totalRecoveredHours = recoveredHoursPerEmp * employees;
    const grossValue = totalRecoveredHours * hourlyCost;
    const annualLicenseCost = employees * PLAN_PRICE[plan] * 12;
    const netValue = grossValue - annualLicenseCost;
    const roiMultiple = annualLicenseCost > 0 ? grossValue / annualLicenseCost : null;
    return { recoveredHoursPerEmp, totalRecoveredHours, grossValue, annualLicenseCost, netValue, roiMultiple };
  }, [employees, hourlyCost, plan]);

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

  return (
    <div className="bi-split-5-7">
      <aside
        aria-labelledby="roi-inputs-heading"
        style={{ padding: space[5], background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: 14 }}
      >
        <h2 id="roi-inputs-heading" style={{ margin: 0, fontSize: 18, fontWeight: font.weight.bold }}>{t("roi.yourData") !== "roi.yourData" ? t("roi.yourData") : (locale === "en" ? "Your data" : "Tus datos")}</h2>

        <Field label={t("roi.employees")} hint={locale === "en" ? "Staff covered by the license." : "Personal cubierto por la licencia."}>

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

        <Field label={`${t("roi.hourlyCost")} (${currency})`} hint={locale === "en" ? "Salary + benefits + overhead per hour." : "Salario + beneficios + overhead por hora."}>
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

        <Field label={t("roi.plan")} hint={locale === "en" ? "Per user / month. Enterprise shown as a working estimate — real pricing is custom." : "Por usuario / mes. Enterprise se muestra como estimación — el precio real es a medida."}>
          {(p) => (
            <select {...p} value={plan} onChange={(e) => setInputs({ ...inputs, plan: e.target.value })} style={inputStyle}>
              <option value="starter">Starter · $9 / {locale === "en" ? "mo" : "mes"}</option>
              <option value="growth">Growth · $19 / {locale === "en" ? "mo" : "mes"}</option>
              <option value="enterprise">Enterprise · $29 / {locale === "en" ? "mo (approx.)" : "mes (aprox.)"}</option>
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

        <Button variant="ghost" size="sm" onClick={reset} type="button">{t("roi.reset")}</Button>

        <p style={{ marginTop: space[4], padding: space[2.5], background: cssVar.bg, border: `1px dashed ${cssVar.border}`, borderRadius: 8, fontSize: 11, color: cssVar.textMuted, lineHeight: 1.6 }}>
          {locale === "en"
            ? "Assumptions: 2 sessions × 3 min, 60% compliance, effect-size capped at 0.35, 2× persistence. Everything is computed in your browser; we don't store inputs server-side. "
            : "Supuestos: 2 sesiones × 3 min, 60 % cumplimiento, effect-size capado en 0.35, persistencia 2×. Todo se calcula en tu navegador; no guardamos los inputs en servidor. "}
          <a href="/docs#roi-model">{locale === "en" ? "See model." : "Ver modelo."}</a>
        </p>
      </aside>

      <section aria-labelledby="roi-out-heading" style={{ padding: space[1] }}>
        <h2 id="roi-out-heading" className="bi-sr-only">{locale === "en" ? "Results" : "Resultados"}</h2>
        <Kpi live label={locale === "en" ? "Recovered hours / employee / year" : "Horas recuperadas / empleado / año"} value={result.recoveredHoursPerEmp.toFixed(1)} />
        <Kpi live label={locale === "en" ? "Recovered hours (annual total)" : "Horas recuperadas (total anual)"} value={fmtNumber(Math.round(result.totalRecoveredHours))} />
        <Kpi live label={locale === "en" ? "Annual gross value" : "Valor bruto anual"} value={fmtMoney(result.grossValue, currency, locale)} accent />
        <Kpi
          live
          label={locale === "en" ? "Annual license cost" : "Costo de licencia anual"}
          value={fmtMoney(result.annualLicenseCost, currency, locale)}
          sub={`${employees} × $${PLAN_PRICE[plan]} × 12`}
        />
        <Kpi live label={locale === "en" ? "Annual net value" : "Valor neto anual"} value={fmtMoney(result.netValue, currency, locale)} accent={result.netValue > 0} />
        <Kpi live label={locale === "en" ? "ROI multiple" : "Múltiplo de ROI"} value={result.roiMultiple ? `${result.roiMultiple.toFixed(1)}×` : "—"} />

        <div style={{ marginTop: space[3] }}>
          <Button href="/demo">{locale === "en" ? "Book a demo with these numbers" : "Agenda demo con estos números"}</Button>
        </div>
      </section>
    </div>
  );
}
