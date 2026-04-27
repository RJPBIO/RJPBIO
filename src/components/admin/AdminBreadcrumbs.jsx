"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS = {
  admin: "Admin",
  onboarding: "Onboarding",
  members: "Miembros",
  teams: "Equipos",
  security: "Seguridad",
  policies: "Políticas",
  sessions: "Sesiones",
  sso: "SSO",
  audit: "Auditoría",
  settings: "Configuración",
  "api-keys": "API keys",
  integrations: "Integraciones",
  branding: "Branding",
  webhooks: "Webhooks",
  stations: "Estaciones",
  compliance: "Compliance",
  dsar: "DSAR",
  nom35: "NOM-035",
  documento: "Documento",
  billing: "Facturación",
  health: "Health",
  incidents: "Incidents",
  maintenance: "Maintenance",
};

function label(seg) {
  return LABELS[seg] || seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname() || "/admin";
  const segments = pathname.split("/").filter(Boolean);
  const adminIdx = segments.indexOf("admin");
  const trail = adminIdx >= 0 ? segments.slice(adminIdx) : segments;
  if (trail.length <= 1) return null;
  const crumbs = [];
  for (let i = 0; i < trail.length; i++) {
    const href = "/" + trail.slice(0, i + 1).join("/");
    crumbs.push({ href, label: label(trail[i]), last: i === trail.length - 1 });
  }
  return (
    <nav aria-label="Breadcrumb" className="bi-admin-breadcrumbs">
      {crumbs.map((c, i) => (
        <span key={c.href} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {i > 0 && (
            <span aria-hidden className="bi-admin-breadcrumb-sep">/</span>
          )}
          {c.last ? (
            <span className="bi-admin-breadcrumb-current" aria-current="page">{c.label}</span>
          ) : (
            <Link href={c.href} className="bi-admin-breadcrumb-link">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
