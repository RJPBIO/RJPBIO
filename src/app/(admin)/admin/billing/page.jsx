import { db } from "@/server/db";
import { auth } from "@/server/auth";

export default async function BillingPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER","ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: orgId } });

  return (
    <>
      <h1>Facturación</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 12 }}>
        <Tier name="Starter" price="$4/mes/asiento" features={["Hasta 50 asientos","Analíticas agregadas","Email support"]} current={org?.plan === "STARTER"} plan="STARTER" orgId={org?.id} />
        <Tier name="Growth" price="$9/mes/asiento" features={["SSO SAML/OIDC","SCIM","API + webhooks","Priority support"]} current={org?.plan === "GROWTH"} plan="GROWTH" orgId={org?.id} />
        <Tier name="Enterprise" price="Contactar" features={["Data residency","Custom MSA","DPO dedicado","99.95% SLA"]} current={org?.plan === "ENTERPRISE"} plan="ENTERPRISE" orgId={org?.id} />
      </div>
      <form action="/api/billing/portal" method="post" style={{ marginTop: 24 }}>
        <input type="hidden" name="orgId" value={orgId} />
        <button style={btn}>Abrir portal de facturación</button>
      </form>
    </>
  );
}

function Tier({ name, price, features, current, plan, orgId }) {
  return (
    <div style={{ padding: 20, borderRadius: 16, border: `2px solid ${current ? "#10B981" : "#064E3B"}`, background: current ? "rgba(16,185,129,.1)" : "transparent" }}>
      <h2 style={{ margin: 0 }}>{name}</h2>
      <p style={{ color: "#A7F3D0", margin: "6px 0 14px" }}>{price}</p>
      <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{features.map((f) => <li key={f}>{f}</li>)}</ul>
      {!current && (
        <form action="/api/billing/checkout" method="post">
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="plan" value={plan} />
          <button style={{ ...btn, marginTop: 8 }}>Elegir {name}</button>
        </form>
      )}
    </div>
  );
}

const btn = { padding: "10px 18px", borderRadius: 999, fontWeight: 700, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: 0, cursor: "pointer" };
