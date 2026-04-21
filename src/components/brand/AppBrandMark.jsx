"use client";
import { BioGlyph } from "@/components/BioIgnicionMark";

/* AppBrandMark — fixed, discreet wordmark for the PWA.
   Lives in the top-left corner above the content. Reads the same
   letterform system as marketing (.bi-shell-wordmark in globals.css),
   so a user hopping from /pricing to /app sees the exact same
   wordmark typography. Dimmed to 0.72 so it never competes with
   the biometric foreground; fades further during a running session
   via the bi-brandmark-session class hook. */
export default function AppBrandMark() {
  return (
    <div className="bi-app-brandmark" aria-hidden>
      <span className="bi-app-brandmark-glyph"><BioGlyph size={22} /></span>
      <span className="bi-shell-wordmark" style={{ fontSize: 11, letterSpacing: "0.22em" }}>
        <span className="bi-wm-bio">BIO</span>
        <span className="bi-wm-dash">—</span>
        <span className="bi-wm-main">IGNICIÓN</span>
      </span>
    </div>
  );
}
