import { describe, it, expect } from "vitest";
import { resolveCoachModel, COACH_MODEL_IDS } from "./coach-model.js";

describe("resolveCoachModel", () => {
  it("env override wins over plan", () => {
    expect(resolveCoachModel("FREE", { envOverride: "claude-test-x" })).toBe("claude-test-x");
    expect(resolveCoachModel("ENTERPRISE", { envOverride: "claude-test-x" })).toBe("claude-test-x");
  });

  it("plan FREE → Haiku", () => {
    expect(resolveCoachModel("FREE")).toBe(COACH_MODEL_IDS.HAIKU);
  });

  it("plan PRO → Sonnet", () => {
    expect(resolveCoachModel("PRO")).toBe(COACH_MODEL_IDS.SONNET);
  });

  it("plan STARTER/GROWTH → Sonnet", () => {
    expect(resolveCoachModel("STARTER")).toBe(COACH_MODEL_IDS.SONNET);
    expect(resolveCoachModel("GROWTH")).toBe(COACH_MODEL_IDS.SONNET);
  });

  it("plan ENTERPRISE default → Sonnet, with opus flag → Opus", () => {
    expect(resolveCoachModel("ENTERPRISE")).toBe(COACH_MODEL_IDS.SONNET);
    expect(resolveCoachModel("ENTERPRISE", { opusEnterprise: true })).toBe(COACH_MODEL_IDS.OPUS);
  });

  it("opus flag does NOT apply to non-Enterprise", () => {
    expect(resolveCoachModel("PRO", { opusEnterprise: true })).toBe(COACH_MODEL_IDS.SONNET);
    expect(resolveCoachModel("STARTER", { opusEnterprise: true })).toBe(COACH_MODEL_IDS.SONNET);
  });

  it("unknown plan → Haiku", () => {
    expect(resolveCoachModel("UNKNOWN_TIER")).toBe(COACH_MODEL_IDS.HAIKU);
    expect(resolveCoachModel(null)).toBe(COACH_MODEL_IDS.HAIKU);
  });

  it("case-insensitive plan", () => {
    expect(resolveCoachModel("free")).toBe(COACH_MODEL_IDS.HAIKU);
    expect(resolveCoachModel("Pro")).toBe(COACH_MODEL_IDS.SONNET);
  });

  it("env override empty/whitespace falls through", () => {
    expect(resolveCoachModel("PRO", { envOverride: "" })).toBe(COACH_MODEL_IDS.SONNET);
    expect(resolveCoachModel("PRO", { envOverride: "  " })).toBe(COACH_MODEL_IDS.SONNET);
  });
});
