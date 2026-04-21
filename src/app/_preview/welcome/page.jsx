"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const BioIgnitionWelcome = dynamic(() => import("@/components/BioIgnitionWelcome"), { ssr: false });

export default function WelcomePreviewPage() {
  const [done, setDone] = useState(false);
  const [intent, setIntent] = useState(null);

  if (done) {
    return (
      <div style={{
        minBlockSize: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        background: "#050810",
        color: "#E8ECF4",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>Preview complete — intent: {intent ?? "(none)"}</div>
        <button
          onClick={() => { setDone(false); setIntent(null); }}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid rgba(34,211,238,0.4)",
            background: "transparent",
            color: "#22D3EE",
            cursor: "pointer",
          }}
        >
          Reset preview
        </button>
      </div>
    );
  }

  return (
    <BioIgnitionWelcome
      onComplete={(i) => { setIntent(i); setDone(true); }}
      onSkip={() => setDone(true)}
    />
  );
}
