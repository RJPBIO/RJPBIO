"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, space, font } from "@/components/ui/tokens";

const COOLDOWN_MS = 30_000;
const IDLE_MS = 30_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Provider deep-links — for the most common B2B inboxes we send users
   straight into their mail app. Falls back to universal webmail otherwise. */
const PROVIDER_MAP = [
  { match: /@gmail\.com$|@googlemail\.com$/i, label: "Gmail", href: "https://mail.google.com/" },
  { match: /@(outlook|hotmail|live|msn)\./i,  label: "Outlook", href: "https://outlook.live.com/mail/" },
  { match: /@yahoo\./i,                        label: "Yahoo",  href: "https://mail.yahoo.com/" },
  { match: /@icloud\.com$|@me\.com$|@mac\.com$/i, label: "iCloud", href: "https://www.icloud.com/mail" },
];

function detectProviders(email) {
  if (!email) return [];
  const [, domain] = email.split("@");
  if (!domain) return [];
  const matched = PROVIDER_MAP.find((p) => p.match.test(email));
  if (matched) return [matched];
  return [
    { label: "Gmail",   href: "https://mail.google.com/" },
    { label: "Outlook", href: "https://outlook.office.com/mail/" },
  ];
}

export default function ResendClient({ email: initialEmail = "", labels }) {
  const [email, setEmail] = useState(initialEmail);
  const [editing, setEditing] = useState(false);
  const [draftEmail, setDraftEmail] = useState(initialEmail);
  const [editErr, setEditErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [idle, setIdle] = useState(false);
  const cooldownTimer = useRef(null);
  const idleTimer = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => () => {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  useEffect(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setIdle(false);
    if (!email) return;
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, [email]);

  useEffect(() => {
    if (editing) editInputRef.current?.focus();
  }, [editing]);

  function startCooldown() {
    const end = Date.now() + COOLDOWN_MS;
    setCooldown(Math.ceil((end - Date.now()) / 1000));
    cooldownTimer.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setCooldown(remaining);
      if (remaining <= 0) { clearInterval(cooldownTimer.current); cooldownTimer.current = null; }
    }, 250);
  }

  async function doResend(target) {
    setBusy(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/signin/email", {
        method: "POST",
        body: new URLSearchParams({ email: target, csrfToken: await getCsrf() }),
      });
      if (!r.ok) throw new Error(await r.text());
      setOk(labels.okResent);
      startCooldown();
      if (typeof window !== "undefined" && target !== initialEmail) {
        const url = new URL(window.location.href);
        url.searchParams.set("email", target);
        window.history.replaceState(null, "", url.toString());
      }
    } catch (e) {
      setErr(e?.message || labels.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!email) { setErr(labels.errNoEmail); return; }
    await doResend(email);
  }

  function openEdit() {
    setDraftEmail(email);
    setEditErr("");
    setEditing(true);
  }

  async function saveEdit(e) {
    e?.preventDefault?.();
    const next = draftEmail.trim();
    if (!EMAIL_RE.test(next)) { setEditErr(labels.editInvalid); return; }
    setEmail(next);
    setEditing(false);
    await doResend(next);
  }

  const disabled = busy || cooldown > 0;
  const ctaLabel =
    cooldown > 0 ? labels.cooldownLabel(cooldown)
    : busy       ? labels.sending
    :              labels.resend;

  const providers = useMemo(() => detectProviders(email), [email]);
  const totalCooldownSec = COOLDOWN_MS / 1000;
  const ringSize = 56;
  const ringR = 24;
  const ringCirc = 2 * Math.PI * ringR;
  const ringProgress = cooldown > 0 ? (cooldown / totalCooldownSec) * ringCirc : 0;

  return (
    <>
      <div style={{
        marginTop: space[3],
        marginInline: "auto",
        maxInlineSize: 480,
        color: cssVar.textDim,
        fontSize: font.size.md,
        lineHeight: 1.5,
      }}>
        {!editing ? (
          <div className="bi-verify-sentto">
            <span className="prefix">{labels.sentToPrefix}</span>
            {" "}
            <b className="target">{email || labels.sentToFallback}</b>
            <button
              type="button"
              className="bi-verify-edit-btn"
              onClick={openEdit}
              aria-label={labels.editLabel}
              title={labels.editLabel}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span>{labels.editLabel}</span>
            </button>
            <br />
            <span className="expires">{labels.expires}</span>
          </div>
        ) : (
          <form className="bi-verify-edit-form" onSubmit={saveEdit} noValidate>
            <label htmlFor="bi-verify-edit" className="bi-sr-only">{labels.editLabel}</label>
            <input
              ref={editInputRef}
              id="bi-verify-edit"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="bi-verify-edit-input"
              value={draftEmail}
              placeholder={labels.editPlaceholder}
              onChange={(e) => { setDraftEmail(e.target.value); if (editErr) setEditErr(""); }}
              onKeyDown={(e) => { if (e.key === "Escape") { setEditing(false); } }}
              aria-invalid={!!editErr}
            />
            <div className="bi-verify-edit-actions">
              <button type="submit" className="bi-verify-edit-save" disabled={busy}>
                {labels.editSave}
              </button>
              <button type="button" className="bi-verify-edit-cancel" onClick={() => setEditing(false)}>
                {labels.editCancel}
              </button>
            </div>
            {editErr && (
              <p role="alert" className="bi-verify-edit-err">{editErr}</p>
            )}
          </form>
        )}
      </div>

      <AnimatePresence initial={false}>
        {(ok || err) && (
          <motion.div
            key={ok ? "ok" : "err"}
            initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 20, marginBottom: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
            style={{ overflow: "hidden", marginInline: "auto", maxWidth: 420, textAlign: "left" }}
            role={ok ? "status" : "alert"}
          >
            <Alert kind={ok ? "success" : "danger"}>{ok || err}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {providers.length > 0 && !editing && (
        <nav className="bi-verify-providers" aria-label={labels.providerLabel}>
          {providers.map((p) => (
            <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer">
              {labels.openIn.replace("{p}", p.label)}
            </a>
          ))}
        </nav>
      )}

      <div style={{ marginTop: space[6] }}>
        <Button
          type="button"
          variant="secondary"
          className="bi-refined"
          onClick={onResend}
          disabled={disabled}
          style={{ minWidth: 220, fontWeight: font.weight.semibold, fontSize: font.size.md }}
        >
          {ctaLabel}
        </Button>
      </div>

      {cooldown > 0 && (
        <div className="bi-cooldown-ring" aria-hidden>
          <svg viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle className="track" cx={ringSize / 2} cy={ringSize / 2} r={ringR} stroke="currentColor" strokeWidth="3" fill="none" />
            <circle
              className="fill"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringR}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringCirc - ringProgress}
            />
          </svg>
          <span className="num">{cooldown}</span>
        </div>
      )}

      {cooldown > 0 && (
        <p style={{ marginTop: space[3], color: cssVar.textMuted, fontSize: font.size.xs, letterSpacing: "0.04em" }}>
          {labels.cooldownHint}
        </p>
      )}

      <AnimatePresence initial={false}>
        {idle && !editing && cooldown === 0 && (
          <motion.section
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bi-verify-idle"
            aria-labelledby="bi-verify-idle-h"
          >
            <div className="bi-verify-idle-kicker">{labels.idleKicker}</div>
            <h3 id="bi-verify-idle-h" className="bi-verify-idle-title">{labels.idleTitle}</h3>
            <ul className="bi-verify-idle-list">
              <li>{labels.idleSpam}</li>
              <li><button type="button" onClick={openEdit}>{labels.idleEdit}</button></li>
              <li><a href="mailto:soporte@bio-ignicion.app?subject=No%20recibo%20mi%20enlace">{labels.idleSupport}</a></li>
            </ul>
          </motion.section>
        )}
      </AnimatePresence>

      <nav className="bi-verify-helpers" aria-label={labels.helpersLabel}>
        <Link href="/signin">{labels.helperBack}</Link>
        <span className="sep" aria-hidden>·</span>
        <a href="mailto:soporte@bio-ignicion.app?subject=No%20recibo%20mi%20enlace">{labels.helperSupport}</a>
      </nav>
    </>
  );
}

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    if (!r.ok) return "";
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}
