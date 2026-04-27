"use client";
import { useEffect, useRef, useState } from "react";

export default function AccountMenu({ userName, userEmail, role, orgName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const initial = (userName || userEmail || "?").trim().slice(0, 1).toUpperCase();

  return (
    <div className="bi-account-menu" ref={ref}>
      <button
        type="button"
        className="bi-admin-user-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        title={userName || userEmail}
        onClick={() => setOpen((v) => !v)}
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="bi-account-menu-panel">
          <div className="bi-account-menu-head">
            <div className="bi-account-menu-name">{userName || userEmail}</div>
            <div className="bi-account-menu-email">{userEmail}</div>
            {orgName && (
              <div className="bi-account-menu-org">
                <span aria-hidden className="bi-account-menu-org-dot" />
                {orgName}
                {role && <span className="bi-account-menu-role">{role}</span>}
              </div>
            )}
          </div>
          <div className="bi-account-menu-divider" />
          <a role="menuitem" className="bi-account-menu-item" href="/account">Mi cuenta</a>
          <a role="menuitem" className="bi-account-menu-item" href="/settings">Preferencias</a>
          <a role="menuitem" className="bi-account-menu-item" href="/admin">Cambiar de organización</a>
          <div className="bi-account-menu-divider" />
          <a role="menuitem" className="bi-account-menu-item bi-account-menu-item-danger" href="/api/auth/signout">Cerrar sesión</a>
        </div>
      )}
    </div>
  );
}
