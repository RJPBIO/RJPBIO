import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import ConsentBanner from "../components/ConsentBanner";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: { default: "BIO-IGNICIÓN", template: "%s · BIO-IGNICIÓN" },
  description: "Plataforma de Optimización Humana — Neural Performance System",
  manifest: "/manifest.json",
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
  twitter: { card: "summary_large_image", title: "BIO-IGNICIÓN" },
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

export default async function RootLayout({ children }) {
  const h = await headers();
  const nonce = h.get("x-nonce") || undefined;
  const locale = h.get("accept-language")?.split(",")[0]?.startsWith("en") ? "en" : "es";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className={manrope.className}
        style={{ margin: 0, padding: 0, overscrollBehavior: "none" }}
      >
        <a
          href="#main"
          style={{
            position: "absolute", left: "-9999px", top: 8, padding: "8px 12px",
            background: "#059669", color: "#fff", borderRadius: 8, zIndex: 9999,
          }}
          onFocus={(e) => { e.currentTarget.style.left = "8px"; }}
          onBlur={(e) => { e.currentTarget.style.left = "-9999px"; }}
        >
          Saltar al contenido
        </a>
        <ErrorBoundary>
          <main id="main" role="main" aria-label="Aplicación BIO-IGNICIÓN">
            {children}
          </main>
        </ErrorBoundary>
        <ConsentBanner />
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
