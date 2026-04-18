/* RSS 2.0 de incidentes operativos. Por ahora vacío (sin incidentes).
   Cuando haya sistema de incidentes persistido, este route los lee de DB. */
export const revalidate = 300;

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app";
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BIO-IGNICIÓN — Status</title>
    <link>${base}/status</link>
    <description>Incidentes operativos y mantenimientos programados.</description>
    <language>es-mx</language>
    <atom:link href="${base}/status/feed.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>Sistemas operativos</title>
      <link>${base}/status</link>
      <guid isPermaLink="false">bio-ignicion:status:initial</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Todos los componentes operativos. Sin incidentes registrados.</description>
    </item>
  </channel>
</rss>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
