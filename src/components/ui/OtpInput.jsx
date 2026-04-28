"use client";
/* ═══════════════════════════════════════════════════════════════
   OtpInput — 6 boxes with auto-advance, backspace-back, paste
   spread, and one-time-code autofill (iOS/Android SMS autofill).
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from "react";
import { cssVar, radius, space, font, bioSignal } from "./tokens";

export function OtpInput({ length = 6, value, onChange, onComplete, autoFocus = true, invalid = false, disabled = false }) {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  function set(i, d) {
    const next = digits.slice();
    next[i] = d;
    const str = next.join("").slice(0, length);
    onChange?.(str);
    if (str.length === length) onComplete?.(str);
  }

  function onInput(e, i) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { set(i, ""); return; }
    if (raw.length === 1) {
      set(i, raw);
      if (i < length - 1) refs.current[i + 1]?.focus();
    } else {
      // Handle accidental multi-char input: spread forward.
      const chars = raw.slice(0, length - i).split("");
      const next = digits.slice();
      for (let k = 0; k < chars.length; k++) next[i + k] = chars[k];
      const str = next.join("").slice(0, length);
      onChange?.(str);
      const cursor = Math.min(i + chars.length, length - 1);
      refs.current[cursor]?.focus();
      if (str.length === length) onComplete?.(str);
    }
  }

  function onKeyDown(e, i) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = digits.slice();
      next[i - 1] = "";
      onChange?.(next.join(""));
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  }

  function onPaste(e) {
    const txt = (e.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!txt) return;
    e.preventDefault();
    const str = txt.slice(0, length);
    onChange?.(str);
    const cursor = Math.min(str.length, length - 1);
    refs.current[cursor]?.focus();
    if (str.length === length) onComplete?.(str);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${length}, 1fr)`, gap: space[2] }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => onInput(e, i)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          inputMode="numeric"
          pattern="\d*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          style={{
            height: 56,
            background: cssVar.bg,
            border: `1px solid ${invalid ? cssVar.danger : cssVar.border}`,
            borderRadius: radius.md,
            color: cssVar.text,
            fontFamily: cssVar.fontMono,
            fontSize: 26,
            fontWeight: 700,
            textAlign: "center",
            outline: "none",
            transition: "border-color 0.15s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.15s cubic-bezier(0.22, 1, 0.36, 1), transform 0.1s cubic-bezier(0.22, 1, 0.36, 1)",
            boxShadow: d ? `0 0 0 2px ${bioSignal.phosphorCyan}33` : undefined,
          }}
        />
      ))}
    </div>
  );
}
