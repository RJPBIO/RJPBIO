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
    const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
    return (
      <motion.section
        {...enter}
        aria-label="Sincronización de cuenta"
        style={{
          position: "relative",
          background: `radial-gradient(ellipse 70% 60% at 0% 0%, ${withAlpha(ac, 16)} 0%, transparent 50%), radial-gradient(ellipse 70% 60% at 100% 100%, ${withAlpha(bioSignal.neuralViolet, 12)} 0%, transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`,
          backdropFilter: "blur(24px) saturate(150%) brightness(1.03)",
          WebkitBackdropFilter: "blur(24px) saturate(150%) brightness(1.03)",
          border: `0.5px solid rgba(255,255,255,0.10)`,
          borderRadius: 20,
          padding: "16px 16px 14px",
          marginBlockEnd: 14,
          overflow: "hidden",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.30), 0 0 0 1px ${withAlpha(ac, 18)}`,
        }}
      >
        {/* Sync Bridge Visualization — local node ↔ cloud node */}
        <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 0, marginBlockEnd: 14, padding: "4px 4px 0" }}>
          {/* Local node — squircle device */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ inlineSize: 30, blockSize: 30, borderRadius: 9, background: `linear-gradient(140deg, ${withAlpha(ac, 28)} 0%, ${withAlpha(ac, 10)} 100%)`, border: `0.5px solid ${withAlpha(ac, 38)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 0 12px ${withAlpha(ac, 22)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <rect x="2" y="3" width="10" height="7" rx="1.2" stroke={ac} strokeWidth="1" fill="none" />
                <rect x="4.5" y="10.5" width="5" height="0.8" fill={ac} opacity="0.6" />
              </svg>
            </div>
            <span style={{ position: "absolute", insetBlockStart: -14, insetInlineStart: 0, fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: withAlpha(ac, 90), letterSpacing: "0.18em", textTransform: "uppercase" }}>Local</span>
          </div>

          {/* Connection line — dashed broken */}
          <div style={{ flex: 1, blockSize: 1, position: "relative", marginInline: 6 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, blockSize: 1, background: `repeating-linear-gradient(90deg, ${withAlpha(ac, 50)} 0, ${withAlpha(ac, 50)} 4px, transparent 4px, transparent 8px)` }} />
            {/* Break marker — X in the center */}
            <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", inlineSize: 11, blockSize: 11, borderRadius: 3, background: "#08080A", border: `0.5px solid ${withAlpha(semantic.danger, 60)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
                <line x1="1" y1="1" x2="5" y2="5" stroke={semantic.danger} strokeWidth="1" strokeLinecap="round" />
                <line x1="5" y1="1" x2="1" y2="5" stroke={semantic.danger} strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Cloud node — squircle (dimmed since not connected) */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ inlineSize: 30, blockSize: 30, borderRadius: 9, background: `linear-gradient(140deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `0.5px dashed ${withAlpha(ac, 28)}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.55 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3.5 8.5 Q3 7 4 6 Q4.5 4.5 6 4.5 Q7 3 8.5 3.5 Q10.5 4 10.5 6 Q12 6.5 11.5 8 Q11 9.5 9.5 9.5 L4.5 9.5 Q3 9.5 3.5 8.5 Z" stroke={withAlpha(ac, 70)} strokeWidth="0.8" fill="none" />
              </svg>
            </div>
            <span style={{ position: "absolute", insetBlockStart: -14, insetInlineEnd: 0, fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: "rgba(245,245,247,0.42)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Cloud</span>
          </div>
        </div>

        {/* Title — eyebrow + display vertical asymmetric */}
        <div style={{ marginBlockEnd: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBlockEnd: 4 }}>
            <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block" }}>
              <motion.span animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }} transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }} style={{ position: "absolute", inset: 0, borderRadius: "50%", background: semantic.danger }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${semantic.danger} 60%, ${semantic.danger} 100%)`, boxShadow: `0 0 6px ${semantic.danger}` }} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: semantic.danger, letterSpacing: "0.22em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(semantic.danger, 50)}` }}>Sin conectar</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.4, color: "rgba(245,245,247,0.96)" }}>Sincroniza tu progreso</div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: "rgba(245,245,247,0.50)", letterSpacing: "0.16em", textTransform: "uppercase", marginBlockStart: 4 }}>Cifrado end-to-end · Multi-dispositivo · Opcional</div>
        </div>

        {/* Benefits — asymmetric numbered list with custom glyphs (NOT generic checks) */}
        <ul aria-label="Beneficios de sincronizar" style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "grid", gap: 7 }}>
          {[
            { n: "01", t: "Respalda sesiones, baseline y rachas" },
            { n: "02", t: "Continúa en otro dispositivo sin perder datos" },
            { n: "03", t: "Recupera tu perfil si cambias de equipo" },
          ].map((b, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12.5, color: "rgba(245,245,247,0.72)", lineHeight: 1.4, letterSpacing: -0.05 }}>
              <span aria-hidden="true" style={{ flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: ac, letterSpacing: "0.14em", paddingBlockStart: 2, textShadow: `0 0 6px ${withAlpha(ac, 50)}`, fontVariantNumeric: "tabular-nums" }}>{b.n}</span>
              <span aria-hidden="true" style={{ flexShrink: 0, inlineSize: 1, blockSize: 12, background: `linear-gradient(180deg, ${withAlpha(ac, 50)} 0%, transparent 100%)`, marginBlockStart: 3 }} />
              <span style={{ paddingBlockStart: 1 }}>{b.t}</span>
            </li>
          ))}
        </ul>

        {/* CTAs asymmetric — primary larger 60%, secondary 40% */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
          <Link
            href="/signin?callbackUrl=/app"
            aria-label="Iniciar sesión para sincronizar"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "12px 14px",
              borderRadius: 99,
              background: `linear-gradient(180deg, ${ac} 0%, ${withAlpha(ac, 90)} 50%, ${withAlpha(bioSignal.neuralViolet, 80)} 100%)`,
              color: "#08080A",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.05,
              textDecoration: "none",
              boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 1px 0 ${ac}, 0 8px 22px ${withAlpha(ac, 40)}, 0 0 24px ${withAlpha(ac, 26)}, 0 0 0 1px ${withAlpha(ac, 60)}`,
              border: "none",
              overflow: "hidden",
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`, pointerEvents: "none" }} />
            <Icon name="fingerprint" size={14} color="#08080A" aria-hidden="true" />
            <span style={{ position: "relative" }}>Iniciar sesión</span>
          </Link>
          <Link
            href="/signup?callbackUrl=/app"
            aria-label="Crear cuenta nueva"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "12px 10px",
              borderRadius: 99,
              background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)`,
              backdropFilter: "blur(14px) saturate(140%)",
              WebkitBackdropFilter: "blur(14px) saturate(140%)",
              color: "rgba(245,245,247,0.92)",
              fontFamily: MONO,
              fontSize: 9.5,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              border: `0.5px solid rgba(255,255,255,0.16)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 14px rgba(0,0,0,0.20)`,
            }}
          >
            <Icon name="sparkle" size={11} color="rgba(245,245,247,0.92)" aria-hidden="true" />
            <span>Crear cuenta</span>
          </Link>
        </div>
      </motion.section>
    );
  }

  const user = session.user || {};
  const who = user.name || user.email || "Operador";
  const email = user.email;
  const initial = who.trim().charAt(0).toUpperCase();
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  const primaryOrg = memberships[0]?.org;
  const isAdmin = memberships.some((m) => m.role === "OWNER" || m.role === "ADMIN");
  const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <motion.section
      {...enter}
      aria-label="Cuenta sincronizada"
      style={{
        position: "relative",
        background: `radial-gradient(ellipse 70% 60% at 0% 0%, ${withAlpha(semantic.success, 14)} 0%, transparent 50%), radial-gradient(ellipse 60% 60% at 100% 100%, ${withAlpha(ac, 10)} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`,
        backdropFilter: "blur(24px) saturate(150%) brightness(1.03)",
        WebkitBackdropFilter: "blur(24px) saturate(150%) brightness(1.03)",
        border: `0.5px solid rgba(255,255,255,0.10)`,
        borderRadius: 18,
        padding: "14px 16px 12px",
        marginBlockEnd: 12,
        overflow: "hidden",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 22px rgba(0,0,0,0.30), 0 0 0 1px ${withAlpha(semantic.success, 16)}, 0 0 18px ${withAlpha(semantic.success, 8)}`,
      }}
    >
      {/* Top eyebrow row — sync status + org */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBlockEnd: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span aria-hidden="true" style={{ position: "relative", inlineSize: 6, blockSize: 6, display: "inline-block" }}>
            <motion.span
              animate={reduced ? undefined : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
              transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              style={{ position: "absolute", inset: 0, borderRadius: "50%", background: semantic.success }}
            />
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${semantic.success} 55%)`, boxShadow: `0 0 8px ${semantic.success}` }} />
          </span>
          <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: semantic.success, letterSpacing: "0.24em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(semantic.success, 50)}`, whiteSpace: "nowrap" }}>
            Sincronizado · multi-dispositivo
          </span>
        </span>
        {primaryOrg?.name && (
          <span style={{
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 500,
            color: bioSignal.neuralViolet,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            background: withAlpha(bioSignal.neuralViolet, 12),
            border: `0.5px solid ${withAlpha(bioSignal.neuralViolet, 30)}`,
            paddingInline: 8,
            paddingBlock: 3,
            borderRadius: 99,
            textShadow: `0 0 5px ${withAlpha(bioSignal.neuralViolet, 50)}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxInlineSize: 140,
          }}>
            {primaryOrg.name}
          </span>
        )}
      </div>

      {/* Identity row — squircle avatar + email/name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBlockEnd: 12 }}>
        {/* Squircle avatar (NOT circle) — borderRadius 22% (~10/40) */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            inlineSize: 40,
            blockSize: 40,
            borderRadius: 10,
            background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${bioSignal.phosphorCyan} 0%, ${ac} 100%)`,
            border: `0.5px solid ${withAlpha(ac, 50)}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 14px ${withAlpha(ac, 30)}, 0 0 0 1px rgba(0,0,0,0.20)`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 500,
            color: bioSignal.deepField,
            letterSpacing: -0.3,
            textShadow: "0 1px 0 rgba(255,255,255,0.30)",
          }}>
            {initial}
          </span>
        </div>
        <div style={{ flex: 1, minInlineSize: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(245,245,247,0.94)",
            letterSpacing: -0.25,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {who}
          </span>
          {email && email !== who && (
            <span style={{
              fontFamily: MONO,
              fontSize: 9.5,
              fontWeight: 500,
              color: "rgba(245,245,247,0.50)",
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {email}
            </span>
          )}
          {(!email || email === who) && (
            <span style={{
              fontFamily: MONO,
              fontSize: 8.5,
              fontWeight: 500,
              color: "rgba(245,245,247,0.45)",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}>
              Operador autenticado
            </span>
          )}
        </div>
      </div>

      {/* Action row — Cuenta / Admin (if) / Cerrar sesión */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isAdmin ? "1fr 1fr 1fr" : "1fr 1fr",
          gap: 8,
        }}
      >
        <Link
          href="/account"
          aria-label="Configuración de cuenta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            paddingBlock: 9,
            paddingInline: 10,
            borderRadius: 12,
            background: `linear-gradient(180deg, ${withAlpha(ac, 10)} 0%, ${withAlpha(ac, 4)} 100%)`,
            border: `0.5px solid ${withAlpha(ac, 28)}`,
            color: ac,
            fontFamily: MONO,
            fontSize: 8.5,
            fontWeight: 500,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            textDecoration: "none",
            textShadow: `0 0 5px ${withAlpha(ac, 40)}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Custom gear SVG */}
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <circle cx="5.5" cy="5.5" r="1.6" fill="none" stroke={ac} strokeWidth="1" />
            <path d="M5.5 1 V2.5 M5.5 8.5 V10 M1 5.5 H2.5 M8.5 5.5 H10 M2.3 2.3 L3.3 3.3 M7.7 7.7 L8.7 8.7 M2.3 8.7 L3.3 7.7 M7.7 3.3 L8.7 2.3" stroke={ac} strokeWidth="0.9" strokeLinecap="round" />
          </svg>
          Cuenta
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Panel administrativo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              paddingBlock: 9,
              paddingInline: 10,
              borderRadius: 12,
              background: `linear-gradient(180deg, ${withAlpha(bioSignal.neuralViolet, 14)} 0%, ${withAlpha(bioSignal.neuralViolet, 4)} 100%)`,
              border: `0.5px solid ${withAlpha(bioSignal.neuralViolet, 35)}`,
              color: bioSignal.neuralViolet,
              fontFamily: MONO,
              fontSize: 8.5,
              fontWeight: 500,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              textDecoration: "none",
              textShadow: `0 0 5px ${withAlpha(bioSignal.neuralViolet, 50)}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            {/* Custom shield-check SVG */}
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
              <path d="M 5.5 1 L 9.5 2.5 V 5.5 Q 9.5 8 5.5 10 Q 1.5 8 1.5 5.5 V 2.5 Z" fill="none" stroke={bioSignal.neuralViolet} strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M 3.5 5.5 L 5 7 L 7.5 4" stroke={bioSignal.neuralViolet} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          aria-label={signingOut ? "Cerrando sesión" : "Cerrar sesión"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            paddingBlock: 9,
            paddingInline: 10,
            borderRadius: 12,
            background: `linear-gradient(180deg, ${withAlpha(semantic.danger, 14)} 0%, ${withAlpha(semantic.danger, 4)} 100%)`,
            border: `0.5px solid ${withAlpha(semantic.danger, 35)}`,
            color: semantic.danger,
            fontFamily: MONO,
            fontSize: 8.5,
            fontWeight: 500,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            cursor: signingOut ? "wait" : "pointer",
            opacity: signingOut ? 0.55 : 1,
            textShadow: `0 0 5px ${withAlpha(semantic.danger, 50)}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Custom logout/exit SVG (door + arrow out) */}
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path d="M 4 1.5 H 2 V 9.5 H 4" fill="none" stroke={semantic.danger} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 5.5 5.5 H 9.5 M 7.5 3.5 L 9.5 5.5 L 7.5 7.5" fill="none" stroke={semantic.danger} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span aria-live="polite">{signingOut ? "Cerrando" : "Salir"}</span>
        </button>
      </div>
    </motion.section>
  );
}
