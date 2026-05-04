/* dev-utils.test — Phase 6D SP6 Bug-24. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { devLog, devWarn, devInfo } from "./dev-utils";

describe("dev-utils — Phase 6D SP6 Bug-24", () => {
  let logSpy, warnSpy, infoSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  // En vitest, NODE_ENV es "test" por default — devLog SÍ debe loggear.
  it("devLog escribe a console.log en NODE_ENV=test", () => {
    devLog("[v2] HomeV2 active", { devOverride: null });
    expect(logSpy).toHaveBeenCalledWith("[v2] HomeV2 active", { devOverride: null });
  });

  it("devWarn escribe a console.warn en NODE_ENV=test", () => {
    devWarn("possible regression");
    expect(warnSpy).toHaveBeenCalledWith("possible regression");
  });

  it("devInfo escribe a console.info en NODE_ENV=test", () => {
    devInfo("info message");
    expect(infoSpy).toHaveBeenCalledWith("info message");
  });

  it("acepta multiple args (rest spread)", () => {
    devLog("a", "b", { c: 1 }, [2, 3]);
    expect(logSpy).toHaveBeenCalledWith("a", "b", { c: 1 }, [2, 3]);
  });

  it("acepta zero args sin crash", () => {
    expect(() => devLog()).not.toThrow();
    expect(logSpy).toHaveBeenCalledWith();
  });
});
