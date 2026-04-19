"use client";
import { useEffect, useState } from "react";
import { BioGlyph } from "@/components/BioIgnicionMark";

export default function Error({ error, reset }) {
  const [en, setEn] = useState(false);

  useEffect(() => {
    try {
      const lang = (typeof document !== "undefined" && document.documentElement.lang) || "es";
      setEn(lang.toLowerCase().startsWith("en"));
    } catch {}

    try {
      fetch("/api/vitals", {
        method: "POST",
        body: JSON.stringify({
          name: "app-error",
          value: 1,
          rating: "poor",
          msg: String(error?.message || "").slice(0, 200),
        }),
      });
    } catch {}
    if (typeof window !== "undefined" && window.Sentry) window.Sentry.captureException(error);
    if (typeof console !== "undefined") console.error("[app-error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";
  const msg = isDev ? String(error?.message || error || "").slice(0, 600) : null;

  return (
    <main
      role="alert"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#0B0E14",
        color: "#E2E8F0",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 16, opacity: 0.9 }}>
          <BioGlyph size={44} color="#F59E0B" spark="#FCA5A5" />
        </div>
        <div style={{ fontSize: 12, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {en ? "Runtime error" : "Error en runtime"}
        </div>
        <h1 style={{ margin: "8px 0", fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: "#F8FAFC" }}>
          {en ? "Something broke on our side" : "Algo falló de nuestro lado"}
        </h1>
        <p style={{ margin: "8px 0 16px", color: "#94A3B8", fontSize: 14, lineHeight: 1.6 }}>
          {en
            ? "We logged it. Retry — or if it persists, check "
            : "Ya lo registramos. Reintenta — y si persiste, revisa "}
          <a href="/status" style={{ color: "#10B981", fontWeight: 600 }}>/status</a>
          {en ? " or write to " : " o escribe a "}
          <a href="mailto:soporte@bio-ignicion.app" style={{ color: "#10B981", fontWeight: 600 }}>soporte@bio-ignicion.app</a>.
        </p>
        {error?.digest && (
          <p style={{ margin: "0 0 18px", color: "#64748B", fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            Ref: {error.digest}
          </p>
        )}
        {msg && (
          <pre
            style={{
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              color: "#FCA5A5", background: "#141820",
              padding: 12, borderRadius: 8, fontSize: 11,
              textAlign: "left", maxHeight: 240, overflow: "auto",
              marginBlockEnd: 20,
              border: "1px solid #1E2330",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {msg}
          </pre>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 18px", background: "#10B981",
              border: "none", borderRadius: 10, color: "#0B0E14",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              minBlockSize: 44,
            }}
          >
            {en ? "Retry" : "Reintentar"}
          </button>
          <a
            href="/"
            style={{
              padding: "10px 18px", background: "transparent",
              border: "1px solid #1E2330", borderRadius: 10, color: "#E2E8F0",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              minBlockSize: 44, display: "inline-flex", alignItems: "center",
            }}
          >
            {en ? "Back home" : "Volver al inicio"}
          </a>
        </div>
      </div>
    </main>
  );
}
