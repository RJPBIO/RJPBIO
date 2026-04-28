import { Manrope, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import ConsentBanner from "../components/ConsentBanner";
import BookDemoDrawer from "../components/BookDemoDrawer";
import GlobalChrome from "../components/GlobalChrome";
import { LocaleProvider } from "../lib/locale-context";
import { getServerLocale } from "../lib/locale-server";
import { tLocale } from "../lib/i18n";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

// Signature mono — used for biométric numerals (countdown, V-Cores, HRV, %)
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-mono",
});

// Editorial serif — pull-quotes and editorial moments. Italic is the signature.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-editorial",
});

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://bio-ignicion.app"),
  title: { default: "BIO-IGNICIÓN", template: "%s · BIO-IGNICIÓN" },
  description: "Plataforma de Optimización Humana — Neural Performance System",
  manifest: "/manifest.webmanifest",
  applicationName: "BIO-IGNICIÓN",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BIO-IGNICIÓN" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "BIO-IGNICIÓN",
    title: "BIO-IGNICIÓN — Neural Performance",
    description: "Plataforma de Optimización Humana",
  },
  twitter: {
    card: "summary_large_image",
    title: "BIO-IGNICIÓN",
    description: "Plataforma de Optimización Humana — entrena el sistema nervioso con evidencia.",
  },
  robots: { index: true, follow: true },
  icons: {
    // Sprint 53 — PNG fallback agregados tras test real con iPhone iOS 16.6.1
    // (404s en apple-touch-icon.png + variantes 120/152/180). PNG primero,
    // SVG como progressive enhancement.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon-v3.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-152x152-v3.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-120x120-v3.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    other: [{ rel: "mask-icon", url: "/icon-monochrome.svg", color: "#059669" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECFDF5" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E14" },
  ],
  colorScheme: "light dark",
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://bio-ignicion.app";

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BIO-IGNICIÓN",
    url: BASE_URL,
    logo: `${BASE_URL}/icon.svg`,
    sameAs: [],
    contactPoint: [
      { "@type": "ContactPoint", email: "hello@bio-ignicion.app", contactType: "sales", availableLanguage: ["es", "en"] },
      { "@type": "ContactPoint", email: "trust@bio-ignicion.app", contactType: "customer support", availableLanguage: ["es", "en"] },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BIO-IGNICIÓN",
    url: BASE_URL,
    inLanguage: ["es-MX", "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/learn?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function RootLayout({ children }) {
  const h = await headers();
  const nonce = h.get("x-nonce") || undefined;
  const locale = await getServerLocale();
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  const skipLabel = tLocale(locale, "shell.skipContent");

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* iOS PWA install behavior — la app se siente nativa al instalarse */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BIO-IGNICIÓN" />
        <meta name="format-detection" content="telephone=no" />
        {/* Android / Chromium */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0B0E14" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        {/* Windows tiles */}
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="color-scheme" content="light dark" />
        {/* Apple touch icons — v3 light-bg canon (igual al home). */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-v3.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152-v3.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120-v3.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-v3.png" />
        {/* Sprint 85 — Apple PWA splash screens. iOS busca match exacto por
            device-width/height + dpr + orientation. Sin esto: blank screen
            durante load. Cubre 95%+ del market actual (top 15 devices).
            Generados por scripts/gen-splash-screens.mjs (BioGlyph centrado
            sobre #0B0E14 = manifest background_color). */}
        {[
          { w:1290, h:2796, dw:430, dh:932, dpr:3, label:"iPhone 14/15 Pro Max" },
          { w:1179, h:2556, dw:393, dh:852, dpr:3, label:"iPhone 14/15 Pro" },
          { w:1284, h:2778, dw:428, dh:926, dpr:3, label:"iPhone 14 Plus, 12/13 Pro Max" },
          { w:1170, h:2532, dw:390, dh:844, dpr:3, label:"iPhone 14/15/12/13 + Pro" },
          { w:1125, h:2436, dw:375, dh:812, dpr:3, label:"iPhone X/XS/11 Pro/12 mini/13 mini" },
          { w:1242, h:2688, dw:414, dh:896, dpr:3, label:"iPhone 11 Pro Max, XS Max" },
          { w:828,  h:1792, dw:414, dh:896, dpr:2, label:"iPhone 11, XR" },
          { w:1242, h:2208, dw:414, dh:736, dpr:3, label:"iPhone 6/7/8 Plus" },
          { w:750,  h:1334, dw:375, dh:667, dpr:2, label:"iPhone 6/7/8/SE 2/3" },
          { w:2048, h:2732, dw:1024, dh:1366, dpr:2, label:"iPad Pro 12.9\"" },
          { w:1668, h:2388, dw:834, dh:1194, dpr:2, label:"iPad Pro 11\"/Air 11\"" },
          { w:1640, h:2360, dw:820, dh:1180, dpr:2, label:"iPad Air 10.9\"" },
          { w:1620, h:2160, dw:810, dh:1080, dpr:2, label:"iPad 10.2\"" },
          { w:1488, h:2266, dw:744, dh:1133, dpr:2, label:"iPad mini 8.3\"/7.9\"" },
          { w:1536, h:2048, dw:768, dh:1024, dpr:2, label:"iPad 9.7\"" },
        ].map((s) => (
          <link
            key={`splash-${s.w}x${s.h}`}
            rel="apple-touch-startup-image"
            media={`screen and (device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)`}
            href={`/splash/splash-${s.w}x${s.h}.png`}
          />
        ))}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {JSON_LD.map((ld, i) => (
          <script
            key={i}
            type="application/ld+json"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
          />
        ))}
        {/* Theme + locale init antes de paint. Nonce requerido por CSP. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;var p=location.pathname||'/';var isApp=p==='/app'||p.indexOf('/app/')===0||p==='/account'||p.indexOf('/account/')===0;if(isApp){var m=localStorage.getItem('bio-theme');if(m==='dim'||m==='dark')d.classList.add('theme-dim');else if(m==='light')d.classList.add('theme-light');else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)d.classList.add('theme-dim');}else{d.classList.add('theme-light');}var l=localStorage.getItem('bio-locale');if(l){d.lang=l;d.dir=['ar','he','fa','ur'].indexOf(l)>-1?'rtl':'ltr';if(!document.cookie.match(/(?:^|; )bio-locale=/))document.cookie='bio-locale='+l+'; Path=/; Max-Age=31536000; SameSite=Lax';}}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${jetbrains.variable} ${instrumentSerif.variable} ${manrope.className}`}
        style={{ margin: 0, overscrollBehavior: "none" }}
      >
        <a
          href="#main"
          className="bi-skip-link"
          style={{
            position: "absolute",
            insetInlineStart: "-9999px",
            insetBlockStart: 8,
            padding: "10px 16px",
            background: "linear-gradient(135deg,#22D3EE,#0891B2)",
            color: "#042933",
            borderRadius: 10,
            zIndex: 10000,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.01em",
            textDecoration: "none",
            boxShadow: "0 12px 32px -12px rgba(34,211,238,0.6)",
          }}
        >
          {skipLabel}
        </a>
        <div aria-live="polite" className="bi-sr-only" id="bi-live-polite" />
        <div aria-live="assertive" className="bi-sr-only" id="bi-live-assertive" />
        <LocaleProvider initialLocale={locale}>
          <ErrorBoundary>
            <main id="main" role="main" aria-label="Aplicación BIO-IGNICIÓN" tabIndex={-1}>
              {children}
            </main>
          </ErrorBoundary>
          <ConsentBanner />
          <BookDemoDrawer />
          <GlobalChrome />
        </LocaleProvider>
        {process.env.NODE_ENV === "production" ? (
          <script
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}`,
            }}
          />
        ) : (
          <script
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});}`,
            }}
          />
        )}
      </body>
    </html>
  );
}
