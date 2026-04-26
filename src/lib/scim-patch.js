/* ═══════════════════════════════════════════════════════════════
   SCIM v2 PATCH operations — RFC 7644 §3.5.2.
   ═══════════════════════════════════════════════════════════════
   Body de PATCH:
     {
       "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
       "Operations": [
         { "op": "replace", "path": "active", "value": false },
         { "op": "replace", "path": "name.givenName", "value": "Alice" },
         { "op": "add", "path": "emails", "value": [...] },
         { "op": "remove", "path": "members[value eq \"u_x\"]" }
       ]
     }

   Este módulo:
   - Normaliza ops (op a lowercase, path trimmed, value cast)
   - Valida estructura
   - Aplica un set de ops a un objeto target retornando una versión
     mutada (immutable: clones the input)

   NO maneja path filters como `members[value eq "x"]` complejo —
   suficiente para 95% de Okta queries que actualizan campos top-level.
   ═══════════════════════════════════════════════════════════════ */

export const SCIM_PATCH_OPS = ["add", "replace", "remove"];

/**
 * Valida + normaliza el body de PATCH. Returns:
 * - { ok: true, ops: [{op, path, value}, ...] }
 * - { ok: false, error: "...", index?: number }
 */
export function parsePatchBody(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "body_not_object" };
  }
  const operations = body.Operations;
  if (!Array.isArray(operations)) {
    return { ok: false, error: "operations_not_array" };
  }
  if (operations.length === 0) {
    return { ok: false, error: "operations_empty" };
  }
  const ops = [];
  for (let i = 0; i < operations.length; i++) {
    const raw = operations[i];
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "op_not_object", index: i };
    }
    const op = typeof raw.op === "string" ? raw.op.toLowerCase() : null;
    if (!SCIM_PATCH_OPS.includes(op)) {
      return { ok: false, error: "invalid_op", index: i };
    }
    const path = typeof raw.path === "string" ? raw.path.trim() : null;
    // remove sin path es válido per spec si value contiene path implícito;
    // simplificamos a: remove debe traer path. add/replace pueden venir sin
    // path si value es un objeto con campos top-level.
    if (op === "remove" && !path) {
      return { ok: false, error: "remove_requires_path", index: i };
    }
    ops.push({ op, path, value: raw.value });
  }
  return { ok: true, ops };
}

/* Setter / getter para dot-paths simples ("a.b.c"). */
function setPath(obj, path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (cur[p] === null || cur[p] === undefined || typeof cur[p] !== "object") {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[last] = value;
}

function deletePath(obj, path) {
  const parts = path.split(".");
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return;
    cur = cur[p];
  }
  if (cur && typeof cur === "object") delete cur[last];
}

/**
 * Aplica una lista de ops normalizadas a un target. Returns clone modificado.
 * Si una op es inválida (e.g. path=undefined en add sin value-object),
 * la skipea silenciosamente (consumidor decide si chequear con dryRun).
 *
 * Para `replace`/`add` sin path: si value es un objeto plano, hace
 * Object.assign top-level; si no, no-op.
 *
 * @param {object} target objeto a mutar (será clonado)
 * @param {Array<{op,path,value}>} ops normalizadas (parsePatchBody.ok=true)
 * @returns {object} target mutado (clone)
 */
export function applyPatchOps(target, ops) {
  const out = JSON.parse(JSON.stringify(target ?? {}));
  if (!Array.isArray(ops)) return out;
  for (const o of ops) {
    if (o.op === "remove") {
      if (o.path) deletePath(out, o.path);
      continue;
    }
    if (o.op === "add" || o.op === "replace") {
      if (o.path) {
        setPath(out, o.path, o.value);
      } else if (o.value && typeof o.value === "object" && !Array.isArray(o.value)) {
        // Top-level merge sin path.
        Object.assign(out, o.value);
      }
    }
  }
  return out;
}

/**
 * Helper específico para el caso más común de Okta: deactivar usuario.
 * Returns true si alguna op equivale a "set active = false".
 */
export function isDeactivateOp(ops) {
  if (!Array.isArray(ops)) return false;
  return ops.some((o) =>
    (o.op === "replace" || o.op === "add") &&
    (o.path === "active" || (o.value && typeof o.value === "object" && o.value.active === false)) &&
    (o.path === "active" ? o.value === false : true)
  );
}

/**
 * Helper inverso: detecta re-activación.
 */
export function isActivateOp(ops) {
  if (!Array.isArray(ops)) return false;
  return ops.some((o) =>
    (o.op === "replace" || o.op === "add") &&
    (o.path === "active" || (o.value && typeof o.value === "object" && o.value.active === true)) &&
    (o.path === "active" ? o.value === true : true)
  );
}
