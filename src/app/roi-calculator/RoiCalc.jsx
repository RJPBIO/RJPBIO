"use client";
import { useMemo, useState } from "react";

/* Modelo simplificado para la calculadora pública: extrapola horas
   recuperadas por empleado al año asumiendo cumplimiento del 60% sobre
   2 sesiones de 3 min por día laboral (≈220 días/año). Aplica el mismo
   effectSizeCap y residualFactor conservadores que lib/roi.js. */
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

function fmtMoney(n, curr = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(n);
}

export default function RoiCalc() {
  const [employees, setEmployees] = useState(120);
  const [hourlyCost, setHourlyCost] = useState(60);
  const [plan, setPlan] = useState("growth");
  const [currency, setCurrency] = useState("USD");

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

  return (
    <div style={wrap}>
      <div style={inputCol}>
        <Field label="Empleados" hint="Personal cubierto por la licencia.">
          <input type="number" min={1} max={100000} value={employees}
            onChange={(e) => setEmployees(Math.max(1, +e.target.value || 0))} style={inp} />
        </Field>
        <Field label={`Costo cargado / hora (${currency})`} hint="Salario + beneficios + overhead por hora.">
          <input type="number" min={5} max={500} value={hourlyCost}
            onChange={(e) => setHourlyCost(Math.max(5, +e.target.value || 0))} style={inp} />
        </Field>
        <Field label="Plan" hint="Precio por usuario / mes.">
          <select value={plan} onChange={(e) => setPlan(e.target.value)} style={inp}>
            <option value="starter">Starter · $9 / mes</option>
            <option value="growth">Growth · $19 / mes</option>
            <option value="enterprise">Enterprise · $29 / mes (aprox.)</option>
          </select>
        </Field>
        <Field label="Moneda">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inp}>
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
            <option value="EUR">EUR</option>
          </select>
        </Field>
        <div style={{ marginTop: 12, padding: 10, background: "#0B0E14", border: "1px dashed #064E3B", borderRadius: 8, fontSize: 11, color: "#9CA3AF", lineHeight: 1.6 }}>
          Supuestos conservadores: 2 sesiones × 3 min, 60 % cumplimiento,
          effect-size capado en 0.35, persistencia 2×. Ver{" "}
          <a href="/docs#roi-model" style={{ color: "#6EE7B7" }}>modelo completo</a>.
        </div>
      </div>

      <div style={outCol}>
        <Kpi label="Horas recuperadas / empleado / año" value={result.recoveredHoursPerEmp.toFixed(1)} />
        <Kpi label="Horas recuperadas (total anual)" value={Math.round(result.totalRecoveredHours).toLocaleString()} />
        <Kpi label="Valor bruto anual" value={fmtMoney(result.grossValue, currency)} accent />
        <Kpi label="Costo de licencia anual" value={fmtMoney(result.annualLicenseCost, currency)} sub={`${employees} × $${PLAN_PRICE[plan]} × 12`} />
        <Kpi label="Valor neto anual" value={fmtMoney(result.netValue, currency)} accent={result.netValue > 0} />
        <Kpi label="Múltiplo de ROI" value={result.roiMultiple ? `${result.roiMultiple.toFixed(1)}×` : "—"} />

        <a href="/demo" style={cta}>Agenda demo con estos números</a>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: "#A7F3D0", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{hint}</div>}
    </label>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: accent ? "rgba(16,185,129,.12)" : "rgba(5,150,105,.06)", border: `1px solid ${accent ? "#10B981" : "#064E3B"}`, marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#A7F3D0" }}>{sub}</div>}
    </div>
  );
}

const wrap = { display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 28, alignItems: "start" };
const inputCol = { padding: 22, background: "rgba(5,150,105,.06)", border: "1px solid #064E3B", borderRadius: 14 };
const outCol = { padding: 4 };
const inp = { display: "block", width: "100%", background: "#0B0E14", color: "#ECFDF5", border: "1px solid #064E3B", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
const cta = { display: "inline-block", marginTop: 12, background: "#10B981", color: "#052E16", padding: "12px 20px", borderRadius: 10, textDecoration: "none", fontWeight: 700 };
