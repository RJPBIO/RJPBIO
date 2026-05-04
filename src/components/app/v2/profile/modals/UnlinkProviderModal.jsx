"use client";
import { useEffect, useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4a — UnlinkProviderModal. Lista los providers OAuth
// vinculados (GET /api/v1/me/providers) y permite desvincular uno
// (DELETE /api/v1/me/providers/[provider]). El backend rechaza el
// último provider — si user solo tiene uno, mostramos info-only sin
// botón unlink.

const PROVIDER_LABELS = {
  google:      { label: "Google",       icon: "G" },
  apple:       { label: "Apple",        icon: "" },
  github:      { label: "GitHub",       icon: "GH" },
  email:       { label: "Magic link",   icon: "@" },
  phone:       { label: "Teléfono",     icon: "#" },
  credentials: { label: "Email/password", icon: "·" },
};

export default function UnlinkProviderModal({ onClose, onComplete }) {
  const [providers, setProviders] = useState(null); // null = loading
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(null); // provider name being unlinked
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // confirmation state

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/me/providers", { credentials: "include" });
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = await res.json();
        if (!cancelled) setProviders(Array.isArray(data?.providers) ? data.providers : []);
      } catch {
        if (!cancelled) setError("No se pudo cargar la lista de proveedores.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUnlink = async (provider) => {
    setUnlinking(provider);
    setError(null);
    try {
      const res = await csrfFetch(
        `/api/v1/me/providers/${encodeURIComponent(provider)}`,
        { method: "DELETE" }
      );
      if (res.status === 409) {
        const j = await safeJson(res);
        setError(j?.message || "No puedes desvincular tu único método de acceso.");
        setPending(null);
        return;
      }
      if (res.status === 404) {
        setError("Este proveedor ya no está vinculado.");
        setPending(null);
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}. Intenta de nuevo.`);
        setPending(null);
        return;
      }
      // Re-fetch lista
      const refresh = await fetch("/api/v1/me/providers", { credentials: "include" });
      const data = await safeJson(refresh);
      setProviders(Array.isArray(data?.providers) ? data.providers : []);
      onComplete?.({ unlinkedProvider: provider });
      setPending(null);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setUnlinking(null);
    }
  };

  const isLast = providers && providers.length <= 1;

  return (
    <ModalShell
      title="Proveedores vinculados"
      eyebrow="CUENTA · PROVIDERS"
      eyebrowTone="cyan"
      onClose={unlinking ? undefined : onClose}
      testId="unlink-provider"
      maxWidth={420}
    >
      {loading && (
        <ModalText tone="muted">Cargando proveedores…</ModalText>
      )}

      {!loading && providers && providers.length === 0 && (
        <ModalText tone="muted">
          No hay proveedores vinculados a tu cuenta. Esto es inusual — contacta a soporte si crees que es un error.
        </ModalText>
      )}

      {!loading && providers && providers.length > 0 && (
        <>
          {isLast && (
            <ModalText tone="secondary">
              Tienes un solo proveedor vinculado. Para mantener acceso a tu cuenta, vincula otro proveedor antes de desvincular este.
            </ModalText>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
            {providers.map((p, i) => {
              const meta = PROVIDER_LABELS[p.provider] || { label: p.provider, icon: "·" };
              const confirming = pending === p.provider;
              const busy = unlinking === p.provider;
              return (
                <li
                  key={p.provider}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing.s8,
                    paddingBlock: 12,
                    borderBlockEnd: i === providers.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.s16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span
                        style={{
                          fontFamily: typography.family,
                          fontSize: typography.size.bodyMin,
                          fontWeight: typography.weight.medium,
                          color: colors.text.strong,
                        }}
                      >
                        {meta.label}
                      </span>
                      {p.accountSub && (
                        <span
                          style={{
                            fontFamily: typography.familyMono,
                            fontSize: typography.size.microCaps,
                            color: colors.text.muted,
                            fontWeight: typography.weight.regular,
                          }}
                        >
                          ID · {p.accountSub}…
                        </span>
                      )}
                    </div>
                    {!confirming && !isLast && (
                      <ModalCta
                        variant="outlined"
                        onClick={() => setPending(p.provider)}
                        disabled={!!unlinking}
                        testId={`unlink-${p.provider}`}
                      >
                        Desvincular
                      </ModalCta>
                    )}
                  </div>
                  {confirming && (
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing.s8, paddingBlockStart: spacing.s8 }}>
                      <ModalText tone="secondary">¿Desvincular {meta.label}?</ModalText>
                      <ModalRow>
                        <ModalCta variant="outlined" onClick={() => setPending(null)} disabled={busy}>
                          No, cancelar
                        </ModalCta>
                        <ModalCta variant="danger" onClick={() => handleUnlink(p.provider)} disabled={busy} testId={`confirm-unlink-${p.provider}`}>
                          {busy ? "Desvinculando…" : "Sí, desvincular"}
                        </ModalCta>
                      </ModalRow>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {error && (
        <div
          role="alert"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: `0.5px solid ${colors.semantic.danger}`,
            borderRadius: radii.panel,
            padding: spacing.s16,
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.semantic.danger,
          }}
        >
          {error}
        </div>
      )}

      <ModalRow justify="flex-end">
        <ModalCta variant="outlined" onClick={onClose} disabled={!!unlinking} testId="unlink-close">
          Cerrar
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
