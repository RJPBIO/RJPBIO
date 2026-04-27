"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const ROUTES = [
  // Acciones — siempre arriba en el orden por defecto
  { href: "/admin/members?action=invite",    label: "Invitar miembro",          group: "Acciones", kind: "action" },
  { href: "/admin/webhooks?action=create",   label: "Crear webhook",            group: "Acciones", kind: "action" },
  { href: "/admin/api-keys?action=create",   label: "Generar API key",          group: "Acciones", kind: "action" },
  { href: "/admin/incidents?action=create",  label: "Reportar incidente",       group: "Acciones", kind: "action" },
  { href: "/admin/maintenance?action=create",label: "Programar mantenimiento",  group: "Acciones", kind: "action" },
  { href: "/admin/audit?action=verify",      label: "Verificar audit chain",    group: "Acciones", kind: "action" },

  // Navegación
  { href: "/admin",                          label: "Resumen",                  group: "General" },
  { href: "/admin/onboarding",               label: "Onboarding",               group: "General" },
  { href: "/admin/members",                  label: "Miembros",                 group: "Personas" },
  { href: "/admin/teams",                    label: "Equipos",                  group: "Personas" },
  { href: "/admin/security/policies",        label: "Políticas de seguridad",   group: "Seguridad" },
  { href: "/admin/security/sessions",        label: "Sesiones activas",         group: "Seguridad" },
  { href: "/admin/security",                 label: "Reset MFA",                group: "Seguridad" },
  { href: "/admin/sso",                      label: "SSO",                      group: "Seguridad" },
  { href: "/admin/audit",                    label: "Auditoría",                group: "Seguridad" },
  { href: "/admin/audit/settings",           label: "Audit settings",           group: "Seguridad" },
  { href: "/admin/api-keys",                 label: "API keys",                 group: "Seguridad" },
  { href: "/admin/integrations",             label: "Integraciones (SCIM)",     group: "Seguridad" },
  { href: "/admin/branding",                 label: "Branding · white-label",   group: "Producto" },
  { href: "/admin/webhooks",                 label: "Webhooks",                 group: "Producto" },
  { href: "/admin/stations",                 label: "Estaciones (kiosk)",      group: "Producto" },
  { href: "/admin/neural",                   label: "Motor adaptativo",         group: "Producto" },
  { href: "/admin/compliance",               label: "SOC 2 · ISO 27001",        group: "Compliance" },
  { href: "/admin/compliance/dsar",          label: "DSAR",                     group: "Compliance" },
  { href: "/admin/nom35",                    label: "NOM-035 (México)",         group: "Compliance" },
  { href: "/admin/nom35/documento",          label: "NOM-035 documento",        group: "Compliance" },
  { href: "/admin/billing",                  label: "Facturación",              group: "Cuenta" },
  { href: "/admin/health",                   label: "Health monitoring",        group: "Plataforma" },
  { href: "/admin/incidents",                label: "Incidents (status page)",  group: "Plataforma" },
  { href: "/admin/maintenance",              label: "Maintenance windows",      group: "Plataforma" },
];

function score(query, item) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const haystack = `${item.label} ${item.group}`.toLowerCase();
  if (haystack.includes(q)) return 10 - haystack.indexOf(q) / 100;
  let qi = 0; let s = 0;
  for (let i = 0; i < haystack.length && qi < q.length; i++) {
    if (haystack[i] === q[qi]) { s += 1; qi += 1; }
  }
  return qi === q.length ? s / q.length : 0;
}

export default function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    return ROUTES
      .map((r) => ({ ...r, _s: score(query, r) }))
      .filter((r) => r._s > 0)
      .sort((a, b) => b._s - a._s)
      .slice(0, 12);
  }, [query]);

  useEffect(() => { setActive(0); }, [query]);

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);
  const go = useCallback((href) => { router.push(href); close(); }, [router, close]);

  useEffect(() => {
    function onKey(e) {
      const isMac = /Mac/i.test(navigator.platform);
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        if (open) { e.preventDefault(); close(); }
      }
    }
    window.addEventListener("keydown", onKey);
    function onClick(e) {
      if (e.target?.closest?.(".bi-admin-cmdk")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  if (!open) return null;
  return (
    <div className="bi-cmdk-backdrop" role="dialog" aria-modal="true" onClick={close}>
      <div className="bi-cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bi-cmdk-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas, ajustes, comandos…"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === "Enter" && filtered[active]) { e.preventDefault(); go(filtered[active].href); }
            }}
          />
          <kbd className="bi-cmdk-esc">esc</kbd>
        </div>
        <ul className="bi-cmdk-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="bi-cmdk-empty">Sin resultados.</li>
          ) : filtered.map((r, i) => (
            <li
              key={r.href}
              role="option"
              aria-selected={i === active}
              className={`bi-cmdk-item ${i === active ? "bi-cmdk-item-active" : ""}`}
              data-kind={r.kind}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.href)}
            >
              <span className="bi-cmdk-item-left">
                {r.kind === "action" && (
                  <span aria-hidden className="bi-cmdk-action-glyph">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                )}
                <span className="bi-cmdk-item-label">{r.label}</span>
              </span>
              <span className="bi-cmdk-item-group">{r.group}</span>
            </li>
          ))}
        </ul>
        <div className="bi-cmdk-foot">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
