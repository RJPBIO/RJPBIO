import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata = {
  title: "BIO-IGNICIÓN — Rendimiento Cognitivo en 120s",
  description:
    "Protocolos neurocientíficos de 120 segundos. Resetea tu sistema nervioso, eleva tu enfoque y activa rendimiento cognitivo medible. Enterprise-ready.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BIO-IGNICIÓN",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "BIO-IGNICIÓN",
    description:
      "120 segundos que transforman tu rendimiento cognitivo. Neurociencia aplicada.",
    type: "website",
    locale: "es_MX",
    siteName: "BIO-IGNICIÓN",
  },
  twitter: {
    card: "summary_large_image",
    title: "BIO-IGNICIÓN",
    description:
      "120 segundos que transforman tu rendimiento cognitivo. Neurociencia aplicada.",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F4F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E14" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={manrope.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="BIO-IGNICIÓN" />
      </head>
      <body>{children}</body>
    </html>
  );
}