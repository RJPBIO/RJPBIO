/* ═══════════════════════════════════════════════════════════════
   Tenancy — resolución org + contexto por request
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { headers, cookies } from "next/headers";
import { db } from "./db";

const ORG_COOKIE = "bio-org";

export async function getCurrentOrgId() {
  const cs = await cookies();
  const fromCookie = cs.get(ORG_COOKIE)?.value;
  if (fromCookie) return fromCookie;
  const h = await headers();
  const host = h.get("host") || "";
  const sub = host.split(".")[0];
  if (sub && sub !== "www" && sub !== "app") {
    const orm = await db();
    const org = await orm.org.findFirst({ where: { slug: sub } });
    if (org) return org.id;
  }
  return null;
}

export async function requireOrg() {
  const id = await getCurrentOrgId();
  if (!id) {
    const err = new Error("Org not resolved");
    err.status = 400;
    throw err;
  }
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id } });
  if (!org) {
    const err = new Error("Org not found");
    err.status = 404;
    throw err;
  }
  return org;
}

export function resolveRegion(country) {
  if (!country) return "US";
  const EU = ["DE","FR","ES","IT","PT","NL","BE","IE","SE","NO","DK","FI","PL","AT","CH"];
  const APAC = ["JP","KR","SG","HK","AU","NZ","IN","CN","TW","TH","ID","PH","VN","MY"];
  const LATAM = ["MX","BR","AR","CL","CO","PE","UY","CR","GT"];
  if (EU.includes(country)) return "EU";
  if (APAC.includes(country)) return "APAC";
  if (LATAM.includes(country)) return "LATAM";
  return "US";
}
