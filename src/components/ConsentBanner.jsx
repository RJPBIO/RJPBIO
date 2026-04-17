"use client";
import { useEffect, useState } from "react";
import { t } from "../lib/i18n";

const KEY = "bio-consent-v1";

export default function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (!v) setOpen(true);
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem(KEY, JSON.stringify({ accepted: true, ts: Date.now() })); } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      style={{
        position: "fixed", left: 12, right: 12, bottom: 12,
        zIndex: 9999, padding: 16, borderRadius: 20,
        background: "rgba(11,14,20,.92)", color: "#ECFDF5",
        border: "1px solid #064E3B",
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        backdropFilter: "blur(10px)",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 520, margin: "0 auto",
      }}
    >
      <h2 id="consent-title" style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
        {t("consent.title")}
      </h2>
      <p id="consent-body" style={{ margin: "0 0 12px", fontSize: 13, color: "#A7F3D0", lineHeight: 1.5 }}>
        {t("consent.body")}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <a
          href="/privacy"
          style={{
            padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            color: "#A7F3D0", textDecoration: "none", border: "1px solid #064E3B",
          }}
        >
          {t("consent.learnMore")}
        </a>
        <button
          type="button"
          onClick={accept}
          style={{
            border: 0, padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13,
            background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", cursor: "pointer",
          }}
        >
          {t("consent.accept")}
        </button>
      </div>
    </div>
  );
}
