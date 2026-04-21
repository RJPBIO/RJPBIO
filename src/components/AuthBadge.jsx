"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cssVar, bioSignal, font, radius, space } from "@/components/ui/tokens";
import { useLocale } from "@/lib/locale-context";

/* Rutas exactas (o como prefijo-con-subpath) donde el badge flotante
   compite con CTAs hero o con flujos críticos. Se oculta silenciosamente. */
const HIDE_PREFIXES = [
  "/signin", "/signup", "/recover", "/mfa", "/verify", "/accept-invite",
  "/pricing", "/demo", "/docs", "/status", "/changelog", "/roi-calculator",
  "/admin", "/settings", "/team", "/error",
  "/for", "/for-healthcare", "/for-manufacturing", "/for-finance", "/for-logistics",
  "/for-tech", "/for-aviation", "/for-energy", "/for-public-sector",
];

const COPY = {
  es: {
    enter: "Entrar",
    enterAria: "Entrar a BIO-IGNICIÓN",
    accountAria: (who) => `Cuenta de ${who}`,
    account: "Cuenta",
    team: "Equipo",
    sessions: "Sesiones activas",
    admin: "Admin",
    signOut: "Cerrar sesión",
  },
  en: {
    enter: "Sign in",
    enterAria: "Sign in to BIO-IGNICIÓN",
    accountAria: (who) => `${who}'s account`,
    account: "Account",
    team: "Team",
    sessions: "Active sessions",
    admin: "Admin",
    signOut: "Sign out",
  },
};

export default function AuthBadge() {
  const pathname = usePathname() || "/";
  const { locale } = useLocale();
  const L = locale === "en" ? "en" : "es";
  const t = COPY[L];

  const [session, setSession] = useState(undefined);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const hidden = HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setSession(j?.user ? j : null); })
      .catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, [hidden]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = useCallback(async () => {
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
      });
      try { localStorage.removeItem("bio-sync-token"); } catch {}
      location.href = "/";
    } catch { location.href = "/signin"; }
  }, []);

  if (hidden || session === undefined) return null;

  const baseBtn = {
    position: "fixed",
    top: 12,
    insetInlineEnd: 12,
    zIndex: 60,
    padding: "8px 14px",
    borderRadius: radius.full,
    fontSize: font.size.base,
    fontWeight: font.weight.bold,
    textDecoration: "none",
    border: `1px solid ${bioSignal.phosphorCyan}59`,
    background: `color-mix(in oklab, ${cssVar.surface} 85%, transparent)`,
    color: bioSignal.ghostCyan,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    cursor: "pointer",
    lineHeight: 1,
  };

  if (!session) {
    return (
      <Link href="/signin" aria-label={t.enterAria} style={baseBtn}>
        {t.enter}
      </Link>
    );
  }

  const user = session.user || {};
  const who = user.name || user.email || "?";
  const initial = who.trim().charAt(0).toUpperCase();
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  const isAdmin = memberships.some((m) => m.role === "OWNER" || m.role === "ADMIN");

  return (
    <div ref={menuRef} style={{ position: "fixed", top: 12, insetInlineEnd: 12, zIndex: 60 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.accountAria(who)}
        style={{
          ...baseBtn,
          position: "static",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          paddingInlineStart: 6,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${bioSignal.phosphorCyan}, ${cssVar.accent})`,
            color: bioSignal.deepField,
            fontWeight: font.weight.black,
            fontSize: font.size.sm,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initial}
        </span>
        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {who}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineEnd: 0,
            minWidth: 200,
            padding: 6,
            background: `color-mix(in oklab, ${cssVar.surface} 97%, transparent)`,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.md,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <MenuLink href="/account">{t.account}</MenuLink>
          <MenuLink href="/team">{t.team}</MenuLink>
          <MenuLink href="/settings/sessions">{t.sessions}</MenuLink>
          {isAdmin && <MenuLink href="/admin">{t.admin}</MenuLink>}
          <div style={{ height: 1, background: cssVar.border, margin: "4px 0" }} />
          <button role="menuitem" onClick={signOut} style={menuItemBtn}>
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: "block",
  padding: "8px 10px",
  borderRadius: radius.sm,
  color: cssVar.text,
  fontSize: font.size.base,
  textDecoration: "none",
  fontWeight: font.weight.medium,
};
const menuItemBtn = {
  ...menuItemStyle,
  width: "100%",
  textAlign: "start",
  background: "transparent",
  border: 0,
  cursor: "pointer",
  color: cssVar.danger,
  fontWeight: font.weight.semibold,
};

function MenuLink({ href, children }) {
  return (
    <Link role="menuitem" href={href} style={menuItemStyle}>
      {children}
    </Link>
  );
}
