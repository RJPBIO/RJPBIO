"use client";
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { useT } from "../hooks/useT";

/* BookDemoDrawer — global slide-over that any CTA can trigger via the
   `bio-demo:open` window event. Compact lead form (name, email, company,
   size, note) posts to /api/v1/leads with source="drawer"; on success
   we collapse into an acknowledgement and invite the visitor to keep
   browsing instead of navigating away.

   Mount once in the layout — not per-page. Focus trap, ESC to close,
   body-scroll lock, reduced-motion friendly. */

const CY = "#22D3EE";
const CY_D = "#0891B2";

function csrfHeaders() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

export default function BookDemoDrawer() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", note: "" });
  const { locale } = useT();
  const en = locale === "en";
  const titleId = useId();
  const firstFieldRef = useRef(null);
  const closeRef = useRef(null);

  useBodyLock(open);

  useEffect(() => {
    const onOpen = () => { setOpen(true); setStatus("idle"); setErr(""); };
    const onKey = (e) => { if (open && e.key === "Escape") setOpen(false); };
    window.addEventListener("bio-demo:open", onOpen);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("bio-demo:open", onOpen); window.removeEventListener("keydown", onKey); };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 80);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  async function submit(e) {
    e.preventDefault();
    setStatus("sending"); setErr("");
    if (form.name.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setStatus("error");
      setErr(en ? "Check name and email." : "Revisa nombre e email.");
      return;
    }
    try {
      const r = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "content-type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ ...form, source: "drawer" }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setErr(e.message || (en ? "Network error." : "Error de red."));
    }
  }

  if (!open) return null;

  const COPY = en
    ? {
        kicker: "Book a demo",
        title: "30 minutes. No pitch.",
        body: "Tell us who you are and we'll reach out in < 24 business hours to pick a slot.",
        name: "Name", email: "Work email", company: "Company", size: "Team size", note: "What do you want to solve?",
        submit: "Request demo", sending: "Sending…",
        close: "Close",
        sentTitle: "Received",
        sentBody: "A human replies within 24 business hours. If urgent, email sales@bio-ignicion.app.",
        continueBrowsing: "Keep browsing",
        privacy: "No third-party sharing. We only contact you about this demo.",
      }
    : {
        kicker: "Agendar demo",
        title: "30 minutos. Sin pitch.",
        body: "Dinos quién eres y respondemos en < 24 h hábiles para fijar hueco.",
        name: "Nombre", email: "Email corporativo", company: "Empresa", size: "Tamaño del equipo", note: "¿Qué quieres resolver?",
        submit: "Solicitar demo", sending: "Enviando…",
        close: "Cerrar",
        sentTitle: "Recibido",
        sentBody: "Un humano responde en < 24 h hábiles. Si es urgente, escribe a sales@bio-ignicion.app.",
        continueBrowsing: "Seguir navegando",
        privacy: "Sin cesión a terceros. Solo te contactamos por esta demo.",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}
    >
      {/* scrim */}
      <button
        type="button"
        aria-label={COPY.close}
        onClick={close}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3,7,18,0.66)",
          border: 0,
          cursor: "pointer",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />
      {/* panel */}
      <aside
        style={{
          position: "relative",
          marginInlineStart: "auto",
          inlineSize: "min(440px, 100vw)",
          blockSize: "100dvh",
          background: "linear-gradient(180deg, #0B1220 0%, #081018 100%)",
          color: "#F8FAFC",
          borderInlineStart: "1px solid rgba(34,211,238,0.22)",
          boxShadow: "-24px 0 64px rgba(0,0,0,0.5)",
          padding: 28,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          animation: "biDrawerIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: CY, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800 }}>
              {COPY.kicker}
            </div>
            <h2 id={titleId} style={{ margin: "6px 0 4px", fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {COPY.title}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(203,213,225,0.78)", lineHeight: 1.55 }}>{COPY.body}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={COPY.close}
            style={{
              flexShrink: 0,
              inlineSize: 32,
              blockSize: 32,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.02)",
              color: "#F8FAFC",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden>
              <path d="M2.5 2.5 L10.5 10.5 M10.5 2.5 L2.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {status === "sent" ? (
          <SentState copy={COPY} onClose={close} />
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
            <DrawerField label={COPY.name} required>
              <input
                ref={firstFieldRef}
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={drawerInputStyle}
              />
            </DrawerField>
            <DrawerField label={COPY.email} required>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={drawerInputStyle}
              />
            </DrawerField>
            <DrawerField label={COPY.company}>
              <input
                autoComplete="organization"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                style={drawerInputStyle}
              />
            </DrawerField>
            <DrawerField label={COPY.size}>
              <select
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                style={drawerInputStyle}
              >
                <option value="">—</option>
                <option value="1-25">1-25</option>
                <option value="26-100">26-100</option>
                <option value="101-500">101-500</option>
                <option value="501-2000">501-2000</option>
                <option value="2000+">2000+</option>
              </select>
            </DrawerField>
            <DrawerField label={COPY.note}>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value.slice(0, 1200) }))}
                style={{ ...drawerInputStyle, resize: "vertical", minHeight: 70 }}
              />
            </DrawerField>

            {status === "error" ? (
              <div role="alert" style={{ fontSize: 12.5, color: "#FCA5A5", padding: "8px 10px", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, background: "rgba(127,29,29,0.18)" }}>
                {err}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                marginBlockStart: 4,
                padding: "12px 18px",
                borderRadius: 12,
                border: 0,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.01em",
                background: `linear-gradient(135deg, ${CY}, ${CY_D})`,
                color: "#042933",
                cursor: status === "sending" ? "wait" : "pointer",
                boxShadow: `0 10px 28px -12px ${CY}AA`,
                transition: "transform 160ms ease, filter 160ms ease",
                opacity: status === "sending" ? 0.75 : 1,
              }}
            >
              {status === "sending" ? COPY.sending : COPY.submit}
            </button>

            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(148,163,184,0.72)", lineHeight: 1.55 }}>
              {COPY.privacy}
            </p>
          </form>
        )}
      </aside>
    </div>
  );
}

function SentState({ copy, onClose }) {
  return (
    <div role="status" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 4px" }}>
      <div style={{
        inlineSize: 52, blockSize: 52, borderRadius: 999,
        background: `radial-gradient(circle at 50% 50%, ${CY}55, transparent 70%)`,
        border: `1.5px dashed ${CY}88`,
        display: "grid", placeItems: "center",
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
          <path d="M4 10.5 L8.2 14.5 L16 6" stroke={CY} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", marginBlockEnd: 4 }}>{copy.sentTitle}</div>
        <p style={{ margin: 0, fontSize: 13.5, color: "rgba(203,213,225,0.82)", lineHeight: 1.6 }}>{copy.sentBody}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginBlockStart: 6,
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid rgba(34,211,238,0.35)",
          background: "transparent",
          color: "#F8FAFC",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {copy.continueBrowsing}
      </button>
    </div>
  );
}

function DrawerField({ label, required, children }) {
  const id = useId();
  return (
    <label htmlFor={id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(148,163,184,0.9)" }}>
        {label}{required ? <span aria-hidden style={{ color: CY, marginInlineStart: 3 }}>*</span> : null}
      </span>
      {children && typeof children === "object" ? cloneElement(children, { id }) : children}
    </label>
  );
}

const drawerInputStyle = {
  width: "100%",
  minHeight: 40,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(15,23,42,0.55)",
  color: "#F8FAFC",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 160ms ease, box-shadow 160ms ease",
};
