"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useT } from "../../hooks/useT";
import { cssVar, space, font, radius } from "./tokens";

// Command palette universal (Cmd/Ctrl+K). Open → filter → run.
// Sin dependencias externas: keyhandler global + focus-trap + filter propios.
// Items son un array plano con grupo/icon/label/keywords. Acciones son
// `href` (router.push) o `action` (función arbitraria).
const THEME_KEY = "bio-theme";

function applyTheme(mode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("theme-light", "theme-dark", "theme-dim");
  if (mode === "light") html.classList.add("theme-light");
  else if (mode === "dim") html.classList.add("theme-dim");
  try { localStorage.setItem(THEME_KEY, mode); } catch {}
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  // App core (page.jsx) monta su propio palette con comandos de sesión.
  // Cedemos Cmd/Ctrl+K en esa ruta; el botón del header y el evento
  // "bio-cmd:open" siguen disponibles para invocarnos explícitamente.
  const yieldGlobalKey = pathname === "/";
  const { t, setLocale } = useT();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => { setOpen(false); setQuery(""); setIndex(0); }, []);

  // Global keybind (Cmd/Ctrl+K o `/` sin foco en input). Respeta inputs de texto.
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      if (!yieldGlobalKey && (e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!yieldGlobalKey && !open && e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tgt = e.target;
        const typing = tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.tagName === "SELECT" || tgt.isContentEditable);
        if (!typing) { e.preventDefault(); setOpen(true); return; }
      }
      if (open && k === "escape") { e.preventDefault(); close(); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("bio-cmd:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("bio-cmd:open", onOpen);
    };
  }, [open, close, yieldGlobalKey]);

  // Focus input al abrir + locked body scroll.
  useEffect(() => {
    if (!open) return;
    const tm = setTimeout(() => inputRef.current?.focus(), 16);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(tm); document.body.style.overflow = prev; };
  }, [open]);

  // Broadcast open/close state — header trigger refleja el anillo fósforo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(open ? "bio-cmd:open" : "bio-cmd:close"));
  }, [open]);

  const items = useMemo(() => buildItems({ t, router, setLocale, close }), [t, router, setLocale, close]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.group} ${it.keywords || ""}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [items, query]);

  useEffect(() => { setIndex(0); }, [query]);

  // Scroll activo a la vista cuando navegas con flechas.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-cmd-index="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [index, open]);

  const run = useCallback((it) => {
    if (!it) return;
    if (it.href) { router.push(it.href); close(); }
    else if (it.action) { it.action(); close(); }
  }, [router, close]);

  const onListKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); run(filtered[index]); }
    else if (e.key === "Home") { e.preventDefault(); setIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setIndex(filtered.length - 1); }
  };

  if (!open) return null;

  // Render as portal-less overlay — z-index above everything from tokens.z.modal.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("cmd.open")}
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingBlockStart: "10vh",
        paddingInline: space[4],
        animation: "fi 0.15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.lg,
          boxShadow: "0 24px 64px -24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset",
          overflow: "hidden",
          animation: "po 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: space[3],
          padding: `${space[3]}px ${space[4]}px`,
          borderBottom: `1px solid ${cssVar.border}`,
        }}>
          <span aria-hidden style={{ fontSize: 18, color: cssVar.textMuted }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onListKey}
            placeholder={t("cmd.placeholder")}
            aria-label={t("cmd.placeholder")}
            aria-controls="bi-cmd-listbox"
            aria-activedescendant={filtered[index] ? `bi-cmd-item-${filtered[index].id}` : undefined}
            style={{
              flex: 1,
              background: "transparent",
              border: 0,
              outline: "none",
              color: cssVar.text,
              fontSize: font.size.xl,
              fontFamily: "inherit",
              padding: 0,
            }}
          />
          <kbd style={kbdStyle}>Esc</kbd>
        </div>

        <ul
          ref={listRef}
          role="listbox"
          id="bi-cmd-listbox"
          style={{
            listStyle: "none",
            margin: 0,
            padding: space[2],
            maxHeight: "55vh",
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: `${space[6]}px ${space[4]}px`, textAlign: "center", color: cssVar.textMuted, fontSize: font.size.lg }}>
              {t("cmd.empty")}
            </li>
          )}
          {filtered.map((it, i) => {
            const active = i === index;
            return (
              <li
                key={it.id}
                id={`bi-cmd-item-${it.id}`}
                data-cmd-index={i}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(it)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: space[3],
                  padding: `${space[2.5]}px ${space[3]}px`,
                  borderRadius: radius.sm,
                  cursor: "pointer",
                  background: active ? cssVar.accentSoft : "transparent",
                  color: active ? cssVar.text : cssVar.textDim,
                  transition: "background .12s ease, color .12s ease",
                }}
              >
                <span aria-hidden style={{
                  inlineSize: 22,
                  blockSize: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: active ? cssVar.accent : cssVar.textMuted,
                  fontSize: 14,
                  fontFamily: cssVar.fontMono,
                }}>{it.icon}</span>
                <span style={{ fontSize: font.size.lg, fontWeight: font.weight.medium }}>{it.label}</span>
                <span style={{ marginInlineStart: "auto", fontSize: font.size.sm, color: cssVar.textMuted, letterSpacing: -0.05 }}>
                  {it.group}
                </span>
              </li>
            );
          })}
        </ul>

        <footer style={{
          display: "flex",
          alignItems: "center",
          gap: space[4],
          padding: `${space[2]}px ${space[4]}px`,
          borderTop: `1px solid ${cssVar.border}`,
          fontSize: font.size.sm,
          color: cssVar.textMuted,
          background: cssVar.surface2,
        }}>
          <span><kbd style={kbdStyle}>↑↓</kbd> {t("cmd.hintNavigate")}</span>
          <span><kbd style={kbdStyle}>↵</kbd> {t("cmd.hintSelect")}</span>
          <span style={{ marginInlineStart: "auto" }}><kbd style={kbdStyle}>⌘K</kbd> {t("cmd.hintOpen")}</span>
        </footer>
      </div>
    </div>
  );
}

const kbdStyle = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  padding: "2px 6px",
  border: `1px solid ${cssVar.border}`,
  borderRadius: 4,
  background: cssVar.surface2,
  color: cssVar.textDim,
};

function buildItems({ t, router, setLocale, close }) {
  const nav = t("cmd.navigation");
  const act = t("cmd.actions");
  const pref = t("cmd.preferences");
  const exportJson = () => {
    try {
      const raw = localStorage.getItem("bio-state") || "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `bio-ignicion-${Date.now()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {}
  };
  return [
    { id: "nav-ignicion",  group: nav, icon: "◉", label: t("nav.ignicion"),  href: "/",                keywords: "home start inicio" },
    { id: "nav-dashboard", group: nav, icon: "▦", label: t("nav.dashboard"), href: "/?tab=dashboard",  keywords: "metrics panel" },
    { id: "nav-historial", group: nav, icon: "⎚", label: t("nav.historial"), href: "/?tab=historial", keywords: "history sessions" },
    { id: "nav-perfil",    group: nav, icon: "◎", label: t("nav.perfil"),    href: "/?tab=perfil",    keywords: "profile account" },
    { id: "nav-ajustes",   group: nav, icon: "⚙", label: t("nav.ajustes"),   href: "/?tab=ajustes",   keywords: "settings preferencias" },
    { id: "nav-pricing",   group: nav, icon: "$", label: t("nav.pricing"),   href: "/pricing",         keywords: "precios plans" },
    { id: "nav-docs",      group: nav, icon: "§", label: t("nav.docs"),      href: "/docs",            keywords: "api openapi" },
    { id: "nav-status",    group: nav, icon: "●", label: t("nav.status"),    href: "/status",          keywords: "uptime" },
    { id: "nav-roi",       group: nav, icon: "∑", label: t("nav.roi"),       href: "/roi-calculator",  keywords: "calculator" },
    { id: "nav-changelog", group: nav, icon: "⧗", label: t("nav.changelog"), href: "/changelog",       keywords: "releases updates" },

    { id: "act-quick",     group: act, icon: "⚡", label: t("cmd.quickSession"), href: "/ignicion/quick", keywords: "rapida sesion 60s" },
    { id: "act-export",    group: act, icon: "↓", label: t("cmd.exportJson"),    action: exportJson,       keywords: "download backup" },
    { id: "act-shortcuts", group: act, icon: "?", label: "Atajos de teclado",    action: () => { try { window.dispatchEvent(new Event("bio-help:open")); } catch {} }, keywords: "keyboard shortcuts ayuda help hotkeys" },

    { id: "pref-theme-light", group: pref, icon: "☀", label: t("cmd.themeLight"), action: () => applyTheme("light"), keywords: "light claro" },
    { id: "pref-theme-dim",   group: pref, icon: "☾", label: t("cmd.themeDim"),   action: () => applyTheme("dim"),   keywords: "dim oscuro dark" },
    { id: "pref-theme-auto",  group: pref, icon: "◐", label: t("cmd.themeAuto"),  action: () => applyTheme("system"), keywords: "auto system" },
    { id: "pref-lang-es",     group: pref, icon: "ES", label: t("cmd.langEs"), action: () => setLocale("es"), keywords: "espanol spanish" },
    { id: "pref-lang-en",     group: pref, icon: "EN", label: t("cmd.langEn"), action: () => setLocale("en"), keywords: "english ingles" },
  ];
}
