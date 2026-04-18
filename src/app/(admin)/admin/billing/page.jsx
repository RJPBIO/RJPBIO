import { db } from "@/server/db";
import { auth } from "@/server/auth";

export const metadata = { title: "Facturación · Admin" };

const PLAN_LIMITS = {
  FREE:       { seats: 5,   sessions: 200,   price: "Gratis" },
  STARTER:    { seats: 50,  sessions: 5000,  price: "$4/mes/asiento" },
  GROWTH:     { seats: 500, sessions: 50000, price: "$9/mes/asiento" },
  ENTERPRISE: { seats: Infinity, sessions: Infinity, price: "Contactar" },
};

const PLAN_FEATURES = {
  STARTER:    ["Hasta 50 asientos", "Analíticas agregadas", "Email support"],
  GROWTH:     ["SSO SAML/OIDC", "SCIM", "API + webhooks", "Priority support"],
  ENTERPRISE: ["Data residency", "Custom MSA", "DPO dedicado", "99.95% SLA"],
};

export default async function BillingPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: orgId } });
  if (!org) return null;

  const memberships = await orm.membership.findMany({ where: { orgId } });
  const seatsUsed = memberships.length;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const sessionsThisMonth = await orm.auditLog.count({
    where: { orgId, action: "session.complete", ts: { gte: monthStart } },
  });

  const plan = org.plan || "FREE";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const seatPct = limits.seats === Infinity ? 0 : Math.min(100, Math.round((seatsUsed / limits.seats) * 100));
  const sessionPct = limits.sessions === Infinity ? 0 : Math.min(100, Math.round((sessionsThisMonth / limits.sessions) * 100));

  const invoices = (org.stripeCustomer && Array.isArray(org.invoices)) ? org.invoices : [];

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Facturación</h1>
          <p style={{ margin: "4px 0 0", color: "#A7F3D0", fontSize: 13 }}>
            Plan actual: <strong style={{ color: "#fff" }}>{plan}</strong> · {limits.price}
          </p>
        </div>
        <form action="/api/billing/portal" method="post">
          <input type="hidden" name="orgId" value={orgId} />
          <button style={btn}>Abrir portal de facturación</button>
        </form>
      </header>

      <section style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <UsageCard
          title="Asientos"
          used={seatsUsed}
          total={limits.seats}
          unit=""
          hint={seatPct >= 80 ? "Cerca del límite — considera upgrade" : "Saludable"}
          danger={seatPct >= 90}
        />
        <UsageCard
          title="Sesiones este mes"
          used={sessionsThisMonth}
          total={limits.sessions}
          unit=""
          hint={sessionPct >= 80 ? "Alto consumo — monitorea" : `Resetea el día 1 de cada mes`}
          danger={sessionPct >= 90}
        />
      </section>

      <h2 style={{ marginTop: 32, fontSize: 18 }}>Planes</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 10 }}>
        {["STARTER", "GROWTH", "ENTERPRISE"].map((p) => (
          <Tier key={p} name={p} plan={p} price={PLAN_LIMITS[p].price} features={PLAN_FEATURES[p]} current={plan === p} orgId={org.id} />
        ))}
      </div>

      <h2 style={{ marginTop: 32, fontSize: 18 }}>Historial reciente</h2>
      {invoices.length === 0 ? (
        <p style={{ color: "#A7F3D0", fontSize: 13 }}>
          Sin facturas todavía. Abre el <em>portal de facturación</em> para ver recibos, métodos de pago e impuestos.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
          <thead><tr style={{ textAlign: "left", color: "#6EE7B7" }}><th>Fecha</th><th>Monto</th><th>Estado</th><th>Recibo</th></tr></thead>
          <tbody>
            {invoices.slice(0, 12).map((inv) => (
              <tr key={inv.id} style={{ borderBlockStart: "1px solid #064E3B" }}>
                <td>{new Date(inv.date).toLocaleDateString()}</td>
                <td>${(inv.amount / 100).toFixed(2)} {inv.currency?.toUpperCase()}</td>
                <td>{inv.status}</td>
                <td>{inv.pdf ? <a href={inv.pdf} style={{ color: "#A7F3D0" }}>PDF</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function UsageCard({ title, used, total, hint, danger }) {
  const pct = total === Infinity ? 0 : Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return (
    <div style={{ padding: 18, borderRadius: 14, border: `1px solid ${danger ? "#F59E0B" : "#064E3B"}`, background: danger ? "rgba(245,158,11,0.06)" : "#052E16" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6EE7B7" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
        <span>{total === Infinity ? "Ilimitado" : `${pct}%`}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono, monospace)" }}>
        {used.toLocaleString()}{total !== Infinity && <span style={{ fontSize: 14, color: "#6EE7B7", marginInlineStart: 6 }}>/ {total.toLocaleString()}</span>}
      </div>
      {total !== Infinity && (
        <div style={{ marginTop: 10, height: 6, background: "#064E3B", borderRadius: 3, overflow: "hidden" }} aria-hidden="true">
          <div style={{ width: `${pct}%`, height: "100%", background: danger ? "linear-gradient(90deg, #F59E0B, #EF4444)" : "linear-gradient(90deg, #10B981, #22D3EE)", transition: "width 0.3s" }} />
        </div>
      )}
      {hint && <p style={{ fontSize: 12, margin: "10px 0 0", color: danger ? "#FBBF24" : "#6EE7B7" }}>{hint}</p>}
    </div>
  );
}

function Tier({ name, price, features, current, plan, orgId }) {
  return (
    <div style={{ padding: 20, borderRadius: 16, border: `2px solid ${current ? "#10B981" : "#064E3B"}`, background: current ? "rgba(16,185,129,.1)" : "transparent", display: "flex", flexDirection: "column" }}>
      <h3 style={{ margin: 0 }}>{name}</h3>
      <p style={{ color: "#A7F3D0", margin: "6px 0 14px" }}>{price}</p>
      <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.6, flex: 1 }}>{features.map((f) => <li key={f}>{f}</li>)}</ul>
      {current ? (
        <span style={{ marginTop: 12, textAlign: "center", padding: 8, fontSize: 12, color: "#34D399", fontWeight: 700 }}>● Tu plan actual</span>
      ) : (
        <form action="/api/billing/checkout" method="post" style={{ marginTop: 12 }}>
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="plan" value={plan} />
          <button style={btn}>Elegir {name}</button>
        </form>
      )}
    </div>
  );
}

const btn = { padding: "10px 18px", borderRadius: 999, fontWeight: 700, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: 0, cursor: "pointer", width: "100%" };
