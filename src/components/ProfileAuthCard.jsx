"use client";
/* ═══════════════════════════════════════════════════════════════
   PROFILE AUTH CARD — sign-in/out block inside Perfil
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, ty, font, space, radius, bioSignal } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

export default function ProfileAuthCard({ isDark, ac }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const [session, setSession] = useState(undefined);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setSession(j?.user ? j : null); })
      .catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, []);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, callbackUrl: "/app" }),
      });
      try { localStorage.removeItem("bio-sync-token"); } catch {}
      location.href = "/app";
    } catch {
      setSigningOut(false);
      location.href = "/signin";
    }
  }, []);

  if (session === undefined) {
    return (
      <div
        aria-hidden="true"
        style={{
          background: cd,
          border: `1px solid ${bd}`,
          borderRadius: 16,
          padding: 16,
          marginBlockEnd: 12,
          blockSize: 92,
          opacity: 0.5,
        }}
      />
    );
  }

  const enter = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } };

  if (!session) {
    return (
      <motion.section
        {...enter}
        aria-label="Sincronización de cuenta"
        style={{
          background: `linear-gradient(145deg, ${cd}, ${withAlpha(ac, 6)})`,
          border: `1px solid ${withAlpha(ac, 18)}`,
          borderRadius: 16,
          padding: 16,
          marginBlockEnd: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetBlockStart: -24,
            insetInlineEnd: -24,
            inlineSize: 96,
            blockSize: 96,
            borderRadius: "50%",
            background: withAlpha(ac, 8),
            filter: "blur(18px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBlockEnd: 8 }}>
          <div
            aria-hidden="true"
            style={{
              inlineSize: 32,
              blockSize: 32,
              borderRadius: radius.full,
              background: `linear-gradient(135deg, ${bioSignal.phosphorCyan}, ${ac})`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${withAlpha(ac, 30)}`,
            }}
          >
            <Icon name="bolt" size={16} color={bioSignal.deepField} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minInlineSize: 0 }}>
            <div style={ty.title(t1)}>Sincroniza tu progreso</div>
            <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>
              Cifrado end-to-end · multi-dispositivo · opcional
            </div>
          </div>
        </div>

        <ul
          aria-label="Beneficios de sincronizar"
          style={{
            listStyle: "none",
            padding: 0,
            margin: "4px 0 12px",
            display: "grid",
            gap: 4,
          }}
        >
          {[
            "Respalda sesiones, baseline y rachas",
            "Continúa en otro dispositivo sin perder datos",
            "Recupera tu perfil si cambias de equipo",
          ].map((b, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: font.size.sm,
                color: t2,
                lineHeight: 1.35,
              }}
            >
              <Icon name="check" size={12} color={semantic.success} aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Link
            href="/signin?callbackUrl=/app"
            className="bi-auth-btn bi-auth-btn--primary"
            style={{
              "--bi-auth-accent": ac,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 14px",
              borderRadius: radius.full,
              background: `linear-gradient(135deg, ${bioSignal.phosphorCyan}, ${ac})`,
              color: bioSignal.deepField,
              fontSize: font.size.base,
              fontWeight: font.weight.bold,
              textDecoration: "none",
              boxShadow: `0 4px 16px ${withAlpha(ac, 35)}`,
              border: "1px solid transparent",
            }}
          >
            <Icon name="fingerprint" size={14} color={bioSignal.deepField} aria-hidden="true" />
            Iniciar sesión
          </Link>
          <Link
            href="/signup?callbackUrl=/app"
            className="bi-auth-btn"
            style={{
              "--bi-auth-accent": ac,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 14px",
              borderRadius: radius.full,
              background: "transparent",
              color: t1,
              fontSize: font.size.base,
              fontWeight: font.weight.semibold,
              textDecoration: "none",
              border: `1px solid ${withAlpha(ac, 35)}`,
            }}
          >
            <Icon name="sparkle" size={14} color={t1} aria-hidden="true" />
            Crear cuenta
          </Link>
        </div>
      </motion.section>
    );
  }

  const user = session.user || {};
  const who = user.name || user.email || "Operador";
  const initial = who.trim().charAt(0).toUpperCase();
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  const primaryOrg = memberships[0]?.org;
  const isAdmin = memberships.some((m) => m.role === "OWNER" || m.role === "ADMIN");

  return (
    <motion.section
      {...enter}
      aria-label="Cuenta sincronizada"
      style={{
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 16,
        padding: 14,
        marginBlockEnd: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          aria-hidden="true"
          style={{
            inlineSize: 40,
            blockSize: 40,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${bioSignal.phosphorCyan}, ${ac})`,
            color: bioSignal.deepField,
            fontWeight: font.weight.black,
            fontSize: font.size.lg,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 12px ${withAlpha(ac, 25)}`,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minInlineSize: 0 }}>
          <div
            style={{
              ...ty.title(t1),
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {who}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBlockStart: 2,
              fontSize: font.size.xs,
              color: t3,
            }}
          >
            <motion.span
              aria-hidden="true"
              animate={reduced ? undefined : { opacity: [1, 0.5, 1], scale: [1, 0.82, 1] }}
              transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                inlineSize: 6,
                blockSize: 6,
                borderRadius: "50%",
                background: semantic.success,
                boxShadow: `0 0 8px ${semantic.success}`,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span>Sincronizado</span>
            {primaryOrg?.name && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxInlineSize: 140,
                  }}
                >
                  {primaryOrg.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isAdmin ? "1fr 1fr 1fr" : "1fr 1fr",
          gap: 6,
          marginBlockStart: 12,
        }}
      >
        <Link
          href="/account"
          className="bi-auth-btn"
          style={{
            "--bi-auth-accent": ac,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 10px",
            borderRadius: radius.md,
            background: withAlpha(ac, 6),
            color: t1,
            fontSize: font.size.sm,
            fontWeight: font.weight.semibold,
            textDecoration: "none",
            border: `1px solid ${withAlpha(ac, 18)}`,
          }}
        >
          <Icon name="gear" size={12} color={t1} aria-hidden="true" />
          Cuenta
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="bi-auth-btn"
            style={{
              "--bi-auth-accent": bioSignal.neuralViolet,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: radius.md,
              background: withAlpha(bioSignal.neuralViolet, 8),
              color: t1,
              fontSize: font.size.sm,
              fontWeight: font.weight.semibold,
              textDecoration: "none",
              border: `1px solid ${withAlpha(bioSignal.neuralViolet, 25)}`,
            }}
          >
            <Icon name="shield" size={12} color={t1} aria-hidden="true" />
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="bi-auth-btn"
          style={{
            "--bi-auth-accent": semantic.danger,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 10px",
            borderRadius: radius.md,
            background: "transparent",
            color: semantic.danger,
            fontSize: font.size.sm,
            fontWeight: font.weight.semibold,
            textDecoration: "none",
            border: `1px solid ${withAlpha(semantic.danger, 30)}`,
            cursor: signingOut ? "wait" : "pointer",
            opacity: signingOut ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          <span aria-live="polite">{signingOut ? "Cerrando…" : "Salir"}</span>
        </button>
      </div>
    </motion.section>
  );
}
