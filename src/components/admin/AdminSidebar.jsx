import AdminNavLink from "@/components/ui/AdminNavLink";
import { BioGlyph } from "@/components/BioIgnicionMark";
import { cssVar, space, font, radius, bioSignal } from "@/components/ui/tokens";
import {
  HomeIcon, SparkIcon, PeopleIcon, TeamsIcon, ShieldIcon, KeyIcon, SsoIcon,
  ScrollIcon, CogIcon, PluginIcon, PaintIcon, WebhookIcon, StationIcon,
  ComplianceIcon, DsarIcon, Nom35Icon, ReceiptIcon, PulseIcon, SirenIcon, ConeIcon,
} from "@/components/admin/AdminNavIcons";

const GROUPS = [
  { label: "General", items: [
    { href: "/admin", label: "Resumen", Icon: HomeIcon },
    { href: "/admin/onboarding", label: "Onboarding", Icon: SparkIcon },
  ]},
  { label: "Personas", items: [
    { href: "/admin/members", label: "Miembros", Icon: PeopleIcon },
    { href: "/admin/teams", label: "Equipos", Icon: TeamsIcon },
  ]},
  { label: "Seguridad", items: [
    { href: "/admin/security/policies", label: "Políticas", Icon: ShieldIcon },
    { href: "/admin/security/sessions", label: "Sesiones", Icon: PulseIcon },
    { href: "/admin/security", label: "Reset MFA", Icon: KeyIcon },
    { href: "/admin/sso", label: "SSO", Icon: SsoIcon },
    { href: "/admin/audit", label: "Auditoría", Icon: ScrollIcon },
    { href: "/admin/audit/settings", label: "Audit settings", Icon: CogIcon },
    { href: "/admin/api-keys", label: "API keys", Icon: KeyIcon },
    { href: "/admin/integrations", label: "Integraciones", Icon: PluginIcon },
  ]},
  { label: "Producto", items: [
    { href: "/admin/branding", label: "Branding", Icon: PaintIcon },
    { href: "/admin/webhooks", label: "Webhooks", Icon: WebhookIcon },
    { href: "/admin/stations", label: "Estaciones", Icon: StationIcon },
  ]},
  { label: "Cumplimiento", items: [
    { href: "/admin/compliance", label: "SOC 2 · ISO 27001", Icon: ComplianceIcon },
    { href: "/admin/compliance/dsar", label: "DSAR", Icon: DsarIcon },
    { href: "/admin/nom35", label: "NOM-035", Icon: Nom35Icon },
    { href: "/admin/nom35/documento", label: "Documento oficial", Icon: ScrollIcon },
  ]},
  { label: "Cuenta", items: [
    { href: "/admin/billing", label: "Facturación", Icon: ReceiptIcon },
  ]},
  { label: "Plataforma", items: [
    { href: "/admin/health", label: "Health", Icon: PulseIcon },
    { href: "/admin/incidents", label: "Incidents", Icon: SirenIcon },
    { href: "/admin/maintenance", label: "Maintenance", Icon: ConeIcon },
  ]},
];

export default function AdminSidebar({ branding, userEmail, userRole }) {
  return (
    <aside className="bi-admin-sidebar" aria-label="Admin navigation">
      <div className="bi-admin-brand">
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.orgName || "logo"}
            style={{ maxHeight: 32, maxWidth: 180, objectFit: "contain" }}
          />
        ) : (
          <a href="/" className="bi-shell-brand bi-shell-brand--admin" aria-label="BIO-IGNICIÓN — inicio">
            <span aria-hidden className="bi-shell-brand-glyph">
              <BioGlyph size={28} />
            </span>
            <span aria-hidden className="bi-shell-wordmark">
              <span className="bi-wm-bio">BIO</span>
              <span className="bi-wm-dash">—</span>
              <span className="bi-wm-main">IGNICIÓN</span>
            </span>
          </a>
        )}
        <div className="bi-admin-brand-context">
          <span className="bi-admin-brand-dot" aria-hidden />
          Consola admin
        </div>
      </div>

      <nav className="bi-admin-nav" aria-label="Secciones de administración">
        {GROUPS.map((g) => (
          <div key={g.label} className="bi-admin-nav-group">
            <div className="bi-admin-nav-group-label">{g.label}</div>
            {g.items.map((n) => {
              const Icon = n.Icon;
              return (
                <AdminNavLink
                  key={n.href}
                  href={n.href}
                  className="bi-admin-nav-item"
                  activeClassName="bi-admin-nav-item-active"
                >
                  {Icon && <Icon size={16} />}
                  <span>{n.label}</span>
                </AdminNavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <footer className="bi-admin-sidebar-footer">
        <div style={{
          fontSize: font.size.xs,
          fontFamily: cssVar.fontMono,
          color: cssVar.textMuted,
          wordBreak: "break-all",
        }}>
          {userEmail}
        </div>
        {userRole && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontFamily: cssVar.fontMono,
            color: bioSignal.phosphorCyanInk,
            textTransform: "uppercase",
            letterSpacing: font.tracking.wider,
            fontWeight: font.weight.bold,
            marginBlockStart: 6,
          }}>
            <span aria-hidden style={{
              width: 6, height: 6, borderRadius: "50%",
              background: bioSignal.phosphorCyan,
              boxShadow: `0 0 8px ${bioSignal.phosphorCyan}`,
            }} />
            {userRole}
          </div>
        )}
      </footer>
    </aside>
  );
}
