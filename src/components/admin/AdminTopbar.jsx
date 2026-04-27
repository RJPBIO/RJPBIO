import NotificationsBell from "@/components/ui/NotificationsBell";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AccountMenu from "@/components/admin/AccountMenu";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";

export default function AdminTopbar({ orgName, plan, userName, userEmail, userRole }) {
  return (
    <div className="bi-admin-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: space[3], minWidth: 0, flex: 1 }}>
        <AdminBreadcrumbs />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
        {orgName && (
          <div className="bi-admin-org-pill" title={`Plan: ${plan || "—"}`}>
            <span className="bi-admin-org-pill-eyebrow">Org</span>
            <span className="bi-admin-org-pill-name">{orgName}</span>
            {plan && <span className="bi-admin-plan-badge">{plan}</span>}
          </div>
        )}
        <button type="button" className="bi-admin-cmdk" aria-label="Buscar (Ctrl+K)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <span>Buscar</span>
          <kbd>⌘K</kbd>
        </button>
        <NotificationsBell />
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          role={userRole}
          orgName={orgName}
        />
      </div>
    </div>
  );
}
