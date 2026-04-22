"use client";
import { openConsent } from "../lib/consent";

export default function ConsentManageLink({ label, className }) {
  return (
    <button
      type="button"
      onClick={openConsent}
      className={className}
      style={{
        background: "none",
        border: 0,
        padding: 0,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textAlign: "start",
      }}
    >
      {label}
    </button>
  );
}
