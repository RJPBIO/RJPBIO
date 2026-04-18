"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const HIDE_PREFIXES = [
  "/signin", "/signup", "/recover", "/mfa", "/verify", "/accept-invite",
  "/pricing", "/demo", "/docs", "/status", "/changelog", "/roi-calculator",
  "/admin", "/settings", "/team", "/error",
];

export default function AuthBadge() {
  const pathname = usePathname() || "/";
  const [session, setSession] = useState(undefined);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const hidden = HIDE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (!cancelled) setSession(j?.user ? j : null); })
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
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid rgba(16,185,129,0.45)",
    background: "rgba(15,23,42,0.75)",
    color: "#A7F3D0",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    cursor: "pointer",
    lineHeight: 1,
  };

  if (!session) {
    return (
      <Link href="/signin" aria-label="Entrar a BIO-IGNICIÓN" style={baseBtn}>
        Entrar
      </Link>
    );
  }

  const user = session.user || {};
  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  const isAdmin = memberships.some(m => m.role === "OWNER" || m.role === "ADMIN");

  return (
    <div ref={menuRef} style={{ position: "fixed", top: 12, insetInlineEnd: 12, zIndex: 60 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Cuenta de ${user.name || user.email}`}
        style={{
          ...baseBtn,
          position: "static",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          paddingInlineStart: 6,
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "linear-gradient(135deg, #10B981, #059669)",
          color: "#0B0E14", fontWeight: 800, fontSize: 12,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {initial}
        </span>
        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.name || user.email}
        </span>
      </button>
      {open && (
        <div role="menu" style={{
          position: "absolute", top: "calc(100% + 6px)", insetInlineEnd: 0,
          minWidth: 200, padding: 6,
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(51,65,85,0.8)",
          borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <MenuLink href="/account">Cuenta</MenuLink>
          <MenuLink href="/team">Equipo</MenuLink>
          <MenuLink href="/settings/sessions">Sesiones activas</MenuLink>
          {isAdmin && <MenuLink href="/admin">Admin</MenuLink>}
          <div style={{ height: 1, background: "rgba(51,65,85,0.6)", margin: "4px 0" }} />
          <button role="menuitem" onClick={signOut} style={menuItemBtn}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: "block",
  padding: "8px 10px",
  borderRadius: 8,
  color: "#E2E8F0",
  fontSize: 13,
  textDecoration: "none",
  fontWeight: 500,
};
const menuItemBtn = {
  ...menuItemStyle,
  width: "100%",
  textAlign: "start",
  background: "transparent",
  border: 0,
  cursor: "pointer",
  color: "#FCA5A5",
  fontWeight: 600,
};

function MenuLink({ href, children }) {
  return <Link role="menuitem" href={href} style={menuItemStyle}>{children}</Link>;
}
