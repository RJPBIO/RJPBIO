"use client";
import { useEffect, useState } from "react";
import { t } from "../lib/i18n";
import { brand } from "../lib/theme";

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
    try {
      localStorage.setItem(KEY, JSON.stringify({ accepted: true, ts: Date.now() }));
    } catch {}
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
        position: "fixed",
        insetInlineStart: 12,
        insetInlineEnd: 12,
        insetBlockEnd: 12,
        zIndex: 9999,
        padding: 16,
        borderRadius: 20,
        background: "rgba(11,14,20,.92)",
        color: "#ECFDF5",
        border: "1px solid #064E3B",
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        backdropFilter: "blur(10px)",
        fontFamily: "system-ui, sans-serif",
        maxInlineSize: 520,
        marginInline: "auto",
      }}
    >
      <h2 id="consent-title" style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>
        {t("consent.title")}
      </h2>
      <p
        id="consent-body"
        style={{ margin: "0 0 12px", fontSize: 13, color: "#A7F3D0", lineHeight: 1.5, letterSpacing: -0.05 }}
      >
        {t("consent.body")}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <a
          href="/privacy"
          style={{
            minBlockSize: 44,
            paddingBlock: 10,
            paddingInline: 16,
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: -0.05,
            color: "#A7F3D0",
            textDecoration: "none",
            border: "1px solid #064E3B",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {t("consent.learnMore")}
        </a>
        <button
          type="button"
          onClick={accept}
          aria-label={t("consent.accept")}
          style={{
            border: 0,
            minBlockSize: 44,
            paddingBlock: 10,
            paddingInline: 18,
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: -0.1,
            background: `linear-gradient(135deg,${brand.primary},#10B981)`,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {t("consent.accept")}
        </button>
      </div>
    </div>
  );
}
