// Phase 6C SP3 — cleanup. Eliminados FIXTURE_MESSAGES, FIXTURE_QUOTA*,
// FIXTURE_WEEKLY_SUMMARY y FIXTURE_MESSAGES_STREAMING. Coach ahora se
// hidrata desde useStore.coachConversations (persistencia local IDB) +
// useCoachQuota hook (server real). Único fixture genuino que sobrevive:
// SUGGESTED_PROMPTS — son chips del empty state que ofrecen al user
// puntos de partida frecuentes para iniciar una conversación.

// Chips de prompts sugeridos para empty state.
export const SUGGESTED_PROMPTS = [
  "Me siento agotado",
  "Necesito enfoque",
  "Estoy ansioso",
  "No puedo dormir",
  "Vengo del gym",
];
