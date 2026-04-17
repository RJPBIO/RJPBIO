/* ═══════════════════════════════════════════════════════════════
   RBAC — policies declarativas por acción.
   Roles: OWNER > ADMIN > MANAGER > MEMBER > VIEWER
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

const ROLE_ORDER = { OWNER: 5, ADMIN: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1 };

const POLICIES = {
  "org.update": "ADMIN",
  "org.delete": "OWNER",
  "org.branding.update": "ADMIN",
  "member.invite": "ADMIN",
  "member.remove": "ADMIN",
  "member.role.update": "OWNER",
  "team.create": "ADMIN",
  "team.manage": "MANAGER",
  "team.analytics.view": "MANAGER",
  "billing.view": "ADMIN",
  "billing.update": "OWNER",
  "audit.read": "ADMIN",
  "apikey.manage": "ADMIN",
  "webhook.manage": "ADMIN",
  "integration.manage": "ADMIN",
  "session.record": "MEMBER",
  "coach.query": "MEMBER",
};

export function can(role, action) {
  const required = POLICIES[action];
  if (!required) return false;
  return (ROLE_ORDER[role] || 0) >= ROLE_ORDER[required];
}

export function assert(role, action) {
  if (!can(role, action)) {
    const err = new Error(`Forbidden: ${action} requires ${POLICIES[action]}`);
    err.status = 403;
    throw err;
  }
}

export async function requireMembership(session, orgId, action) {
  const m = session?.memberships?.find((x) => x.orgId === orgId);
  if (!m) { const e = new Error("Not a member"); e.status = 403; throw e; }
  assert(m.role, action);
  return m;
}

export function listActionsForRole(role) {
  return Object.entries(POLICIES).filter(([, req]) => ROLE_ORDER[role] >= ROLE_ORDER[req]).map(([a]) => a);
}
