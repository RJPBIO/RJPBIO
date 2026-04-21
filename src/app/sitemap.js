export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app";
  const now = new Date();
  const paths = [
    "/",
    "/pricing",
    "/demo",
    "/roi-calculator",
    "/docs",
    "/changelog",
    "/status",
    "/privacy",
    "/terms",
    "/cookies",
    "/aup",
    "/trust",
    "/trust/subprocessors",
    "/trust/dpa",
    "/learn",
    "/learn/hrv-basics",
    "/learn/cronotipo",
    "/learn/respiracion-resonante",
    "/evidencia",
    "/nom35",
    "/nom35/aplicador",
    "/team-preview",
    "/for",
    "/for-healthcare",
    "/for-manufacturing",
    "/for-finance",
    "/for-logistics",
    "/for-tech",
    "/for-aviation",
    "/for-energy",
    "/for-public-sector",
  ];
  const priority = (p) => {
    if (p === "/") return 1;
    if (["/pricing", "/demo", "/for"].includes(p)) return 0.9;
    if (p.startsWith("/for-")) return 0.8;
    if (["/docs", "/roi-calculator", "/changelog", "/trust", "/learn", "/evidencia", "/nom35", "/team-preview"].includes(p)) return 0.7;
    if (p.startsWith("/learn/") || p === "/nom35/aplicador") return 0.6;
    return 0.5;
  };
  return paths.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "monthly", priority: priority(p) }));
}
