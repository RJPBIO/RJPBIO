import { describe, it, expect } from "vitest";
import {
  isValidStatus, isValidSeverity, isValidComponent,
  canTransitionStatus, validateIncident, validateIncidentUpdate,
  severityRank, statusTone, statusLabel, severityLabel,
  incidentToRssItem, activeIncidents, recentResolvedIncidents,
  summarizeOverall, _xml,
  INCIDENT_STATUSES, INCIDENT_SEVERITIES, TITLE_MAX, BODY_MAX,
} from "./incidents";

describe("validators", () => {
  it("isValidStatus", () => {
    for (const s of INCIDENT_STATUSES) expect(isValidStatus(s)).toBe(true);
    expect(isValidStatus("WUT")).toBe(false);
    expect(isValidStatus(null)).toBe(false);
  });
  it("isValidSeverity", () => {
    for (const s of INCIDENT_SEVERITIES) expect(isValidSeverity(s)).toBe(true);
    expect(isValidSeverity("normal")).toBe(false);
  });
  it("isValidComponent", () => {
    expect(isValidComponent("api")).toBe(true);
    expect(isValidComponent("auth")).toBe(true);
    expect(isValidComponent("unknown")).toBe(false);
  });
});

describe("canTransitionStatus", () => {
  it("investigating → identified|monitoring|resolved", () => {
    expect(canTransitionStatus("investigating", "identified")).toBe(true);
    expect(canTransitionStatus("investigating", "monitoring")).toBe(true);
    expect(canTransitionStatus("investigating", "resolved")).toBe(true);
  });
  it("identified → monitoring|resolved (no back a investigating)", () => {
    expect(canTransitionStatus("identified", "monitoring")).toBe(true);
    expect(canTransitionStatus("identified", "resolved")).toBe(true);
    expect(canTransitionStatus("identified", "investigating")).toBe(false);
  });
  it("monitoring → resolved", () => {
    expect(canTransitionStatus("monitoring", "resolved")).toBe(true);
    expect(canTransitionStatus("monitoring", "investigating")).toBe(false);
  });
  it("resolved es terminal", () => {
    for (const s of INCIDENT_STATUSES) expect(canTransitionStatus("resolved", s)).toBe(false);
  });
  it("status inválido → false", () => {
    expect(canTransitionStatus("WUT", "resolved")).toBe(false);
  });
});

describe("validateIncident", () => {
  it("válido completo", () => {
    const r = validateIncident({
      title: "API latency spike",
      body: "Investigando timeouts en /api/v1",
      severity: "major",
      components: ["api", "webhooks"],
    });
    expect(r.ok).toBe(true);
    expect(r.value.title).toBe("API latency spike");
    expect(r.value.components).toEqual(["api", "webhooks"]);
  });

  it("título required", () => {
    const r = validateIncident({ severity: "minor" });
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.field === "title").error).toBe("required");
  });

  it("severity required + valid", () => {
    expect(validateIncident({ title: "x" }).ok).toBe(false);
    expect(validateIncident({ title: "x", severity: "WUT" }).ok).toBe(false);
  });

  it("title too_long", () => {
    const r = validateIncident({
      title: "x".repeat(TITLE_MAX + 1),
      severity: "minor",
    });
    expect(r.errors.find((e) => e.field === "title").error).toBe("too_long");
  });

  it("body too_long", () => {
    const r = validateIncident({
      title: "x", severity: "minor",
      body: "y".repeat(BODY_MAX + 1),
    });
    expect(r.errors.find((e) => e.field === "body").error).toBe("too_long");
  });

  it("components dedup + filter inválidos", () => {
    const r = validateIncident({
      title: "x", severity: "minor",
      components: ["api", "api", "junk", "auth"],
    });
    expect(r.value.components).toEqual(["api", "auth"]);
  });

  it("non-array components → error", () => {
    const r = validateIncident({
      title: "x", severity: "minor",
      components: "api",
    });
    expect(r.ok).toBe(false);
  });

  it("non-object → error", () => {
    expect(validateIncident(null).ok).toBe(false);
    expect(validateIncident("nope").ok).toBe(false);
  });
});

describe("validateIncidentUpdate", () => {
  it("válido", () => {
    const r = validateIncidentUpdate({
      status: "monitoring", body: "Patch deployed, monitoring metrics",
    });
    expect(r.ok).toBe(true);
  });
  it("status invalid", () => {
    expect(validateIncidentUpdate({ status: "WUT", body: "x" }).ok).toBe(false);
  });
  it("body required", () => {
    expect(validateIncidentUpdate({ status: "monitoring" }).ok).toBe(false);
    expect(validateIncidentUpdate({ status: "monitoring", body: "  " }).ok).toBe(false);
  });
  it("body too_long", () => {
    const r = validateIncidentUpdate({ status: "monitoring", body: "x".repeat(BODY_MAX + 1) });
    expect(r.errors.find((e) => e.field === "body").error).toBe("too_long");
  });
});

describe("severityRank", () => {
  it("critical > major > minor > unknown", () => {
    expect(severityRank("critical")).toBeGreaterThan(severityRank("major"));
    expect(severityRank("major")).toBeGreaterThan(severityRank("minor"));
    expect(severityRank("minor")).toBeGreaterThan(severityRank("unknown"));
  });
});

describe("statusTone", () => {
  it("resolved → success", () => {
    expect(statusTone("resolved", "critical")).toBe("success");
  });
  it("non-resolved + critical → danger", () => {
    expect(statusTone("investigating", "critical")).toBe("danger");
  });
  it("non-resolved + major → warn", () => {
    expect(statusTone("monitoring", "major")).toBe("warn");
  });
  it("non-resolved + minor → soft", () => {
    expect(statusTone("identified", "minor")).toBe("soft");
  });
});

describe("statusLabel / severityLabel", () => {
  it("es/en", () => {
    expect(statusLabel("monitoring")).toBe("Monitoreando");
    expect(statusLabel("monitoring", "en")).toBe("Monitoring");
    expect(severityLabel("critical")).toBe("Crítico");
    expect(severityLabel("critical", "en")).toBe("Critical");
  });
  it("desconocido → mismo string", () => {
    expect(statusLabel("WUT")).toBe("WUT");
    expect(severityLabel("WUT")).toBe("WUT");
  });
});

describe("incidentToRssItem", () => {
  const inc = {
    id: "inc_1", title: "API down", severity: "critical",
    status: "investigating", body: "Working on it",
    startedAt: "2026-04-25T12:00:00Z",
  };

  it("genera <item> XML válido", () => {
    const xml = incidentToRssItem(inc, "https://bio-ignicion.app");
    expect(xml).toContain("<item>");
    expect(xml).toContain("</item>");
    expect(xml).toContain("[CRITICAL]");
    expect(xml).toContain("inc_1");
    expect(xml).toContain("https://bio-ignicion.app/status#i-inc_1");
    expect(xml).toContain("Investigando");
  });

  it("escape XML chars en title/body", () => {
    const x = incidentToRssItem({
      ...inc, title: "Latency <bad> & 'too high'",
      body: "Issue with <script>",
    }, "https://x.com");
    expect(x).toContain("&lt;bad&gt;");
    expect(x).toContain("&amp;");
    expect(x).toContain("&apos;too high&apos;");
    expect(x).toContain("&lt;script&gt;");
  });

  it("guid estable basado en id", () => {
    expect(incidentToRssItem(inc, "https://x.com")).toContain("bio-ignicion:incident:inc_1");
  });

  it("incident sin id → ''", () => {
    expect(incidentToRssItem({}, "https://x.com")).toBe("");
    expect(incidentToRssItem(null, "https://x.com")).toBe("");
  });
});

describe("activeIncidents", () => {
  it("filtra resolved + sort severity desc", () => {
    const rows = [
      { id: "1", status: "investigating", severity: "minor", startedAt: "2026-04-25" },
      { id: "2", status: "resolved", severity: "critical", startedAt: "2026-04-24" },
      { id: "3", status: "monitoring", severity: "critical", startedAt: "2026-04-23" },
      { id: "4", status: "identified", severity: "major", startedAt: "2026-04-25" },
    ];
    const r = activeIncidents(rows);
    expect(r.map((x) => x.id)).toEqual(["3", "4", "1"]);
  });
  it("sort secundario por startedAt desc dentro del mismo severity", () => {
    const rows = [
      { id: "old", status: "investigating", severity: "critical", startedAt: "2026-04-23" },
      { id: "new", status: "investigating", severity: "critical", startedAt: "2026-04-25" },
    ];
    const r = activeIncidents(rows);
    expect(r[0].id).toBe("new");
  });
  it("non-array → []", () => {
    expect(activeIncidents(null)).toEqual([]);
  });
});

describe("recentResolvedIncidents", () => {
  const now = new Date("2026-04-25T12:00:00Z");
  it("default 14 días", () => {
    const rows = [
      { id: "old", status: "resolved", resolvedAt: "2026-03-01T00:00:00Z" },
      { id: "recent", status: "resolved", resolvedAt: "2026-04-20T00:00:00Z" },
      { id: "active", status: "investigating", resolvedAt: null },
    ];
    const r = recentResolvedIncidents(rows, { now });
    expect(r.map((x) => x.id)).toEqual(["recent"]);
  });

  it("custom days", () => {
    const rows = [{ id: "x", status: "resolved", resolvedAt: "2026-04-23T00:00:00Z" }];
    expect(recentResolvedIncidents(rows, { days: 1, now })).toHaveLength(0);
    expect(recentResolvedIncidents(rows, { days: 5, now })).toHaveLength(1);
  });

  it("non-array → []", () => {
    expect(recentResolvedIncidents(null)).toEqual([]);
  });
});

describe("summarizeOverall", () => {
  it("sin incidents → operativo + tone success", () => {
    const r = summarizeOverall([]);
    expect(r.tone).toBe("success");
    expect(r.label).toBe("Operativo");
  });

  it("con activo critical → tone danger", () => {
    const r = summarizeOverall([
      { id: "1", status: "investigating", severity: "critical", startedAt: "2026-04-25" },
    ]);
    expect(r.tone).toBe("danger");
    expect(r.message).toContain("Crítico");
  });

  it("con activo minor → tone soft", () => {
    const r = summarizeOverall([
      { id: "1", status: "monitoring", severity: "minor", startedAt: "2026-04-25" },
    ]);
    expect(r.tone).toBe("soft");
  });

  it("ignora resolved", () => {
    const r = summarizeOverall([
      { id: "1", status: "resolved", severity: "critical", resolvedAt: "2026-04-25" },
    ]);
    expect(r.tone).toBe("success");
  });
});

describe("_xml.escapeXml", () => {
  it("escapa &<>\"'", () => {
    expect(_xml.escapeXml(`<a href="x"&'b'>`)).toBe(`&lt;a href=&quot;x&quot;&amp;&apos;b&apos;&gt;`);
  });
  it("null/undefined → ''", () => {
    expect(_xml.escapeXml(null)).toBe("");
    expect(_xml.escapeXml(undefined)).toBe("");
  });
});
