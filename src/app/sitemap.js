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
  ];
  const priority = (p) => {
    if (p === "/") return 1;
    if (["/pricing", "/demo"].includes(p)) return 0.9;
    if (["/docs", "/roi-calculator", "/changelog", "/trust"].includes(p)) return 0.7;
    return 0.5;
  };
  return paths.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "monthly", priority: priority(p) }));
}
