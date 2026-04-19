"use client";
/* ═══════════════════════════════════════════════════════════════
   COMMAND PALETTE — navegación keyboard-first estilo Linear
   ═══════════════════════════════════════════════════════════════
   ⌘K / Ctrl+K. Búsqueda por subcadena, grupos semánticos,
   navegación con flechas, Enter ejecuta, Esc cierra. Recibe
   `commands` como prop desde page.jsx para mantener la lista
   de acciones cerca del estado que conocen.

   Señales de elite: atajos visibles a la derecha, kicker de
   grupo en mono, estado activo con borde phosphor, animación
   entrance tight (scale 0.97→1, y -8→0, 180ms).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { bioSignal, font, space, radius, z } from "../lib/theme";
import { useReducedMotion, KEY } from "../lib/a11y";

function score(label, query) {
  if (!query) return 0;
  const l = label.toLowerCase();
  const q = query.toLowerCase();
  const idx = l.indexOf(q);
  if (idx === -1) return -1;
  return 1000 - idx - (l.length - q.length);
}

export default function CommandPalette({ open, onClose, commands = [], placeholder = "Buscar acción…", onSelect }) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const inputId = useId();

  const filtered = useMemo(() => {
    if (!query) return commands;
    return commands
      .map((c) => ({ c, s: score(`${c.group} ${c.label} ${c.hint || ""}`, query) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);
  }, [commands, query]);

  const grouped = useMemo(() => {
    const g = new Map();
    filtered.forEach((c) => {
      if (!g.has(c.group)) g.set(c.group, []);
      g.get(c.group).push(c);
    });
    return Array.from(g.entries());
  }, [filtered]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    setQuery("");
    setSelected(0);
    lastFocusedRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      try { lastFocusedRef.current?.focus?.({ preventScroll: true }); } catch {}
    };
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selected];
        if (cmd) {
          onSelect?.(cmd);
          cmd.action?.();
          onClose?.();
        }
      } else if (e.key === KEY.TAB && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) { e.preventDefault(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selected, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-cmd-index="${selected}"]`);
    if (el?.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [selected, open]);

  if (!open) return null;

  let runningIndex = -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.15 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: z.modal + 10,
          background: "rgba(5,8,16,0.72)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingBlockStart: "12vh",
          paddingInline: space[4],
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
      >
        <motion.div
          ref={panelRef}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: reduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            inlineSize: "100%",
            maxInlineSize: 560,
            background: "rgba(13,17,23,0.94)",
            backdropFilter: "blur(24px) saturate(150%)",
            borderRadius: radius.xl,
            border: `1px solid rgba(34,211,238,0.18)`,
            boxShadow: "0 24px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxBlockSize: "70vh",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: space[3],
              paddingBlock: space[3],
              paddingInline: space[4],
              borderBlockEnd: `1px solid rgba(255,255,255,0.06)`,
            }}
          >
            <Icon name="target" size={16} color={bioSignal.phosphorCyan} />
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label="Buscar comando"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#E8ECF4",
                fontSize: font.size.base || 15,
                fontFamily: font.family,
                fontWeight: font.weight.normal,
              }}
            />
            <kbd
              style={{
                fontSize: 10,
                fontFamily: font.mono,
                letterSpacing: 1,
                color: "rgba(232,236,244,0.55)",
                padding: "3px 6px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
              }}
              aria-hidden="true"
            >
              ESC
            </kbd>
          </div>

          <div
            ref={listRef}
            role="listbox"
            aria-label="Resultados"
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBlock: space[2],
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  paddingBlock: space[8],
                  paddingInline: space[4],
                  textAlign: "center",
                  color: "rgba(232,236,244,0.5)",
                  fontSize: font.size.sm,
                }}
              >
                Sin coincidencias. Prueba otra palabra.
              </div>
            ) : (
              grouped.map(([groupName, items]) => (
                <div key={groupName}>
                  <div
                    style={{
                      paddingBlock: space[1.5] || 6,
                      paddingInline: space[4],
                      fontSize: 10,
                      fontFamily: font.mono,
                      fontWeight: font.weight.black,
                      letterSpacing: 2.5,
                      color: "rgba(232,236,244,0.4)",
                      textTransform: "uppercase",
                    }}
                  >
                    {groupName}
                  </div>
                  {items.map((cmd) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const active = idx === selected;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-cmd-index={idx}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => {
                          onSelect?.(cmd);
                          cmd.action?.();
                          onClose?.();
                        }}
                        style={{
                          inlineSize: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: space[3],
                          paddingBlock: space[2.5] || 10,
                          paddingInline: space[4],
                          background: active ? "rgba(34,211,238,0.08)" : "transparent",
                          border: "none",
                          borderInlineStart: active ? `2px solid ${bioSignal.phosphorCyan}` : "2px solid transparent",
                          color: active ? "#E8ECF4" : "rgba(232,236,244,0.82)",
                          fontSize: font.size.sm,
                          fontWeight: font.weight.medium,
                          textAlign: "start",
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                      >
                        <div
                          aria-hidden="true"
                          style={{
                            inlineSize: 28,
                            blockSize: 28,
                            borderRadius: radius.sm,
                            background: active ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            border: active ? `1px solid rgba(34,211,238,0.25)` : `1px solid rgba(255,255,255,0.05)`,
                          }}
                        >
                          <Icon
                            name={cmd.icon || "sparkle"}
                            size={14}
                            color={active ? bioSignal.phosphorCyan : "rgba(232,236,244,0.65)"}
                          />
                        </div>
                        <div style={{ flex: 1, minInlineSize: 0 }}>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cmd.label}
                          </div>
                          {cmd.hint && (
                            <div
                              style={{
                                fontSize: font.size.xs,
                                color: "rgba(232,236,244,0.45)",
                                marginBlockStart: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {cmd.hint}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd
                            style={{
                              fontSize: 10,
                              fontFamily: font.mono,
                              letterSpacing: 1,
                              color: active ? bioSignal.phosphorCyan : "rgba(232,236,244,0.45)",
                              padding: "3px 6px",
                              borderRadius: 4,
                              border: `1px solid ${active ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.08)"}`,
                              background: "rgba(255,255,255,0.02)",
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBlock: space[2],
              paddingInline: space[4],
              borderBlockStart: `1px solid rgba(255,255,255,0.06)`,
              fontSize: 10,
              fontFamily: font.mono,
              letterSpacing: 1.2,
              color: "rgba(232,236,244,0.4)",
            }}
            aria-hidden="true"
          >
            <span>{filtered.length} resultados</span>
            <span style={{ display: "flex", gap: 10 }}>
              <span>↑↓ NAVEGAR</span>
              <span>ENTER EJECUTAR</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
