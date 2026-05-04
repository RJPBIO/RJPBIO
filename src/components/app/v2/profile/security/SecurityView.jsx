"use client";
import { useEffect, useState } from "react";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, TextLink, ScrollPad } from "../primitives";
import { typography, colors, spacing, radii } from "../../tokens";

// Phase 6D SP4b — SecurityView wired al endpoint REAL /api/v1/me/security
// (agregado MFA + sessions + trustedDevices). Reemplaza SP3 empty state
// genérico. Cuando user no tiene MFA → CTA "Configurar TOTP" (action
// mfa-setup, handled en AppV2Root). Cuando MFA active → backup codes
// remaining + sessions list con revocar + trusted devices con quitar.

export default function SecurityView({ onBack, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/v1/me/security", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setError(res.status);
          return;
        }
        const j = await res.json();
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) setError("network");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Re-fetch tras cualquier acción exitosa (mfa-setup, disable, revoke).
  // El padre AppV2Root podría llamarnos vía un effect, pero más simple
  // es recargar cuando volvamos al sub-view (re-mount del componente).

  return (
    <>
      <SubRouteHeader title="Seguridad" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>AUTENTICACIÓN DE DOS FACTORES</Kicker>
          {loading && <EmptyCard message="Cargando…" subMessage="Conectando con el servidor." />}
          {!loading && error && (
            <EmptyCard
              message="No se pudo cargar"
              subMessage={error === 401
                ? "Inicia sesión para gestionar tu seguridad."
                : "Intenta recargar la página."}
            />
          )}
          {!loading && !error && data?.mfa && (
            <MfaCard
              mfa={data.mfa}
              onSetup={() => onNavigate && onNavigate({ action: "mfa-setup" })}
              onDisable={() => onNavigate && onNavigate({
                action: "mfa-disable",
                stepUpFresh: data.mfa.stepUpFreshSeconds > 0,
              })}
              onBackup={() => onNavigate && onNavigate({
                action: "mfa-backup-codes",
                stepUpFresh: data.mfa.stepUpFreshSeconds > 0,
              })}
            />
          )}
        </Section>

        <Section>
          <Kicker>SESIONES ACTIVAS</Kicker>
          {!loading && !error && data?.sessions && (
            <SessionsList
              sessions={data.sessions.items}
              onRevoke={(s) => onNavigate && onNavigate({ action: "revoke-session", session: s })}
            />
          )}
          {!loading && !error && (!data?.sessions || data.sessions.count === 0) && (
            <EmptyCard
              message="Sin sesiones activas adicionales"
              subMessage="Solo está activa esta sesión."
            />
          )}
        </Section>

        <Section paddingBottom={48}>
          <Kicker>DISPOSITIVOS CONFIABLES</Kicker>
          {!loading && !error && data?.trustedDevices && data.trustedDevices.count > 0 && (
            <TrustedDevicesList
              devices={data.trustedDevices.items}
              onRemove={(d) => onNavigate && onNavigate({ action: "remove-trusted-device", device: d })}
            />
          )}
          {!loading && !error && (!data?.trustedDevices || data.trustedDevices.count === 0) && (
            <EmptyCard
              message="Sin dispositivos confiables"
              subMessage="Marca un dispositivo como confiable después de verificar MFA en él para saltarte el código durante 30 días."
            />
          )}
        </Section>
      </ScrollPad>
    </>
  );
}

function MfaCard({ mfa, onSetup, onDisable, onBackup }) {
  const enabled = mfa.enabled;
  const verifiedAt = mfa.verifiedAt;
  const backupRemaining = mfa.backupCodesRemaining || 0;
  const lockedSecondsRemaining = mfa.lockedSecondsRemaining || 0;

  if (!enabled) {
    return (
      <Card>
        <StatLine
          value="MFA no configurado"
          caption="Recomendado para mayor seguridad de tu cuenta."
        />
        <PillButton onClick={onSetup}>
          Configurar TOTP
        </PillButton>
      </Card>
    );
  }

  return (
    <Card>
      <StatLine
        value="MFA activo"
        caption={
          (verifiedAt ? `Última verificación: ${formatRelative(verifiedAt)}` : "MFA activo") +
          ` · ${backupRemaining}/10 códigos de respaldo`
        }
      />
      {lockedSecondsRemaining > 0 && (
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.semantic.danger,
            fontWeight: typography.weight.medium,
          }}
        >
          BLOQUEADO · {Math.ceil(lockedSecondsRemaining / 60)} MIN RESTANTES
        </span>
      )}
      <div style={{ display: "flex", gap: spacing.s16, flexWrap: "wrap" }}>
        <PillButton variant="outlined" onClick={onBackup}>
          Regenerar códigos de respaldo
        </PillButton>
        <TextLink onClick={onDisable}>
          DESACTIVAR MFA
        </TextLink>
      </div>
    </Card>
  );
}

function SessionsList({ sessions, onRevoke }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {sessions.map((s, i) => (
        <li
          key={s.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.s16,
            paddingBlock: 14,
            borderBlockEnd: i === sessions.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span
              style={{
                fontFamily: typography.family,
                fontSize: typography.size.bodyMin,
                fontWeight: typography.weight.medium,
                color: colors.text.strong,
              }}
            >
              {s.label || s.userAgent || "Dispositivo desconocido"}
              {s.current ? " · esta sesión" : ""}
            </span>
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.06em",
                color: colors.text.muted,
                fontWeight: typography.weight.regular,
              }}
            >
              {s.ip || "—"} · {formatRelative(s.lastSeenAt)}
            </span>
          </span>
          {!s.current && (
            <TextLink onClick={() => onRevoke(s)}>
              REVOCAR
            </TextLink>
          )}
        </li>
      ))}
    </ul>
  );
}

function TrustedDevicesList({ devices, onRemove }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {devices.map((d, i) => (
        <li
          key={d.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.s16,
            paddingBlock: 14,
            borderBlockEnd: i === devices.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span
              style={{
                fontFamily: typography.family,
                fontSize: typography.size.bodyMin,
                fontWeight: typography.weight.medium,
                color: colors.text.strong,
              }}
            >
              {d.label}
            </span>
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.06em",
                color: colors.text.muted,
                fontWeight: typography.weight.regular,
              }}
            >
              Agregado {formatRelative(d.createdAt)} · expira {formatRelative(d.expiresAt)}
            </span>
          </span>
          <TextLink onClick={() => onRemove(d)}>
            QUITAR
          </TextLink>
        </li>
      ))}
    </ul>
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

function formatRelative(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) {
    // En el futuro (e.g. expiresAt) — formato distinto
    const future = -ms;
    const d = Math.floor(future / (24 * 60 * 60 * 1000));
    if (d > 1) return `en ${d} días`;
    const h = Math.floor(future / (60 * 60 * 1000));
    if (h > 0) return `en ${h}h`;
    return "pronto";
  }
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d}d`;
  return `hace ${Math.floor(d / 30)} mes${d > 60 ? "es" : ""}`;
}
