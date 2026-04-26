/* ═══════════════════════════════════════════════════════════════
   SCIM v2 filter parser — RFC 7644 §3.4.2.2 subset.
   ═══════════════════════════════════════════════════════════════
   Soporta el subset que Okta/Azure AD/Google Workspace usan en >95%
   de las queries:

     attribute op value       — eq | ne | sw | ew | co
     attribute pr              — present (non-null)
     expr and expr             — conjunción
     expr or expr              — disyunción
     ( expr )                  — agrupación

   Atributos: dot-paths flat (e.g. "userName", "name.givenName",
   "meta.lastModified"). Brackets / arrays no soportados — los call
   sites pueden manejar paths nested via lookups custom.

   Valores: string entre comillas dobles, true | false | null,
   números enteros / float.

   Errores de parsing: throw new Error con offset.
   Pure module — testable sin server.
   ═══════════════════════════════════════════════════════════════ */

export const SCIM_OPS = ["eq", "ne", "sw", "ew", "co", "gt", "ge", "lt", "le"];
const KEYWORDS = new Set(["and", "or", "not", "pr", "true", "false", "null", ...SCIM_OPS]);

function tokenize(input) {
  if (typeof input !== "string") throw new Error("filter must be a string");
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === " " || c === "\t" || c === "\n") { i++; continue; }
    if (c === "(" || c === ")") {
      tokens.push({ type: c, pos: i });
      i++; continue;
    }
    if (c === '"') {
      // String literal con escapes \" y \\
      let s = "";
      let j = i + 1;
      while (j < input.length && input[j] !== '"') {
        if (input[j] === "\\" && j + 1 < input.length) {
          s += input[j + 1];
          j += 2;
        } else {
          s += input[j];
          j++;
        }
      }
      if (input[j] !== '"') throw new Error(`unterminated string at ${i}`);
      tokens.push({ type: "string", value: s, pos: i });
      i = j + 1;
      continue;
    }
    // Identifier / number / keyword
    const m = input.slice(i).match(/^([a-zA-Z_][a-zA-Z0-9_.:-]*|-?\d+(\.\d+)?)/);
    if (!m) throw new Error(`unexpected char "${c}" at ${i}`);
    const raw = m[0];
    const lower = raw.toLowerCase();
    if (KEYWORDS.has(lower)) {
      if (lower === "true" || lower === "false") {
        tokens.push({ type: "bool", value: lower === "true", pos: i });
      } else if (lower === "null") {
        tokens.push({ type: "null", value: null, pos: i });
      } else {
        tokens.push({ type: "kw", value: lower, pos: i });
      }
    } else if (/^-?\d/.test(raw)) {
      const n = Number(raw);
      tokens.push({ type: "number", value: n, pos: i });
    } else {
      tokens.push({ type: "ident", value: raw, pos: i });
    }
    i += raw.length;
  }
  return tokens;
}

class Parser {
  constructor(tokens) { this.tokens = tokens; this.i = 0; }
  peek(offset = 0) { return this.tokens[this.i + offset]; }
  consume() { return this.tokens[this.i++]; }
  expect(type) {
    const t = this.consume();
    if (!t || t.type !== type) throw new Error(`expected ${type}, got ${t ? t.type : "EOF"}`);
    return t;
  }
  /* expr := orExpr */
  parseExpr() { return this.parseOr(); }
  /* orExpr := andExpr ('or' andExpr)* */
  parseOr() {
    let left = this.parseAnd();
    while (this.peek()?.type === "kw" && this.peek().value === "or") {
      this.consume();
      const right = this.parseAnd();
      left = { type: "or", left, right };
    }
    return left;
  }
  /* andExpr := unary ('and' unary)* */
  parseAnd() {
    let left = this.parseUnary();
    while (this.peek()?.type === "kw" && this.peek().value === "and") {
      this.consume();
      const right = this.parseUnary();
      left = { type: "and", left, right };
    }
    return left;
  }
  /* unary := 'not' unary | atom */
  parseUnary() {
    if (this.peek()?.type === "kw" && this.peek().value === "not") {
      this.consume();
      return { type: "not", expr: this.parseUnary() };
    }
    return this.parseAtom();
  }
  /* atom := '(' expr ')' | comparison */
  parseAtom() {
    if (this.peek()?.type === "(") {
      this.consume();
      const e = this.parseExpr();
      this.expect(")");
      return e;
    }
    return this.parseComparison();
  }
  /* comparison := ident kw [value] */
  parseComparison() {
    const attr = this.expect("ident");
    const op = this.expect("kw");
    if (op.value === "pr") {
      return { type: "pr", attr: attr.value };
    }
    if (!SCIM_OPS.includes(op.value)) {
      throw new Error(`unexpected operator "${op.value}" at ${op.pos}`);
    }
    const val = this.consume();
    if (!val) throw new Error("missing value after operator");
    if (!["string", "bool", "number", "null"].includes(val.type)) {
      throw new Error(`expected literal value, got ${val.type}`);
    }
    return { type: "cmp", attr: attr.value, op: op.value, value: val.value };
  }
}

/**
 * Parsea un filter SCIM. Devuelve AST.
 * @throws Error si el filter es inválido.
 */
export function parseScimFilter(input) {
  if (input === "" || input === undefined || input === null) return null;
  const tokens = tokenize(input);
  if (tokens.length === 0) return null;
  const p = new Parser(tokens);
  const ast = p.parseExpr();
  if (p.peek()) {
    throw new Error(`unexpected trailing token at ${p.peek().pos}`);
  }
  return ast;
}

/* Lookup dot-path en un objeto, e.g. "name.givenName" → obj.name.givenName */
function getPath(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = String(path).split(".");
  let v = obj;
  for (const p of parts) {
    if (v === null || v === undefined) return undefined;
    v = v[p];
  }
  return v;
}

function compare(actual, op, target) {
  switch (op) {
    case "eq": return actual === target || String(actual) === String(target);
    case "ne": return !(actual === target || String(actual) === String(target));
    case "sw": return typeof actual === "string" && typeof target === "string" && actual.toLowerCase().startsWith(target.toLowerCase());
    case "ew": return typeof actual === "string" && typeof target === "string" && actual.toLowerCase().endsWith(target.toLowerCase());
    case "co": return typeof actual === "string" && typeof target === "string" && actual.toLowerCase().includes(target.toLowerCase());
    case "gt": return actual > target;
    case "ge": return actual >= target;
    case "lt": return actual < target;
    case "le": return actual <= target;
    default: return false;
  }
}

/**
 * Evalúa un AST contra un record. Retorna boolean.
 * @param {object} ast      Output de parseScimFilter
 * @param {object} record   El object a chequear
 */
export function evalScimFilter(ast, record) {
  if (!ast) return true; // null filter → match-all
  switch (ast.type) {
    case "and": return evalScimFilter(ast.left, record) && evalScimFilter(ast.right, record);
    case "or": return evalScimFilter(ast.left, record) || evalScimFilter(ast.right, record);
    case "not": return !evalScimFilter(ast.expr, record);
    case "pr": {
      const v = getPath(record, ast.attr);
      return v !== undefined && v !== null && v !== "";
    }
    case "cmp": {
      const v = getPath(record, ast.attr);
      return compare(v, ast.op, ast.value);
    }
    default: return false;
  }
}

/**
 * Combinación parse + eval. Útil para tests / evaluación rápida.
 */
export function matchesScimFilter(filter, record) {
  if (!filter) return true;
  try {
    const ast = parseScimFilter(filter);
    return evalScimFilter(ast, record);
  } catch {
    return false; // filter inválido → no match (defensive)
  }
}
