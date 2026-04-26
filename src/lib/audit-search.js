/* ═══════════════════════════════════════════════════════════════
   Audit log search v2 — Stripe-style operators + payload-aware.
   ═══════════════════════════════════════════════════════════════
   Sintaxis (subset Stripe Dashboard):
     actor:alice@x.com         → match exact en actorEmail/actorId
     action:auth.signin        → match exact action
     action:auth.*             → prefix match (Sprint 6 audit-categories pattern)
     target:user_xyz           → match en target field
     ip:10.0.0.1               → match exact IP
     payload:domain.com        → search en payload JSON serializado
     orgId:org_x               → match exact orgId
     plain text                → search en TODOS los campos (incl. payload)

   Combinaciones: "actor:alice action:billing.* hello world"
     → AND de operadores + plain "hello world" como substring fallback

   Pure module — testable. Highlight devuelve un array de tokens
   ({text, match}) que UI renderiza con <mark> sin innerHTML (XSS-safe).
   ═══════════════════════════════════════════════════════════════ */

export const SEARCH_OPERATORS = ["actor", "action", "target", "ip", "orgid", "payload"];

/**
 * Tokenizer simple — split por whitespace, agrupa "key:value".
 *
 * @param {string} query
 * @returns { operators: { actor, action, target, ip, orgId, payload }[],
 *            text: string  // plain text residual }
 */
export function parseSearchQuery(query) {
  if (typeof query !== "string" || !query.trim()) {
    return { operators: {}, text: "", isEmpty: true };
  }
  const tokens = query.trim().split(/\s+/);
  const operators = {};
  const plain = [];
  for (const token of tokens) {
    const colonIdx = token.indexOf(":");
    if (colonIdx > 0 && colonIdx < token.length - 1) {
      const key = token.slice(0, colonIdx).toLowerCase();
      const value = token.slice(colonIdx + 1);
      if (SEARCH_OPERATORS.includes(key)) {
        // Mapeo a campos canónicos con casing correcto.
        const canonicalKey = key === "orgid" ? "orgId" : key;
        operators[canonicalKey] = value;
        continue;
      }
    }
    plain.push(token);
  }
  return {
    operators,
    text: plain.join(" "),
    isEmpty: !plain.length && Object.keys(operators).length === 0,
  };
}

/**
 * ¿El operador "action:foo.*" matchea el value? Wildcard simple
 * solo soporta sufijo `.*` (prefix match alineado con audit-categories).
 */
function matchesActionPattern(actionValue, pattern) {
  if (typeof actionValue !== "string" || typeof pattern !== "string") return false;
  if (pattern.endsWith(".*")) {
    return actionValue.startsWith(pattern.slice(0, -1)); // mantiene el "."
  }
  return actionValue === pattern;
}

/**
 * Escape regex chars en operator values — defensa contra ReDoS o
 * mal-comportamiento si el value tiene `[` `(` etc.
 */
function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Concatena fields searchable de una row a un blob para plain text search.
 * Incluye payload JSON serializado.
 */
function rowToHaystack(row) {
  if (!row) return "";
  const payloadStr = row.payload ? JSON.stringify(row.payload) : "";
  return [
    row.action || "",
    row.actorEmail || "",
    row.actorId || "",
    row.target || "",
    row.ip || "",
    row.orgId || "",
    payloadStr,
  ].join(" ").toLowerCase();
}

/**
 * ¿Una row matchea el query parseado?
 * AND lógico: operadores + texto plain todos deben matchear.
 */
export function matchesQuery(row, parsed) {
  if (!parsed || parsed.isEmpty) return true;
  if (!row) return false;
  const ops = parsed.operators || {};

  // Operator: action (con soporte de wildcard prefijo)
  if (ops.action && !matchesActionPattern(row.action, ops.action)) return false;

  // Operator: actor (match contra actorEmail O actorId — mejor UX)
  if (ops.actor) {
    const needle = ops.actor.toLowerCase();
    const a = (row.actorEmail || "").toLowerCase();
    const aId = (row.actorId || "").toLowerCase();
    if (!a.includes(needle) && !aId.includes(needle)) return false;
  }

  if (ops.target) {
    const t = (row.target || "").toLowerCase();
    if (!t.includes(ops.target.toLowerCase())) return false;
  }

  if (ops.ip && row.ip !== ops.ip) return false;

  if (ops.orgId && row.orgId !== ops.orgId) return false;

  if (ops.payload) {
    const p = row.payload ? JSON.stringify(row.payload).toLowerCase() : "";
    if (!p.includes(ops.payload.toLowerCase())) return false;
  }

  // Plain text: substring en TODO el haystack (incluido payload).
  if (parsed.text) {
    const hay = rowToHaystack(row);
    const needle = parsed.text.toLowerCase();
    if (!hay.includes(needle)) return false;
  }

  return true;
}

/**
 * Combinación parse + match para tests / quick checks.
 */
export function rowMatchesQueryString(row, queryString) {
  return matchesQuery(row, parseSearchQuery(queryString));
}

/**
 * Highlight tokens — split text por terms y devuelve array de
 * { text: string, match: boolean }. UI renderiza con <mark> sin
 * usar innerHTML (XSS-safe).
 *
 * @param {string} text
 * @param {string[]} terms — strings a marcar (case-insensitive)
 * @returns Array<{text, match}>
 */
export function highlightMatches(text, terms) {
  if (typeof text !== "string" || !text) return [{ text: text || "", match: false }];
  if (!Array.isArray(terms) || terms.length === 0) return [{ text, match: false }];
  const validTerms = terms
    .filter((t) => typeof t === "string" && t.length > 0)
    .map((t) => escapeRe(t));
  if (!validTerms.length) return [{ text, match: false }];
  const re = new RegExp(`(${validTerms.join("|")})`, "gi");
  const parts = text.split(re);
  return parts
    .filter((p) => p.length > 0)
    .map((p) => ({ text: p, match: re.test(p) ? testMatch(p, validTerms) : false }));
}

// Helper porque RegExp.test mutates lastIndex en modo /g.
function testMatch(part, terms) {
  const lower = part.toLowerCase();
  return terms.some((t) => lower === t.toLowerCase().replace(/\\./g, "."));
}

/**
 * Extrae todos los terms (operadores + plain) que deberían highlightearse
 * en results. Los operadores `action:` y `target:` highlight su value.
 */
export function extractHighlightTerms(parsed) {
  if (!parsed) return [];
  const terms = [];
  if (parsed.text) terms.push(parsed.text);
  for (const [k, v] of Object.entries(parsed.operators || {})) {
    if (!v) continue;
    if (k === "action" && v.endsWith(".*")) {
      terms.push(v.slice(0, -2));
    } else {
      terms.push(v);
    }
  }
  return terms;
}

/**
 * Hint de placeholder para el UI input — muestra ejemplo legible.
 */
export const SEARCH_HINT_ES =
  "Buscar… (ej: actor:alice action:billing.* hello)";
export const SEARCH_HINT_EN =
  "Search… (e.g. actor:alice action:billing.* hello)";
