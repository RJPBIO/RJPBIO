/* useStore.setUserEmail — Phase 6D SP3 fixtures cleanup. */
import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";

beforeEach(() => {
  useStore.setState({ _userEmail: null });
});

describe("useStore.setUserEmail (Phase 6D SP3)", () => {
  it("setea state._userEmail con string valido", () => {
    useStore.getState().setUserEmail("ana@empresa.com");
    expect(useStore.getState()._userEmail).toBe("ana@empresa.com");
  });

  it("acepta null para limpiar (logout)", () => {
    useStore.setState({ _userEmail: "previo@example.com" });
    useStore.getState().setUserEmail(null);
    expect(useStore.getState()._userEmail).toBeNull();
  });

  it("normaliza string vacío a null", () => {
    useStore.getState().setUserEmail("");
    expect(useStore.getState()._userEmail).toBeNull();
  });

  it("normaliza no-string (number, undefined) a null", () => {
    useStore.getState().setUserEmail(undefined);
    expect(useStore.getState()._userEmail).toBeNull();
    useStore.getState().setUserEmail(123);
    expect(useStore.getState()._userEmail).toBeNull();
  });

  it("default _userEmail es null en DS", () => {
    // Sin haber setteado nada, el field debe estar null (Phase 6D SP3
    // agregó este campo a DS en lib/constants.js).
    useStore.setState({ _userEmail: null });
    expect(useStore.getState()._userEmail).toBeNull();
  });
});
