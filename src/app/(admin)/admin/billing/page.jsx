export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { listInvoices } from "@/server/billing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

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

  const invoices = await listInvoices(org.stripeCustomer, 12);

  return (
    <>
      <header style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: space[3],
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: font.size["2xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
            color: cssVar.text,
          }}>
            Facturación
          </h1>
          <p style={{
            margin: `${space[1]}px 0 0`,
            color: cssVar.textMuted,
            fontSize: font.size.sm,
          }}>
            Plan actual: <strong style={{ color: cssVar.text }}>{plan}</strong> · {limits.price}
          </p>
        </div>
        <form action="/api/billing/portal" method="post">
          <input type="hidden" name="orgId" value={orgId} />
          <Button type="submit" variant="primary">Abrir portal de facturación</Button>
        </form>
      </header>

      <section style={{
        marginTop: space[5],
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: space[3],
      }}>
        <UsageCard
          title="Asientos"
          used={seatsUsed}
          total={limits.seats}
          hint={seatPct >= 80 ? "Cerca del límite — considera upgrade" : "Saludable"}
          danger={seatPct >= 90}
        />
        <UsageCard
          title="Sesiones este mes"
          used={sessionsThisMonth}
          total={limits.sessions}
          hint={sessionPct >= 80 ? "Alto consumo — monitorea" : "Resetea el día 1 de cada mes"}
          danger={sessionPct >= 90}
        />
      </section>

      <h2 style={{
        marginTop: space[6],
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        letterSpacing: font.tracking.tight,
      }}>
        Planes
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: space[3],
        marginTop: space[2],
      }}>
        {["STARTER", "GROWTH", "ENTERPRISE"].map((p) => (
          <Tier
            key={p}
            name={p}
            plan={p}
            price={PLAN_LIMITS[p].price}
            features={PLAN_FEATURES[p]}
            current={plan === p}
            orgId={org.id}
          />
        ))}
      </div>

      <h2 style={{
        marginTop: space[6],
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        letterSpacing: font.tracking.tight,
      }}>
        Historial reciente
      </h2>
      {invoices.length === 0 ? (
        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
          Sin facturas todavía. Abre el <em>portal de facturación</em> para ver recibos, métodos de pago e impuestos.
        </p>
      ) : (
        <div style={{
          marginTop: space[3],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: font.size.sm }}>
            <thead>
              <tr style={{ background: cssVar.surface2 }}>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Monto</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Recibo</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 12).map((inv) => (
                <tr key={inv.id} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                  <td style={tdStyle}>{new Date(inv.date).toLocaleDateString()}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>
                    ${(inv.amount / 100).toFixed(2)} {inv.currency?.toUpperCase()}
                  </td>
                  <td style={tdStyle}>
                    <Badge
                      variant={inv.status === "paid" ? "success" : inv.status === "open" ? "warn" : "soft"}
                      size="sm"
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td style={tdStyle}>
                    {inv.pdf
                      ? <a href={inv.pdf} target="_blank" rel="noopener noreferrer" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>PDF ↗</a>
                      : <span style={{ color: cssVar.textMuted }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function UsageCard({ title, used, total, hint, danger }) {
  const unlimited = total === Infinity;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return (
    <div style={{
      padding: space[4],
      borderRadius: radius.md,
      border: `1px solid ${danger ? cssVar.warn : cssVar.border}`,
      background: danger
        ? "color-mix(in srgb, var(--bi-warn) 8%, transparent)"
        : cssVar.surface2,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: font.size.xs,
        color: cssVar.textDim,
      }}>
        <span style={{
          textTransform: "uppercase",
          letterSpacing: font.tracking.wide,
          fontWeight: font.weight.semibold,
        }}>
          {title}
        </span>
        <span style={{ fontFamily: cssVar.fontMono }}>
          {unlimited ? "Ilimitado" : `${pct}%`}
        </span>
      </div>
      <div style={{
        marginTop: space[2],
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        fontFamily: cssVar.fontMono,
        color: cssVar.text,
      }}>
        {used.toLocaleString()}
        {!unlimited && (
          <span style={{
            fontSize: font.size.md,
            color: cssVar.textMuted,
            marginInlineStart: space[2],
            fontWeight: font.weight.medium,
          }}>
            / {total.toLocaleString()}
          </span>
        )}
      </div>
      {!unlimited && (
        <div style={{ marginTop: space[2] }}>
          <Progress value={pct} tone={danger ? "warn" : "accent"} size="sm" />
        </div>
      )}
      {hint && (
        <p style={{
          fontSize: font.size.xs,
          margin: `${space[2]}px 0 0`,
          color: danger ? cssVar.warn : cssVar.textMuted,
        }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Tier({ name, price, features, current, plan, orgId }) {
  return (
    <div style={{
      padding: space[5],
      borderRadius: radius.md,
      border: `2px solid ${current ? cssVar.accent : cssVar.border}`,
      background: current ? cssVar.accentSoft : cssVar.surface,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: space[2],
      }}>
        <h3 style={{
          margin: 0,
          fontSize: font.size.lg,
          fontWeight: font.weight.bold,
          color: cssVar.text,
          letterSpacing: font.tracking.tight,
        }}>
          {name}
        </h3>
        {current && <Badge variant="success" size="sm">Actual</Badge>}
      </div>
      <p style={{
        color: cssVar.textMuted,
        margin: `${space[1]}px 0 ${space[3]}px`,
        fontSize: font.size.sm,
      }}>
        {price}
      </p>
      <ul style={{
        paddingInlineStart: space[5],
        fontSize: font.size.sm,
        lineHeight: 1.6,
        flex: 1,
        color: cssVar.text,
      }}>
        {features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      {!current && (
        <form action="/api/billing/checkout" method="post" style={{ marginTop: space[3] }}>
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="plan" value={plan} />
          <Button type="submit" variant="primary" block>Elegir {name}</Button>
        </form>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  color: cssVar.text,
};
