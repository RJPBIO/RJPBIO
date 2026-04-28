"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/* AnnouncementBar — dismissible top-of-site strip. A single active
   announcement at a time, identified by `id`; each dismissal persists
   locally so returning visitors don't see a cleared item again. Update
   id when content changes to re-surface.

   Usage:
     <AnnouncementBar
       id="kit-launch-2026-04"
       label={{ es: "Nuevo — Activation Kit para equipos", en: "New — Team Activation Kit" }}
       cta={{ es: "Ver placas", en: "See placards" }}
       href="/kit"
     />
*/

const DISMISS_PREFIX = "bio-announce-dismiss:";

export default function AnnouncementBar({ id, label, cta, href, tone = "default" }) {
  const [visible, setVisible] = useState(false);
  const [locale, setLocale] = useState("es");

  useEffect(() => {
    try {
      const lc = document.documentElement.lang || "es";
      setLocale(lc.startsWith("en") ? "en" : "es");
      const key = DISMISS_PREFIX + id;
      if (!localStorage.getItem(key)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [id]);

  if (!visible) return null;

  const l = typeof label === "string" ? label : label?.[locale] || label?.es;
  const cl = typeof cta === "string" ? cta : cta?.[locale] || cta?.es;
  const closeLabel = locale === "en" ? "Dismiss" : "Descartar";

  const close = () => {
    try { localStorage.setItem(DISMISS_PREFIX + id, String(Date.now())); } catch {}
    setVisible(false);
  };

  const isAccent = tone === "accent";

  return (
    <div
      role="status"
      aria-live="polite"
      className="bi-announce"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        paddingBlock: 8,
        paddingInline: 14,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: "#ECFEFF",
        background: isAccent
          ? "linear-gradient(90deg, rgba(8,145,178,0.85), rgba(34,211,238,0.78), rgba(8,145,178,0.85))"
          : "linear-gradient(90deg, rgba(11,14,20,0.92), rgba(15,23,42,0.92))",
        borderBlockEnd: `1px solid ${isAccent ? "rgba(34,211,238,0.55)" : "rgba(34,211,238,0.22)"}`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <span
        aria-hidden
        style={{
          inlineSize: 7,
          blockSize: 7,
          borderRadius: 999,
          background: "#22D3EE",
          boxShadow: "0 0 10px rgba(34,211,238,0.75)",
          flexShrink: 0,
          animation: "biAnnouncePulse 2.6s ease-in-out infinite",
        }}
      />
      <span style={{ textAlign: "center", lineHeight: 1.4 }}>
        {l}
        {href && cl ? (
          <>
            {" · "}
            <Link
              href={href}
              style={{
                color: "#ECFEFF",
                fontWeight: 800,
                textDecoration: "underline",
                textUnderlineOffset: 2,
                textDecorationColor: "rgba(236,254,255,0.5)",
              }}
            >
              {cl}
              <span aria-hidden style={{ marginInlineStart: 4 }}>→</span>
            </Link>
          </>
        ) : null}
      </span>
      <button
        type="button"
        onClick={close}
        aria-label={closeLabel}
        style={{
          position: "absolute",
          insetInlineEnd: 10,
          insetBlockStart: "50%",
          transform: "translateY(-50%)",
          inlineSize: 26,
          blockSize: 26,
          borderRadius: 999,
          border: 0,
          background: "transparent",
          color: "rgba(236,254,255,0.7)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 160ms ease, background 160ms ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#ECFEFF"; e.currentTarget.style.background = "rgba(236,254,255,0.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(236,254,255,0.7)"; e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
