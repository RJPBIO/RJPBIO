import { CHANGELOG_ENTRIES } from "../changelog/entries";

/* RSS 2.0 del changelog público. Cache 1 h; el contenido cambia con deploys. */
export const revalidate = 3600;

function esc(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app";
  const items = CHANGELOG_ENTRIES.map((e) => `
    <item>
      <title>${esc(`v${e.version} — ${e.title}`)}</title>
      <link>${base}/changelog#v${e.version}</link>
      <guid isPermaLink="false">bio-ignicion:changelog:${e.version}</guid>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <category>${esc(e.tag)}</category>
      <description><![CDATA[<ul>${e.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>]]></description>
    </item>`).join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BIO-IGNICIÓN — Changelog</title>
    <link>${base}/changelog</link>
    <description>Historial público de cambios.</description>
    <language>es-mx</language>
    <atom:link href="${base}/changelog.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
