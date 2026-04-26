import { describe, it, expect } from "vitest";
import {
  hasFeature, isInTrial, trialDaysLeft, isB2BPlan,
  planRank, PLAN_ORDER, PLAN_LABELS, FEATURE_MIN_PLAN,
} from "./billing";

describe("billing — planRank", () => {
  it("FREE < PRO < STARTER < GROWTH < ENTERPRISE", () => {
    expect(planRank("FREE")).toBeLessThan(planRank("PRO"));
    expect(planRank("PRO")).toBeLessThan(planRank("STARTER"));
    expect(planRank("STARTER")).toBeLessThan(planRank("GROWTH"));
    expect(planRank("GROWTH")).toBeLessThan(planRank("ENTERPRISE"));
  });

  it("plan desconocido → 0 (peor que FREE)", () => {
    expect(planRank("UNKNOWN")).toBe(0);
    expect(planRank(null)).toBe(0);
    expect(planRank(undefined)).toBe(0);
  });

  it("PLAN_ORDER coincide con tiers documentados", () => {
    expect(PLAN_ORDER).toEqual(["FREE", "PRO", "STARTER", "GROWTH", "ENTERPRISE"]);
  });
});

describe("billing — hasFeature", () => {
  it("FREE solo tiene features tier FREE", () => {
    expect(hasFeature("FREE", "basic_protocols")).toBe(true);
    expect(hasFeature("FREE", "local_data_export")).toBe(true);
    expect(hasFeature("FREE", "unlimited_sessions")).toBe(false);
    expect(hasFeature("FREE", "team_analytics")).toBe(false);
    expect(hasFeature("FREE", "sso_saml")).toBe(false);
  });

  it("PRO incluye features FREE + PRO", () => {
    expect(hasFeature("PRO", "basic_protocols")).toBe(true);
    expect(hasFeature("PRO", "unlimited_sessions")).toBe(true);
    expect(hasFeature("PRO", "cloud_sync")).toBe(true);
    expect(hasFeature("PRO", "nom035_personal")).toBe(true);
    expect(hasFeature("PRO", "team_analytics")).toBe(false);
  });

  it("STARTER incluye features PRO + STARTER", () => {
    expect(hasFeature("STARTER", "unlimited_sessions")).toBe(true);
    expect(hasFeature("STARTER", "team_analytics")).toBe(true);
    expect(hasFeature("STARTER", "audit_logs")).toBe(true);
    expect(hasFeature("STARTER", "sso_oauth")).toBe(false);
    expect(hasFeature("STARTER", "sso_saml")).toBe(false);
  });

  it("GROWTH incluye features STARTER + GROWTH", () => {
    expect(hasFeature("GROWTH", "team_analytics")).toBe(true);
    expect(hasFeature("GROWTH", "sso_oauth")).toBe(true);
    expect(hasFeature("GROWTH", "api_access")).toBe(true);
    expect(hasFeature("GROWTH", "sso_saml")).toBe(false);
    expect(hasFeature("GROWTH", "scim_provisioning")).toBe(false);
  });

  it("ENTERPRISE incluye TODOS los features", () => {
    for (const feature of Object.keys(FEATURE_MIN_PLAN)) {
      expect(hasFeature("ENTERPRISE", feature)).toBe(true);
    }
  });

  it("feature desconocido retorna false", () => {
    expect(hasFeature("ENTERPRISE", "fake_feature")).toBe(false);
    expect(hasFeature("PRO", "")).toBe(false);
  });

  it("plan inválido cae a rank 0 (FREE-like)", () => {
    expect(hasFeature("INVALID", "basic_protocols")).toBe(true); // FREE rank
    expect(hasFeature("INVALID", "unlimited_sessions")).toBe(false);
  });
});

describe("billing — isInTrial", () => {
  it("trial activo si trialEndsAt > now", () => {
    const future = new Date(Date.now() + 86400000); // +1 día
    expect(isInTrial(future)).toBe(true);
    expect(isInTrial(future.toISOString())).toBe(true);
  });

  it("trial expirado si trialEndsAt < now", () => {
    const past = new Date(Date.now() - 86400000); // -1 día
    expect(isInTrial(past)).toBe(false);
  });

  it("null/undefined → no trial", () => {
    expect(isInTrial(null)).toBe(false);
    expect(isInTrial(undefined)).toBe(false);
  });
});

describe("billing — trialDaysLeft", () => {
  it("retorna días enteros redondeados al alza", () => {
    const in3half = new Date(Date.now() + 3.5 * 86400000);
    expect(trialDaysLeft(in3half)).toBe(4); // 3.5 → 4 (ceil)
  });

  it("0 cuando expirado", () => {
    const past = new Date(Date.now() - 86400000);
    expect(trialDaysLeft(past)).toBe(0);
  });

  it("0 cuando null", () => {
    expect(trialDaysLeft(null)).toBe(0);
    expect(trialDaysLeft(undefined)).toBe(0);
  });

  it("acepta string ISO", () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(trialDaysLeft(future)).toBeGreaterThanOrEqual(7);
    expect(trialDaysLeft(future)).toBeLessThanOrEqual(8);
  });
});

describe("billing — isB2BPlan", () => {
  it("FREE y PRO son B2C", () => {
    expect(isB2BPlan("FREE")).toBe(false);
    expect(isB2BPlan("PRO")).toBe(false);
  });

  it("STARTER, GROWTH, ENTERPRISE son B2B", () => {
    expect(isB2BPlan("STARTER")).toBe(true);
    expect(isB2BPlan("GROWTH")).toBe(true);
    expect(isB2BPlan("ENTERPRISE")).toBe(true);
  });
});

describe("billing — PLAN_LABELS", () => {
  it("define label para cada plan en PLAN_ORDER", () => {
    for (const plan of PLAN_ORDER) {
      expect(PLAN_LABELS[plan]).toBeTruthy();
      expect(typeof PLAN_LABELS[plan]).toBe("string");
    }
  });
});

describe("billing — FEATURE_MIN_PLAN consistency", () => {
  it("cada feature mapea a un plan en PLAN_ORDER", () => {
    for (const [feature, plan] of Object.entries(FEATURE_MIN_PLAN)) {
      expect(PLAN_ORDER).toContain(plan);
    }
  });

  it("data_residency y custom_dpa son ENTERPRISE-only", () => {
    expect(hasFeature("GROWTH", "data_residency")).toBe(false);
    expect(hasFeature("GROWTH", "custom_dpa")).toBe(false);
    expect(hasFeature("ENTERPRISE", "data_residency")).toBe(true);
    expect(hasFeature("ENTERPRISE", "custom_dpa")).toBe(true);
  });
});
