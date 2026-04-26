import { describe, it, expect } from "vitest";
import {
  escapeHtml, safeUrl, sanitizeVars,
  getBrandedFrom, renderEmailHTML, renderCtaButton, renderEmailText,
  _internals,
} from "./email-template";

describe("escapeHtml", () => {
  it("escapa &, <, >, \", '", () => {
    expect(escapeHtml('<script>"x"&\'y\'</script>'))
      .toBe("&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;");
  });
  it("string normal pasa intacto", () => {
    expect(escapeHtml("Acme Corp 2026")).toBe("Acme Corp 2026");
  });
  it("null/undefined → ''", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
  it("number/boolean → string", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(true)).toBe("true");
  });
});

describe("safeUrl", () => {
  it("https:// pasa con escape", () => {
    expect(safeUrl("https://acme.com/accept?token=abc&user=bob"))
      .toBe("https://acme.com/accept?token=abc&amp;user=bob");
  });
  it("path relativo / pasa", () => {
    expect(safeUrl("/admin/dashboard")).toBe("/admin/dashboard");
  });
  it("http:// rechazado (anti mixed-content)", () => {
    expect(safeUrl("http://acme.com")).toBe("");
  });
  it("javascript: rechazado (anti XSS)", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("JAVASCRIPT:alert(1)")).toBe("");
  });
  it("data: rechazado", () => {
    expect(safeUrl("data:text/html,<script>")).toBe("");
  });
  it("non-string → ''", () => {
    expect(safeUrl(null)).toBe("");
    expect(safeUrl(42)).toBe("");
  });
});

describe("sanitizeVars", () => {
  it("escapa todos los values", () => {
    const r = sanitizeVars({ name: "<b>Bob</b>", org: "Acme & Co" });
    expect(r.name).toBe("&lt;b&gt;Bob&lt;/b&gt;");
    expect(r.org).toBe("Acme &amp; Co");
  });
  it("preserva keys", () => {
    const r = sanitizeVars({ a: "1", b: "2" });
    expect(Object.keys(r).sort()).toEqual(["a", "b"]);
  });
  it("input null/non-object → {}", () => {
    expect(sanitizeVars(null)).toEqual({});
    expect(sanitizeVars("nope")).toEqual({});
  });
});

describe("getBrandedFrom", () => {
  it("sin verified custom domain → fallback default", () => {
    expect(getBrandedFrom()).toBe(_internals.DEFAULT_FROM);
    expect(getBrandedFrom({
      branding: { customDomain: "app.acme.com" },
      customDomainVerified: false,
    })).toBe(_internals.DEFAULT_FROM);
  });

  it("con customDomain verified + orgName → 'Org <no-reply@domain>'", () => {
    expect(getBrandedFrom({
      branding: { customDomain: "app.acme.com" },
      orgName: "Acme",
      customDomainVerified: true,
    })).toBe("Acme <no-reply@app.acme.com>");
  });

  it("sanitiza orgName (no chars dangerous en name part)", () => {
    const r = getBrandedFrom({
      branding: { customDomain: "app.acme.com" },
      orgName: "Acme<>&\"'<script>",
      customDomainVerified: true,
    });
    // Format: "<sanitized-name> <no-reply@domain>" — los <> finales son del envelope.
    const namePart = r.split(" <no-reply@")[0];
    expect(namePart).not.toContain("<");
    expect(namePart).not.toContain(">");
    expect(namePart).not.toContain("&");
    expect(namePart).not.toContain('"');
    expect(r).toContain("@app.acme.com");
  });

  it("orgName muy largo → truncado", () => {
    const r = getBrandedFrom({
      branding: { customDomain: "x.com" },
      orgName: "A".repeat(200),
      customDomainVerified: true,
    });
    const namePart = r.split(" <")[0];
    expect(namePart.length).toBeLessThanOrEqual(60);
  });

  it("customDomain ausente aun con verified=true → fallback", () => {
    expect(getBrandedFrom({
      branding: {},
      orgName: "Acme",
      customDomainVerified: true,
    })).toBe(_internals.DEFAULT_FROM);
  });
});

describe("renderEmailHTML", () => {
  it("incluye lang attribute del locale", () => {
    expect(renderEmailHTML({ content: "<p>hi</p>", locale: "en" }))
      .toContain('lang="en"');
    expect(renderEmailHTML({ content: "<p>hi</p>", locale: "es" }))
      .toContain('lang="es"');
  });

  it("inyecta content sin escape (caller debe escapar antes)", () => {
    expect(renderEmailHTML({ content: "<h2>Hello</h2><p>World</p>" }))
      .toContain("<h2>Hello</h2><p>World</p>");
  });

  it("incluye logo si branding.logoUrl https://", () => {
    const r = renderEmailHTML({
      content: "<p>x</p>",
      branding: { logoUrl: "https://acme.com/logo.svg" },
    });
    expect(r).toContain('src="https://acme.com/logo.svg"');
    expect(r).toContain("alt=\"logo\"");
  });

  it("rechaza logoUrl http:// (mixed-content)", () => {
    const r = renderEmailHTML({
      content: "<p>x</p>",
      branding: { logoUrl: "http://acme.com/logo.png" },
    });
    expect(r).not.toContain("http://acme.com");
  });

  it("aplica colors al accent bar", () => {
    const r = renderEmailHTML({
      content: "<p>x</p>",
      branding: { primaryColor: "#ff0000", accentColor: "#00ff00" },
    });
    expect(r).toContain("#ff0000");
    expect(r).toContain("#00ff00");
  });

  it("footer en es y en", () => {
    expect(renderEmailHTML({ content: "<p>x</p>", locale: "en" }))
      .toContain("Privacy");
    expect(renderEmailHTML({ content: "<p>x</p>", locale: "es" }))
      .toContain("Privacidad");
  });

  it("privacyUrl custom respetado si https://", () => {
    const r = renderEmailHTML({
      content: "<p>x</p>",
      privacyUrl: "https://acme.com/privacy",
    });
    expect(r).toContain("https://acme.com/privacy");
  });

  it("privacyUrl javascript: rechazado, fallback a default", () => {
    const r = renderEmailHTML({
      content: "<p>x</p>",
      privacyUrl: "javascript:alert(1)",
    });
    expect(r).not.toContain("javascript:");
    expect(r).toContain("bio-ignicion.app/privacy");
  });

  it("footerText custom escapado", () => {
    const r = renderEmailHTML({
      content: "<p>x</p>",
      footerText: "<script>alert(1)</script>",
    });
    expect(r).not.toContain("<script>alert");
    expect(r).toContain("&lt;script&gt;");
  });
});

describe("renderCtaButton", () => {
  it("genera button con URL + label escaped", () => {
    const r = renderCtaButton({
      url: "https://acme.com/accept",
      label: "Accept invite",
      branding: { primaryColor: "#ff0000", accentColor: "#00ff00" },
    });
    expect(r).toContain('href="https://acme.com/accept"');
    expect(r).toContain("Accept invite");
    expect(r).toContain("#ff0000");
  });

  it("escape label de XSS", () => {
    const r = renderCtaButton({
      url: "https://acme.com/x",
      label: '<script>alert(1)</script>',
    });
    expect(r).not.toContain("<script>alert");
    expect(r).toContain("&lt;script&gt;");
  });

  it("URL inválida → ''", () => {
    expect(renderCtaButton({ url: "javascript:alert(1)", label: "click" })).toBe("");
    expect(renderCtaButton({ url: "http://x.com", label: "click" })).toBe("");
  });

  it("missing args → ''", () => {
    expect(renderCtaButton({ url: "https://x.com" })).toBe("");
    expect(renderCtaButton({ label: "x" })).toBe("");
    expect(renderCtaButton()).toBe("");
  });
});

describe("renderEmailText", () => {
  it("incluye contentText + footer", () => {
    const r = renderEmailText({
      contentText: "Hello world",
      locale: "en",
    });
    expect(r).toContain("Hello world");
    expect(r).toContain("BIO-IGNICIÓN");
    expect(r).toContain("https://bio-ignicion.app/privacy");
  });

  it("locale es", () => {
    expect(renderEmailText({ contentText: "x", locale: "es" }))
      .toContain("optimización");
  });

  it("contentText vacío → solo footer", () => {
    const r = renderEmailText({});
    expect(r).toContain("BIO-IGNICIÓN");
  });
});
