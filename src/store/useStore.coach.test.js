/* ═══════════════════════════════════════════════════════════════
   useStore.coach.test — Phase 6C SP3
   Coach conversation persistence: startCoachConversation,
   logCoachMessage, clearCoachConversation, setCoachActiveConversation,
   clearAllCoachConversations + caps FIFO/sliding.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";

beforeEach(() => {
  useStore.setState({
    coachConversations: [],
    coachActiveConversationId: null,
  });
});

describe("startCoachConversation", () => {
  it("crea conversación con id único + activeId set", () => {
    const id = useStore.getState().startCoachConversation();
    expect(typeof id).toBe("string");
    expect(id.startsWith("conv_")).toBe(true);
    const st = useStore.getState();
    expect(st.coachActiveConversationId).toBe(id);
    expect(st.coachConversations).toHaveLength(1);
    expect(st.coachConversations[0].id).toBe(id);
    expect(st.coachConversations[0].messages).toEqual([]);
  });

  it("nuevas conversaciones aparecen al frente del array", () => {
    const id1 = useStore.getState().startCoachConversation();
    const id2 = useStore.getState().startCoachConversation();
    const arr = useStore.getState().coachConversations;
    expect(arr[0].id).toBe(id2);
    expect(arr[1].id).toBe(id1);
  });

  it("cap FIFO 30 conversaciones — la 31 dropea la más vieja", () => {
    const ids = [];
    for (let i = 0; i < 30; i++) ids.push(useStore.getState().startCoachConversation());
    expect(useStore.getState().coachConversations).toHaveLength(30);
    const newId = useStore.getState().startCoachConversation();
    const arr = useStore.getState().coachConversations;
    expect(arr).toHaveLength(30);
    expect(arr[0].id).toBe(newId);
    // La conversación más vieja (ids[0]) ya no debe estar
    expect(arr.find((c) => c.id === ids[0])).toBeUndefined();
  });
});

describe("logCoachMessage", () => {
  it("agrega mensaje a la conversación correcta", () => {
    const id = useStore.getState().startCoachConversation();
    useStore.getState().logCoachMessage(id, { role: "user", content: "Hola" });
    const conv = useStore.getState().coachConversations[0];
    expect(conv.messages).toHaveLength(1);
    expect(conv.messages[0]).toMatchObject({ role: "user", content: "Hola" });
    expect(typeof conv.messages[0].ts).toBe("number");
  });

  it("preserva ts del caller cuando se provee", () => {
    const id = useStore.getState().startCoachConversation();
    useStore.getState().logCoachMessage(id, { role: "coach", content: "Hi", ts: 1700000000000 });
    expect(useStore.getState().coachConversations[0].messages[0].ts).toBe(1700000000000);
  });

  it("preserva resources para crisis messages", () => {
    const id = useStore.getState().startCoachConversation();
    const resources = [{ label: "SAPTEL", contact: "800" }];
    useStore.getState().logCoachMessage(id, { role: "coach-crisis", content: "", resources });
    expect(useStore.getState().coachConversations[0].messages[0].resources).toEqual(resources);
  });

  it("cap 50 mensajes por conversación (sliding window)", () => {
    const id = useStore.getState().startCoachConversation();
    for (let i = 0; i < 60; i++) {
      useStore.getState().logCoachMessage(id, { role: "user", content: `msg ${i}` });
    }
    const conv = useStore.getState().coachConversations[0];
    expect(conv.messages).toHaveLength(50);
    expect(conv.messages[0].content).toBe("msg 10");
    expect(conv.messages[49].content).toBe("msg 59");
  });

  it("conversación recién actualizada se mueve al frente (lastMessageAt sort)", () => {
    const id1 = useStore.getState().startCoachConversation();
    const id2 = useStore.getState().startCoachConversation();
    // id2 está al frente. Loggear en id1 con ts futuro fuerza el sort
    // sin depender de la resolución de Date.now() en la misma tick.
    useStore.getState().logCoachMessage(id1, { role: "user", content: "ping", ts: Date.now() + 5000 });
    expect(useStore.getState().coachConversations[0].id).toBe(id1);
  });

  it("conversationId inválido es no-op (NO crashea)", () => {
    useStore.getState().logCoachMessage("bogus_id", { role: "user", content: "x" });
    expect(useStore.getState().coachConversations).toHaveLength(0);
  });

  it("message sin role es no-op", () => {
    const id = useStore.getState().startCoachConversation();
    useStore.getState().logCoachMessage(id, { content: "no role" });
    expect(useStore.getState().coachConversations[0].messages).toHaveLength(0);
  });
});

describe("clearCoachConversation", () => {
  it("elimina conversación específica", () => {
    const id1 = useStore.getState().startCoachConversation();
    const id2 = useStore.getState().startCoachConversation();
    useStore.getState().clearCoachConversation(id1);
    const arr = useStore.getState().coachConversations;
    expect(arr).toHaveLength(1);
    expect(arr[0].id).toBe(id2);
  });

  it("reset activeId si era la conversación borrada", () => {
    const id = useStore.getState().startCoachConversation();
    expect(useStore.getState().coachActiveConversationId).toBe(id);
    useStore.getState().clearCoachConversation(id);
    expect(useStore.getState().coachActiveConversationId).toBeNull();
  });

  it("preserva activeId si se borra otra conversación distinta", () => {
    const id1 = useStore.getState().startCoachConversation();
    const id2 = useStore.getState().startCoachConversation(); // active queda en id2
    useStore.getState().clearCoachConversation(id1);
    expect(useStore.getState().coachActiveConversationId).toBe(id2);
  });
});

describe("setCoachActiveConversation", () => {
  it("cambia activeId al id provisto", () => {
    const id = useStore.getState().startCoachConversation();
    useStore.getState().setCoachActiveConversation(null);
    expect(useStore.getState().coachActiveConversationId).toBeNull();
    useStore.getState().setCoachActiveConversation(id);
    expect(useStore.getState().coachActiveConversationId).toBe(id);
  });

  it("acepta null para 'sin activa'", () => {
    useStore.getState().startCoachConversation();
    useStore.getState().setCoachActiveConversation(null);
    expect(useStore.getState().coachActiveConversationId).toBeNull();
  });
});

describe("clearAllCoachConversations", () => {
  it("vacía conversaciones + reset activeId", () => {
    useStore.getState().startCoachConversation();
    useStore.getState().startCoachConversation();
    useStore.getState().clearAllCoachConversations();
    expect(useStore.getState().coachConversations).toEqual([]);
    expect(useStore.getState().coachActiveConversationId).toBeNull();
  });
});
