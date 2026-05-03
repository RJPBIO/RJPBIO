"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { colors, typography, spacing, layout, surfaces, radii, motion as motionTok } from "../tokens";

const MAX_CHARS = 4000;
const NEAR_LIMIT = 3800;

export default function InputBar({ disabled = false, onSend, valueExternal, onChangeExternal }) {
  const [valueInternal, setValueInternal] = useState("");
  const value = valueExternal != null ? valueExternal : valueInternal;
  const setValue = onChangeExternal || setValueInternal;
  const taRef = useRef(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineH = 22;
    const max = lineH * 4 + 20;
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;
  const counterVisible = value.length >= NEAR_LIMIT;

  const submit = () => {
    if (!canSend) return;
    const text = value.trim();
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
    onSend && onSend(text);
  };

  return (
    <div
      data-v2-coach-input
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: layout.bottomNavHeight,
        background: surfaces.navBg,
        backdropFilter: surfaces.navBlur,
        WebkitBackdropFilter: surfaces.navBlur,
        borderTop: `0.5px solid ${colors.separator}`,
        paddingInline: spacing.s16,
        paddingBlock: spacing.s8 + 4,
        zIndex: 49,
      }}
    >
      <div
        style={{
          maxWidth: layout.maxContentWidth,
          marginInline: "auto",
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          position: "relative",
        }}
      >
        {counterVisible && (
          <span
            aria-live="polite"
            style={{
              position: "absolute",
              top: -16,
              right: 4,
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.32)",
              fontWeight: typography.weight.regular,
            }}
          >
            {value.length.toLocaleString("es-MX")} / {MAX_CHARS.toLocaleString("es-MX")}
          </span>
        )}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder="Escribe tu mensaje..."
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "10px 12px",
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.96)",
            lineHeight: 1.4,
            maxHeight: 4 * 22 + 20,
            minHeight: 44,
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = `inset 0 -1px 0 ${surfaces.accentBorder}`; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Enviar mensaje"
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: radii.pill,
            border: "none",
            background: canSend ? colors.accent.phosphorCyan : "rgba(255,255,255,0.06)",
            color: canSend ? "#08080A" : "rgba(255,255,255,0.32)",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: `transform ${motionTok.duration.tap}ms ${motionTok.ease.out}, background 200ms ${motionTok.ease.out}`,
          }}
          onPointerDown={(e) => { if (canSend) e.currentTarget.style.transform = "scale(0.95)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <Send size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

export const COACH_INPUT_MAX_CHARS = MAX_CHARS;
