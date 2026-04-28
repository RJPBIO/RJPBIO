"use client";
import { useCallback, useEffect, useId, useState } from "react";
import { t } from "../lib/i18n";
import { readConsent, writeConsent } from "../lib/consent";

/* Cyan trademark palette — matches the marketing-site glyph/wordmark. */
const CY = "#22D3EE";
const CY_D = "#0891B2";
const INK = "#F8FAFC";
const INK_DIM = "rgba(203,213,225,0.82)";
const INK_MUTE = "rgba(148,163,184,0.72)";
const SURFACE = "rgba(11,14,20,0.94)";
const BORDER = "rgba(34,211,238,0.22)";

export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const current = readConsent();
    if (!current.decided) setOpen(true);
    else { setAnalytics(current.analytics); setMarketing(current.marketing); }
    const onOpen = () => {
      const fresh = readConsent();
      setAnalytics(fresh.analytics);
      setMarketing(fresh.marketing);
      setExpanded(true);
      setOpen(true);
    };
    window.addEventListener("bio-consent:open", onOpen);
    return () => window.removeEventListener("bio-consent:open", onOpen);
  }, []);

  const finish = useCallback((a, m) => {
    writeConsent({ analytics: a, marketing: m });
    setOpen(false);
    setExpanded(false);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="bi-consent"
      style={{
        position: "fixed",
        insetInlineStart: 12,
        insetInlineEnd: 12,
        insetBlockEnd: 12,
        // Banner is aria-modal="false" — a notification, not a dialog — so it
        // must NOT overlay app modals (ProtocolSelector, intent picker, etc.
        // sit at z.overlay/modal = 200-230). Previously 9998 intercepted
        // clicks on sheet items near the bottom, blocking protocol selection.
        zIndex: 70,
        padding: 18,
        borderRadius: 20,
        background: SURFACE,
        color: INK,
        border: `1px solid ${BORDER}`,
        boxShadow: `0 24px 64px -24px rgba(15,23,42,0.55), 0 0 0 1px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        fontFamily: "inherit",
        maxInlineSize: expanded ? 620 : 560,
        marginInline: "auto",
        transition: "max-inline-size 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            inlineSize: 32,
            blockSize: 32,
            borderRadius: 10,
            background: `radial-gradient(circle at 50% 50%, ${CY}33, transparent 70%)`,
            border: `1px dashed ${CY}66`,
            display: "grid",
            placeItems: "center",
            marginBlockStart: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <circle cx="7" cy="7" r="1.6" fill={CY} />
            <path d="M7 1.5 L7 4 M7 10 L7 12.5 M1.5 7 L4 7 M10 7 L12.5 7" stroke={CY} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          </svg>
        </span>
        <div style={{ flex: 1, minInlineSize: 0 }}>
          <h2 id={titleId} style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: INK }}>
            {t("consent.title")}
          </h2>
          <p id={bodyId} style={{ margin: 0, fontSize: 13, color: INK_DIM, lineHeight: 1.55 }}>
            {t("consent.body")}{" "}
            <a href="/cookies" style={{ color: CY, fontWeight: 600, textDecoration: "underline", textDecorationColor: `${CY}66`, textUnderlineOffset: 2 }}>
              {t("consent.learnMore")}
            </a>
          </p>
        </div>
      </div>

      {expanded ? (
        <div style={{ marginBlockStart: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <CategoryRow
            label={t("consent.necessary")}
            desc={t("consent.necessaryDesc")}
            checked
            disabled
            tag={t("consent.alwaysOn")}
          />
          <CategoryRow
            label={t("consent.analytics")}
            desc={t("consent.analyticsDesc")}
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            label={t("consent.marketing")}
            desc={t("consent.marketingDesc")}
            checked={marketing}
            onChange={setMarketing}
          />
        </div>
      ) : null}

      <div style={{ marginBlockStart: 16, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {!expanded ? (
          <>
            <GhostButton onClick={() => finish(false, false)} label={t("consent.rejectAll")} />
            <GhostButton onClick={() => setExpanded(true)} label={t("consent.customize")} />
            <PrimaryButton onClick={() => finish(true, true)} label={t("consent.acceptAll")} />
          </>
        ) : (
          <>
            <GhostButton onClick={() => finish(false, false)} label={t("consent.rejectAll")} />
            <GhostButton onClick={() => finish(true, true)} label={t("consent.acceptAll")} />
            <PrimaryButton onClick={() => finish(analytics, marketing)} label={t("consent.savePrefs")} />
          </>
        )}
      </div>
    </div>
  );
}

function CategoryRow({ label, desc, checked, onChange, disabled, tag }) {
  const id = useId();
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      <label htmlFor={id} style={{ flex: 1, cursor: disabled ? "default" : "pointer", minInlineSize: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBlockEnd: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: "-0.005em" }}>{label}</span>
          {tag ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: CY,
                padding: "2px 6px",
                borderRadius: 999,
                background: `${CY}14`,
                border: `1px solid ${CY}33`,
              }}
            >
              {tag}
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: 11.5, color: INK_MUTE, lineHeight: 1.5 }}>{desc}</div>
      </label>
      <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Toggle({ id, checked, onChange, disabled }) {
  return (
    <span style={{ flexShrink: 0, position: "relative", marginBlockStart: 2 }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: disabled ? "default" : "pointer" }}
      />
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          inlineSize: 36,
          blockSize: 20,
          borderRadius: 999,
          background: checked ? `linear-gradient(135deg, ${CY}, ${CY_D})` : "rgba(148,163,184,0.25)",
          border: `1px solid ${checked ? `${CY}66` : "rgba(148,163,184,0.35)"}`,
          padding: 2,
          transition: "background 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: checked ? `0 0 0 3px ${CY}14` : "none",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <span
          style={{
            inlineSize: 14,
            blockSize: 14,
            borderRadius: 999,
            background: "#FFFFFF",
            transform: checked ? "translateX(16px)" : "translateX(0)",
            transition: "transform 180ms cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        />
      </span>
    </span>
  );
}

function PrimaryButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        minBlockSize: 44,
        paddingBlock: 12,
        paddingInline: 18,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: "0.01em",
        background: `linear-gradient(135deg, ${CY}, ${CY_D})`,
        color: "#042933",
        cursor: "pointer",
        boxShadow: `0 8px 24px -10px ${CY}99`,
        transition: "transform 160ms cubic-bezier(0.2, 0.5, 0.2, 1), filter 160ms cubic-bezier(0.2, 0.5, 0.2, 1)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(1.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "none"; }}
    >
      {label}
    </button>
  );
}

function GhostButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minBlockSize: 44,
        paddingBlock: 12,
        paddingInline: 16,
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.01em",
        color: INK,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid rgba(255,255,255,0.12)`,
        cursor: "pointer",
        transition: "border-color 160ms cubic-bezier(0.2, 0.5, 0.2, 1), background 160ms cubic-bezier(0.2, 0.5, 0.2, 1)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${CY}55`; e.currentTarget.style.background = `${CY}0F`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
    >
      {label}
    </button>
  );
}
