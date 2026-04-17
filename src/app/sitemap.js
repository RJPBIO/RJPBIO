export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app";
  const now = new Date();
  const paths = ["/", "/privacy", "/terms", "/cookies", "/aup", "/trust", "/trust/subprocessors", "/trust/dpa"];
  return paths.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.6 }));
}
