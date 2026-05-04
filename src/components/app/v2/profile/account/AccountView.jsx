"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, PillButton, TextLink, ScrollPad } from "../primitives";
import { typography, spacing, colors, radii } from "../../tokens";

// Phase 6D SP4a — AccountView wired al store + endpoint /api/v1/me/providers.
// Cambios vs SP3:
//   - Email card: lee state._userEmail real. CTA "Cambiar email" dispara
//     onNavigate({action:"change-email"}) que monta ChangeEmailModal en
//     AppV2Root (wired a /api/account/link-email existente).
//   - Sección CONTRASEÑA eliminada: el User schema NO tiene password
//     field — NextAuth en este repo es OAuth/magic-link only. Mantener
//     la sección decía "Configurada" pero era falso (Bug-02 residual).
//   - Sección PROVIDERS reintroducida: lista real desde GET /api/v1/me/providers
//     con CTA "Gestionar proveedores" que abre UnlinkProviderModal.
//   - Sección SESIÓN: las dos CTAs (current/all) ahora abren SignoutModal
//     wired a next-auth signOut() y POST /api/auth/signout-all.
//
// Empty states honestos cuando no hay sesión activa.

export default function AccountView({ onBack, onNavigate }) {
  const userEmail = useStore((s) => s._userEmail);
  const [providersInfo, setProvidersInfo] = useState({ loading: true, count: 0, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/me/providers", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setProvidersInfo({ loading: false, count: 0, error: res.status });
          return;
        }
        const data = await res.json();
        if (!cancelled) setProvidersInfo({ loading: false, count: data?.count || 0, error: null });
      } catch {
        if (!cancelled) setProvidersInfo({ loading: false, count: 0, error: "network" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <SubRouteHeader title="Cuenta" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>EMAIL</Kicker>
          {userEmail ? (
            <Card>
              <span
                style={{
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.regular,
                  color: colors.text.primary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail}
              </span>
              <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "change-email" })}>
                Cambiar email
              </PillButton>
            </Card>
          ) : (
            <EmptyCard
              message="Email no disponible"
              subMessage="Inicia sesión para gestionar tu cuenta."
            />
          )}
        </Section>

        <Section>
          <Kicker>PROVEEDORES VINCULADOS</Kicker>
          {providersInfo.loading ? (
            <EmptyCard
              message="Cargando proveedores…"
              subMessage="Conectando con el servidor."
            />
          ) : providersInfo.error ? (
            <EmptyCard
              message="No se pudo cargar"
              subMessage={providersInfo.error === 401
                ? "Inicia sesión para ver tus proveedores vinculados."
                : "Intenta recargar la página."}
            />
          ) : (
            <Card>
              <span
                style={{
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.regular,
                  color: colors.text.primary,
                }}
              >
                {providersInfo.count === 0
                  ? "Sin proveedores vinculados"
                  : `${providersInfo.count} proveedor${providersInfo.count === 1 ? "" : "es"} vinculado${providersInfo.count === 1 ? "" : "s"}`}
              </span>
              <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "unlink-provider" })}>
                Gestionar proveedores
              </PillButton>
            </Card>
          )}
        </Section>

        <Section paddingBottom={48}>
          <Kicker>SESIÓN</Kicker>
          <Card>
            <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "signout-current" })}>
              Cerrar sesión en este dispositivo
            </PillButton>
            <TextLink onClick={() => onNavigate && onNavigate({ action: "signout-all" })}>
              CERRAR SESIÓN EN TODOS LOS DISPOSITIVOS
            </TextLink>
          </Card>
        </Section>
      </ScrollPad>
    </>
  );
}

function EmptyCard({ message, subMessage }) {
  return (
    <article
      style={{
        background: "transparent",
        border: `0.5px dashed ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          color: colors.text.secondary,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}
      >
        {message}
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.regular,
          color: colors.text.muted,
          lineHeight: 1.4,
        }}
      >
        {subMessage}
      </span>
    </article>
  );
}
