"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch, readCsrfToken } from "./ModalShell";
import { colors } from "../../tokens";

// Phase 6D SP4a — SignoutModal con dos scopes:
//
//   scope="current": cierra solo este dispositivo. Usa next-auth signOut()
//   client-side helper que invalida el JWT cookie + redirige a /signin.
//
//   scope="all": cierra TODAS las sesiones (revoca rows en UserSession +
//   bumps sessionEpoch para invalidar JWTs en cualquier dispositivo). Wire
//   al endpoint POST /api/auth/signout-all (existente — Sprint 8 backend).
//   Retorna 303 con Clear-Site-Data → el browser limpia cookies + storage.

export default function SignoutModal({ scope = "current", onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isAll = scope === "all";

  const handleSignout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isAll) {
        // Endpoint existente devuelve 303 → /signin?signedOut=1 + Clear-Site-Data.
        // Usamos form-style POST para que el browser haga el redirect natural.
        const token = readCsrfToken();
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/signout-all";
        // CSRF como hidden input además del header (defensa extra) — el
        // endpoint valida header `x-csrf-token`, así que el form.submit
        // no funciona directo. En su lugar fetch + manual redirect.
        const res = await csrfFetch("/api/auth/signout-all", { method: "POST", redirect: "manual" });
        // type=opaqueredirect cuando hay 303 con redirect:"manual"
        if (res.type === "opaqueredirect" || res.status === 0 || res.ok || res.status === 303) {
          // Clear-Site-Data ya limpió todo. Forzar reload a /signin.
          if (typeof window !== "undefined") {
            window.location.href = "/signin?signedOut=1";
          }
          return;
        }
        if (res.status === 401) {
          setError("Ya no hay sesión activa.");
          if (typeof window !== "undefined") window.location.href = "/signin";
          return;
        }
        setError(`Error ${res.status}. Intenta recargar.`);
        return;
      }
      // scope === "current" — usa el helper de next-auth client.
      await signOut({ callbackUrl: "/signin?signedOut=1", redirect: true });
    } catch {
      setError("No se pudo cerrar la sesión. Intenta recargar la página.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={isAll ? "Cerrar todas las sesiones" : "Cerrar sesión"}
      eyebrow={isAll ? "CUENTA · TODAS LAS SESIONES" : "CUENTA · SESIÓN ACTUAL"}
      eyebrowTone={isAll ? "danger" : "cyan"}
      onClose={submitting ? undefined : onClose}
      testId={isAll ? "signout-all" : "signout-current"}
    >
      <ModalText>
        {isAll
          ? "Cierra tu sesión en todos los dispositivos donde tengas Bio-Ignición abierto. Tendrás que iniciar sesión de nuevo en cada dispositivo. Útil si perdiste un dispositivo o sospechas acceso no autorizado."
          : "Cierra tu sesión en este dispositivo. Tus datos locales (sesiones, calibración) permanecen guardados — al volver a iniciar sesión los recuperas."}
      </ModalText>

      {error && (
        <div
          role="alert"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: `0.5px solid ${colors.semantic.danger}`,
            borderRadius: 8,
            padding: 16,
            color: colors.semantic.danger,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <ModalRow>
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="signout-cancel">
          Cancelar
        </ModalCta>
        <ModalCta
          variant={isAll ? "danger" : "primary"}
          onClick={handleSignout}
          disabled={submitting}
          testId="signout-confirm"
        >
          {submitting
            ? "Cerrando…"
            : isAll ? "Cerrar todas" : "Cerrar sesión"}
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}
