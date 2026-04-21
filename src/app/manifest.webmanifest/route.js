import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, RTL } from "@/lib/i18n";

// Dynamic manifest: installers see a name/description/lang/dir that matches
// the user's active locale at install time. We read the bio-locale cookie
// first (set by LocaleSelect / pre-paint script) and fall back to
// Accept-Language. Cached 5 min browser-side (CDN too), so re-install after
// a language change picks up the new strings quickly.
export const dynamic = "force-dynamic";

const NAMES = {
  es: { name: "BIO-IGNICIÓN — Neural Performance", short: "BIO-IGN", desc: "Plataforma de Optimización Humana — Neural Performance System" },
  en: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "Human Optimization Platform — Neural Performance System" },
  pt: { name: "BIO-IGNIÇÃO — Neural Performance", short: "BIO-IGN", desc: "Plataforma de Otimização Humana — Neural Performance" },
  fr: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "Plateforme d'Optimisation Humaine" },
  de: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "Human-Optimization-Plattform" },
  it: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "Piattaforma di Ottimizzazione Umana" },
  nl: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "Human-optimalisatieplatform" },
  ja: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "ヒューマン・オプティマイゼーション・プラットフォーム" },
  ko: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "휴먼 옵티마이제이션 플랫폼" },
  zh: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "人类优化平台" },
  ar: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "منصة تحسين الإنسان" },
  he: { name: "BIO-IGNITION — Neural Performance", short: "BIO-IGN", desc: "פלטפורמת אופטימיזציה אנושית" },
};

const SHORTCUTS = {
  es: [
    { name: "Sesión rápida", short: "Rápida", desc: "Inicia una sesión de 60 segundos", url: "/app?t=entrada&source=shortcut" },
    { name: "Dashboard neural", short: "Dashboard", desc: "Ver métricas y tendencias", url: "/app?tab=dashboard&source=shortcut" },
    { name: "Reset 90s", short: "Reset", desc: "Protocolo de reset rápido", url: "/app?t=salida&source=shortcut" },
  ],
  en: [
    { name: "Quick session", short: "Quick", desc: "Start a 60-second session", url: "/app?t=entrada&source=shortcut" },
    { name: "Neural dashboard", short: "Dashboard", desc: "View metrics and trends", url: "/app?tab=dashboard&source=shortcut" },
    { name: "Reset 90s", short: "Reset", desc: "Quick reset protocol", url: "/app?t=salida&source=shortcut" },
  ],
};

function pickLocale(cookieLocale, acceptLang) {
  if (cookieLocale && LOCALES[cookieLocale]) return cookieLocale;
  if (acceptLang) {
    const first = acceptLang.split(",")[0]?.trim().toLowerCase().slice(0, 2);
    if (first && LOCALES[first]) return first;
  }
  return DEFAULT_LOCALE;
}

export async function GET() {
  const jar = await cookies();
  const h = await headers();
  const locale = pickLocale(jar.get("bio-locale")?.value, h.get("accept-language"));
  const dir = RTL.has(locale) ? "rtl" : "ltr";
  const copy = NAMES[locale] || NAMES[DEFAULT_LOCALE];
  const shortcuts = SHORTCUTS[locale] || SHORTCUTS.en;

  const manifest = {
    name: copy.name,
    short_name: copy.short,
    description: copy.desc,
    start_url: "/app?source=pwa",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0B0E14",
    theme_color: "#059669",
    categories: ["health", "lifestyle", "productivity", "medical"],
    lang: locale,
    dir,
    scope: "/",
    id: "bio-ignicion-pwa",
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    handle_links: "preferred",
    edge_side_panel: { preferred_width: 480 },
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icon-monochrome.svg", sizes: "any", type: "image/svg+xml", purpose: "monochrome" },
    ],
    screenshots: [
      { src: "/screenshots/ignicion-wide.svg", sizes: "1280x720", type: "image/svg+xml", form_factor: "wide", label: copy.name },
      { src: "/screenshots/ignicion-narrow.svg", sizes: "540x1080", type: "image/svg+xml", form_factor: "narrow", label: copy.name },
    ],
    shortcuts: shortcuts.map((s) => ({
      name: s.name,
      short_name: s.short,
      description: s.desc,
      url: s.url,
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    })),
    share_target: {
      action: "/share",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
    protocol_handlers: [{ protocol: "web+bioign", url: "/handle?deep=%s" }],
    file_handlers: [
      { action: "/handle", accept: { "application/json": [".json"], "text/plain": [".txt"] } },
    ],
    prefer_related_applications: false,
    related_applications: [],
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
      vary: "cookie, accept-language",
    },
  });
}
