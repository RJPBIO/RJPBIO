import { Manrope, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import ConsentBanner from "../components/ConsentBanner";
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
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BIO-IGNICIÓN",
    description: "Plataforma de Optimización Humana — entrena el sistema nervioso con evidencia.",
    images: ["/screenshots/ignicion-wide.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "any", type: "image/svg+xml" }],
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {JSON_LD.map((ld, i) => (
          <script
            key={i}
            type="application/ld+json"
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
          />
        ))}
        {/* Theme + locale init antes de paint. Nonce requerido por CSP. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;var m=localStorage.getItem('bio-theme');if(m==='light')d.classList.add('theme-light');else if(m==='dark')d.classList.add('theme-dark');var l=localStorage.getItem('bio-locale');if(l){d.lang=l;d.dir=['ar','he','fa','ur'].indexOf(l)>-1?'rtl':'ltr';if(!document.cookie.match(/(?:^|; )bio-locale=/))document.cookie='bio-locale='+l+'; Path=/; Max-Age=31536000; SameSite=Lax';}}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${jetbrains.variable} ${manrope.className}`}
        style={{ margin: 0, overscrollBehavior: "none" }}
      >
        <a
          href="#main"
          className="bi-skip-link"
          style={{
            position: "absolute",
            insetInlineStart: "-9999px",
            insetBlockStart: 8,
            padding: "8px 12px",
            background: "#059669",
            color: "#fff",
            borderRadius: 8,
            zIndex: 9999,
            fontWeight: 700,
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
          <GlobalChrome />
        </LocaleProvider>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}`,
          }}
        />
      </body>
    </html>
  );
}
