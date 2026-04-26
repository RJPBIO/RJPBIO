/* ═══════════════════════════════════════════════════════════════
   Webhook delivery search — Stripe-style operators para DeliveriesDialog.
   ═══════════════════════════════════════════════════════════════
   Sintaxis (subset Stripe Dashboard webhooks tab):
     event:session.completed     match exact event
     event:session.*             prefix match
     status:200                  exact HTTP status code
     status:2xx                  2xx range (200-299)
     status:5xx                  5xx range
     has:error                   tiene error message
     has:delivered               delivered ok (2xx + deliveredAt set)
     has:failed                  no delivered (deliveredAt null OR status >= 400)
     attempts:>3                 attempts > N
     plain text                  substring en event/error

   Pure module. Reutiliza pattern de lib/audit-search.js pero adaptado
   a delivery shape ({event, status, attempts, deliveredAt, error}).
   ═══════════════════════════════════════════════════════════════ */

export const SEARCH_OPERATORS = ["event", "status", "has", "attempts"];

export const HAS_VALUES = ["error", "delivered", "failed"];

/**
 * Tokenizer simple "key:value" + plain text. Mismo pattern que audit-search.
 */
export function parseDeliveryQuery(query) {
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
        operators[key] = value;
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

function matchesEventPattern(eventValue, pattern) {
  if (typeof eventValue !== "string" || typeof pattern !== "string") return false;
  if (pattern.endsWith(".*")) {
    return eventValue.startsWith(pattern.slice(0, -1));
  }
  return eventValue === pattern;
}

/**
 * Match status code: "200" exacto, "2xx" range, "5xx" range, etc.
 */
function matchesStatus(actualStatus, pattern) {
  if (typeof pattern !== "string") return false;
  if (typeof actualStatus !== "number") {
    // delivered=null → status null. "0" o "—" no matchea ranges.
    return false;
  }
  const lower = pattern.toLowerCase();
  if (/^\d{3}$/.test(lower)) return actualStatus === Number(lower);
  // Range: 2xx, 4xx, 5xx
  const rangeMatch = lower.match(/^(\d)xx$/);
  if (rangeMatch) {
    const base = Number(rangeMatch[1]) * 100;
    return actualStatus >= base && actualStatus < base + 100;
  }
  return false;
}

/**
 * Match attempts con operador: ">3" "<5" "=2" o número plain (= por default).
 */
function matchesAttempts(actualAttempts, pattern) {
  if (typeof actualAttempts !== "number") return false;
  if (typeof pattern !== "string") return false;
  const m = pattern.match(/^([><=]?)(\d+)$/);
  if (!m) return false;
  const op = m[1] || "=";
  const target = Number(m[2]);
  if (op === ">") return actualAttempts > target;
  if (op === "<") return actualAttempts < target;
  return actualAttempts === target;
}

/**
 * has:error → tiene error string non-empty
 * has:delivered → deliveredAt set + status 2xx
 * has:failed → no delivered O status >= 400
 */
function matchesHas(delivery, value) {
  if (!delivery) return false;
  const lower = String(value || "").toLowerCase();
  if (lower === "error") {
    return typeof delivery.error === "string" && delivery.error.length > 0;
  }
  if (lower === "delivered") {
    return !!delivery.deliveredAt &&
      typeof delivery.status === "number" && delivery.status >= 200 && delivery.status < 300;
  }
  if (lower === "failed") {
    if (!delivery.deliveredAt) return true;
    return typeof delivery.status === "number" && delivery.status >= 400;
  }
  return false;
}

function deliveryToHaystack(d) {
  if (!d) return "";
  return [
    d.event || "",
    d.error || "",
    typeof d.status === "number" ? String(d.status) : "",
  ].join(" ").toLowerCase();
}

/**
 * AND lógico de operadores + plain text.
 */
export function matchesDeliveryQuery(delivery, parsed) {
  if (!parsed || parsed.isEmpty) return true;
  if (!delivery) return false;
  const ops = parsed.operators || {};

  if (ops.event && !matchesEventPattern(delivery.event, ops.event)) return false;
  if (ops.status && !matchesStatus(delivery.status, ops.status)) return false;
  if (ops.attempts && !matchesAttempts(delivery.attempts, ops.attempts)) return false;
  if (ops.has && !matchesHas(delivery, ops.has)) return false;

  if (parsed.text) {
    const hay = deliveryToHaystack(delivery);
    if (!hay.includes(parsed.text.toLowerCase())) return false;
  }
  return true;
}

/**
 * Combinación parse + match para tests.
 */
export function deliveryMatchesString(delivery, queryString) {
  return matchesDeliveryQuery(delivery, parseDeliveryQuery(queryString));
}

/**
 * UI tone para Badge según status + deliveredAt.
 */
export function statusTone(delivery) {
  if (!delivery) return "neutral";
  if (delivery.deliveredAt && typeof delivery.status === "number" &&
      delivery.status >= 200 && delivery.status < 300) {
    return "success";
  }
  if (typeof delivery.status === "number" && delivery.status >= 500) return "danger";
  if (typeof delivery.status === "number" && delivery.status >= 400) return "warn";
  if (delivery.error) return "danger";
  if (!delivery.deliveredAt) return "warn"; // pending o failed sin status
  return "soft";
}

/**
 * Counts útiles para chips quick-filter.
 */
export function summarizeDeliveries(rows) {
  if (!Array.isArray(rows)) {
    return { total: 0, delivered: 0, failed: 0, pending: 0 };
  }
  let delivered = 0, failed = 0, pending = 0;
  for (const d of rows) {
    if (d.deliveredAt && typeof d.status === "number" && d.status >= 200 && d.status < 300) {
      delivered++;
    } else if (typeof d.status === "number" && d.status >= 400) {
      failed++;
    } else if (d.error) {
      failed++;
    } else {
      pending++;
    }
  }
  return { total: rows.length, delivered, failed, pending };
}

/**
 * Hint placeholder.
 */
export const DELIVERY_SEARCH_HINT_ES =
  "Buscar… (ej: status:5xx event:session.* has:error)";
export const DELIVERY_SEARCH_HINT_EN =
  "Search… (e.g. status:5xx event:session.* has:error)";
