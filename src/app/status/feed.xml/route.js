/* RSS 2.0 de incidentes operativos.
   Sprint 19: ahora pulls de DB (Incident + IncidentUpdate). Si no hay
   activos ni recently-resolved, emitimos un item "Sistemas operativos"
   para que el feed nunca esté completamente vacío (RSS readers no
   ahorcan suscripciones con feeds 0-items). */

import { listStatusIncidents } from "@/server/incidents";
import { incidentToRssItem } from "@/lib/incidents";

export const revalidate = 300;

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app";
  const incidents = await listStatusIncidents({ recentDays: 30 });
  const items = incidents.length > 0
    ? incidents.map((i) => incidentToRssItem(i, base)).join("\n    ")
    : `<item>
      <title>Sistemas operativos</title>
      <link>${base}/status</link>
      <guid isPermaLink="false">bio-ignicion:status:initial</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Todos los componentes operativos. Sin incidentes registrados.</description>
    </item>`;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BIO-IGNICIÓN — Status</title>
    <link>${base}/status</link>
    <description>Incidentes operativos y mantenimientos programados.</description>
    <language>es-mx</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/status/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
