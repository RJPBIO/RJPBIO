"use client";
/* ═══════════════════════════════════════════════════════════════
   ShortcutsHelp — overlay global con los atajos disponibles.
   Se abre con "?" (o Shift+?) y con el evento custom "bio-help:open".
   Ignora el hotkey si el foco está en un input/textarea/contentEditable.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Dialog } from "./ui/Dialog";
import { cssVar, radius, space, font } from "./ui/tokens";

const GROUPS = [
  {
    title: "Global",
    items: [
      { keys: ["Ctrl", "K"], macKeys: ["⌘", "K"], label: "Abrir paleta de comandos" },
      { keys: ["/"], label: "Abrir paleta (alternativa sin Cmd)" },
      { keys: ["?"], label: "Abrir esta ayuda" },
      { keys: ["Esc"], label: "Cerrar diálogo activo" },
    ],
  },
  {
    title: "Paleta de comandos",
    items: [
      { keys: ["↑", "↓"], label: "Navegar resultados" },
      { keys: ["↵"], label: "Ejecutar seleccionado" },
      { keys: ["Home"], label: "Ir al primero" },
      { keys: ["End"], label: "Ir al último" },
    ],
  },
  {
    title: "Pestañas principales",
    items: [
      { keys: ["←", "→"], label: "Cambiar entre Ignición · Dashboard · Perfil" },
      { keys: ["Home"], label: "Primera pestaña" },
      { keys: ["End"], label: "Última pestaña" },
    ],
  },
];

function isTypingContext() {
  const el = typeof document !== "undefined" ? document.activeElement : null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || "");
}

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const mac = isMac();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "?" && !(e.shiftKey && e.key === "/")) return;
      if (isTypingContext()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setOpen((v) => !v);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("bio-help:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("bio-help:open", onOpen);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      size="md"
      title="Atajos de teclado"
      description="Presiona ? en cualquier momento para abrir esta ayuda."
    >
      <div style={{ display: "grid", gap: space[5] }}>
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3 style={{
              margin: 0,
              marginBlockEnd: space[2],
              fontSize: font.size.sm,
              fontWeight: 600,
              color: cssVar.textDim,
              letterSpacing: -0.05,
            }}>
              {g.title}
            </h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space[1] }}>
              {g.items.map((item, i) => {
                const keys = mac && item.macKeys ? item.macKeys : item.keys;
                return (
                  <li key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: space[3],
                    padding: `${space[2]}px ${space[3]}px`,
                    borderRadius: radius.sm,
                    background: cssVar.surface2,
                    border: `1px solid ${cssVar.border}`,
                  }}>
                    <span style={{ flex: 1, fontSize: font.size.md, color: cssVar.text }}>
                      {item.label}
                    </span>
                    <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
                      {keys.map((k, j) => (
                        <kbd key={j} style={kbdStyle}>{k}</kbd>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

const kbdStyle = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: font.size.sm,
  fontWeight: font.weight.bold,
  minInlineSize: 24,
  padding: `2px 8px`,
  border: `1px solid ${cssVar.borderStrong}`,
  borderRadius: 4,
  background: cssVar.surface,
  color: cssVar.text,
  lineHeight: 1.4,
  textAlign: "center",
  display: "inline-block",
};
