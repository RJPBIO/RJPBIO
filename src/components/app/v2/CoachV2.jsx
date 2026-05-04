"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { evaluateSafetySignals } from "@/lib/coachSafety";
import { buildCoachContext } from "@/lib/coachMemory";
import { useCoachQuota } from "@/hooks/useCoachQuota";
import { devLog } from "@/lib/dev-utils";
import HeaderV2 from "./home/HeaderV2";
import CoachIntro from "./coach/CoachIntro";
import QuotaRow from "./coach/QuotaRow";
import ConversationList from "./coach/ConversationList";
import EmptyState from "./coach/EmptyState";
import InputBar from "./coach/InputBar";
import CrisisCard from "./coach/CrisisCard";
import QuotaExceededBanner from "./coach/QuotaExceededBanner";
import MfaStepUpModal from "./coach/MfaStepUpModal";
import { colors, typography, spacing, layout } from "./tokens";

// Tab Coach v2 — chat con LLM real /api/coach SSE.
//
// Phase 6C SP3 — persistencia local + cleanup. Conversaciones viven en
// useStore.coachConversations (zustand → IDB cifrado). useState volátil
// reemplazado: hidratación al mount, persist on each delta, FIFO 30
// conversaciones max + sliding 50 messages/conv. Botón "Nueva" archiva
// la actual (queda en histórico no-mostrado por ahora) y arranca fresca.
//
// Disclaimer footer portado de /coach page legacy (eliminada en SP3).

// Phase 6C SP2 — guard de tamaño del userContext. buildCoachContext puede
// generar payloads grandes para users con history extenso; el endpoint
// tiene MAX_PAYLOAD_BYTES 32KB pero queremos estar muy por debajo para
// dejar espacio a los messages. ~4KB cap razonable.
const MAX_USER_CONTEXT_BYTES = 4096;
function compactUserContext(ctx) {
  if (!ctx) return {};
  let json;
  try { json = JSON.stringify(ctx); } catch { return {}; }
  if (json.length <= MAX_USER_CONTEXT_BYTES) return ctx;
  return {
    ...ctx,
    favoriteProtocols: (ctx.favoriteProtocols || []).slice(0, 3),
    worstProtocols: (ctx.worstProtocols || []).slice(0, 2),
    recentIntents: (ctx.recentIntents || []).slice(0, 3),
    coherenceProfile: (ctx.coherenceProfile || []).slice(0, 3),
    openQuestions: (ctx.openQuestions || []).slice(0, 2),
  };
}

// Quota inicial defensiva mientras useCoachQuota hace fetch al mount.
// Reemplazada por valor real ~50ms después.
const DEFAULT_QUOTA = { used: 0, max: 100, plan: "PRO" };

export default function CoachV2({ onNavigate, onBellClick, devOverride = null }) {
  const store = useStore();
  useEffect(() => { devLog("[v2] CoachV2 active", { devOverride }); }, [devOverride]);

  // Phase 6C SP3 — hidratación desde store. activeConversation puede ser
  // null (nuevo user o tras "Nueva conversación") → render EmptyState.
  // streamingPlaceholder vive separado del store para evitar persistir
  // el placeholder vacío y permitir UI updates a 60fps sin churn de IDB.
  const conversations = useStore((s) => s.coachConversations || []);
  const activeId = useStore((s) => s.coachActiveConversationId);
  const activeConversation = useMemo(
    () => (activeId ? conversations.find((c) => c.id === activeId) : null),
    [conversations, activeId],
  );

  // streamingMessage: render-only placeholder mientras el LLM streamea.
  // Cuando completa, persistimos a store (logCoachMessage) y limpiamos.
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [quota, setQuota] = useState(DEFAULT_QUOTA);
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingPrefill, setPendingPrefill] = useState("");
  // PHASE 6D SP5 Bug-13 — error transitorio diferenciado (401/5xx/network).
  // Antes el branch !ok genérico persistía un mensaje "No pude responder ahora"
  // como si fuera respuesta del coach. Ahora estos errores muestran un banner
  // inline con CTA específico (signin / retry / null) y NO contaminan el log.
  // shape: { type: "unauthenticated"|"server"|"network", message, cta }
  const [coachError, setCoachError] = useState(null);
  const abortRef = useRef(null);
  // PHASE 6D SP5 Bug-14 — última pendingPrefill texto para retry-on-banner-CTA.
  const lastSentRef = useRef("");

  // PHASE 6D SP5 Bug-14 — cleanup AbortController en unmount. Antes si el
  // user cambiaba de tab mid-streaming, el reader seguía llegando + setState
  // disparaba warning "setState on unmounted component". Ahora abort cancela
  // el fetch + el while-loop sale por reader.read() rejection.
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
        abortRef.current = null;
      }
    };
  }, []);

  const { quota: realQuota, refetch: refetchQuota, isUnauthenticated } = useCoachQuota();
  useEffect(() => { if (realQuota) setQuota(realQuota); }, [realQuota]);

  // Mensajes visibles = persisted (store) + streaming placeholder al final
  const persistedMessages = activeConversation?.messages || [];
  const messages = useMemo(() => {
    if (!streamingMessage) return persistedMessages;
    return [...persistedMessages, streamingMessage];
  }, [persistedMessages, streamingMessage]);
  const hasMessages = messages.length > 0;

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;
    if (quota && quota.max !== Infinity && quota.used >= quota.max) {
      setShowQuotaBanner(true);
      return;
    }
    // PHASE 6D SP5 Bug-13 — limpiar error previo al iniciar nuevo intento.
    setCoachError(null);
    lastSentRef.current = text;
    const safety = evaluateSafetySignals(store, { userText: text, locale: "es-MX" });

    // Resolver conversación activa: si no hay, crear una nueva ahora.
    let convId = activeId;
    if (!convId) {
      try { convId = useStore.getState().startCoachConversation(); }
      catch (e) { console.error("[v2] startCoachConversation", e); return; }
    }

    const userMsg = { role: "user", content: text, ts: Date.now() };
    try { useStore.getState().logCoachMessage(convId, userMsg); }
    catch (e) { console.error("[v2] logCoachMessage user", e); }

    if (safety.level === "crisis") {
      // NO al LLM. NO contabiliza quota. Persistimos crisis card como
      // mensaje del coach con role especial + recursos del locale.
      try {
        useStore.getState().logCoachMessage(convId, {
          role: "coach-crisis",
          content: "",
          ts: Date.now(),
          resources: safety.resources,
        });
      } catch (e) { console.error("[v2] logCoachMessage crisis", e); }
      return;
    }

    const placeholderId = `c-${Date.now()}`;
    setStreamingMessage({ id: placeholderId, role: "coach", content: "", ts: Date.now(), streaming: true });

    let acc = "";
    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const storeState = useStore.getState();
      const userContext = compactUserContext(buildCoachContext(storeState));
      // Construir history desde la conversación persisted + el user msg
      // que acabamos de loggear. Usamos la conv recién actualizada del store
      // para incluir userMsg sin race condition.
      const freshConv = useStore.getState().coachConversations.find((c) => c.id === convId);
      const apiMessages = (freshConv?.messages || [])
        .filter((m) => m.role === "user" || m.role === "coach")
        .map((m) => ({ role: m.role === "coach" ? "assistant" : "user", content: m.content }));
      const resp = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          userContext,
          orgId: null,
        }),
        signal: ctrl.signal,
      });

      if (resp.status === 403 && resp.headers.get("x-mfa-required") === "true") {
        setStreamingMessage(null);
        setMfaRequired(true);
        return;
      }
      // PHASE 6D SP5 Bug-13 — diferenciación de error states.
      // 401: session expiró mid-conversation. CTA explícito a /signin con
      // callback de regreso al tab coach (preserva texto en lastSentRef
      // para que user pueda re-enviar tras autenticarse).
      if (resp.status === 401) {
        setStreamingMessage(null);
        setCoachError({
          type: "unauthenticated",
          message: "Tu sesión expiró. Inicia sesión para continuar.",
          cta: { label: "INICIAR SESIÓN", action: "signin" },
        });
        return;
      }
      if (resp.status === 429) {
        const body = await safeJson(resp);
        setStreamingMessage(null);
        setQuota({
          used: body?.used ?? quota.used,
          max: body?.max ?? quota.max,
          plan: body?.plan ?? quota.plan,
        });
        setShowQuotaBanner(true);
        return;
      }
      if (!resp.ok || !resp.body) {
        // 5xx genérico — server-side issue. CTA "REINTENTAR" usa
        // lastSentRef para re-disparar sin re-tipear.
        setStreamingMessage(null);
        setCoachError({
          type: "server",
          message: "No pude responder ahora. Intenta de nuevo en un momento.",
          cta: { label: "REINTENTAR", action: "retry" },
        });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.delta) {
              acc += payload.delta;
              setStreamingMessage((prev) => prev ? { ...prev, content: acc } : prev);
            }
            if (payload.done) {
              // Persistir mensaje completo + limpiar streaming placeholder.
              try {
                useStore.getState().logCoachMessage(convId, {
                  role: "coach", content: acc, ts: Date.now(),
                });
              } catch (e) { console.error("[v2] logCoachMessage coach", e); }
              setStreamingMessage(null);
              setQuota((q) => q.max === Infinity ? q : { ...q, used: q.used + 1 });
              if (!devOverride) refetchQuota();
            }
            if (payload.error) {
              const errFinal = acc || "Algo se interrumpió. Intenta otra vez.";
              try {
                useStore.getState().logCoachMessage(convId, {
                  role: "coach", content: errFinal, ts: Date.now(),
                });
              } catch (e) { console.error("[v2] logCoachMessage err", e); }
              setStreamingMessage(null);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      // PHASE 6D SP5 Bug-13/Bug-14 — distinguish abort (silent) vs network.
      // AbortError llega cuando: (a) user navega away mid-stream (cleanup
      // useEffect dispara abort), (b) "Nueva conversación" cancela.
      // En ambos casos NO mostrar error — la intención del user fue cortar.
      if (err?.name === "AbortError") {
        setStreamingMessage(null);
        return;
      }
      if (acc) {
        // Si ya teníamos contenido parcial, persistir lo que llegó.
        try {
          useStore.getState().logCoachMessage(convId, {
            role: "coach", content: acc, ts: Date.now(),
          });
        } catch (e) { console.error("[v2] logCoachMessage abort", e); }
        setStreamingMessage(null);
      } else {
        // Sin contenido + no-abort = network/parse error genuino. Banner
        // específico en lugar de polluir el log con "Conexión interrumpida".
        setStreamingMessage(null);
        setCoachError({
          type: "network",
          message: "Sin conexión. Verifica tu internet.",
          cta: { label: "REINTENTAR", action: "retry" },
        });
      }
    } finally {
      abortRef.current = null;
    }
  };

  // PHASE 6D SP5 Bug-13 — handler para CTA del banner.
  const handleErrorCta = () => {
    if (!coachError?.cta) return;
    const action = coachError.cta.action;
    if (action === "signin") {
      if (typeof window !== "undefined") {
        window.location.href = `/signin?callbackUrl=${encodeURIComponent("/app?tab=coach")}`;
      }
      return;
    }
    if (action === "retry") {
      const text = lastSentRef.current;
      setCoachError(null);
      if (text) {
        // Re-inyectar al input para que user vea qué se reintenta.
        setPendingPrefill(text);
        sendMessage(text);
      }
    }
  };

  const isQuotaExceeded = quota && quota.max !== Infinity && quota.used >= quota.max;

  // Phase 6C SP2 — handler tap inline desde MessageCoach.
  const handleProtocolTap = (protocolId) => {
    if (!Number.isFinite(protocolId)) return;
    onNavigate?.({ action: "start-protocol", protocolId });
  };

  // Phase 6C SP3 — Nueva conversación: setea activeId=null. El próximo
  // sendMessage detecta y crea una conv fresca via startCoachConversation.
  // La conversación previa queda en coachConversations (histórico) pero
  // la UI actual no la muestra (lista de conversaciones previas es scope
  // post-MVP, ver CLEANUP_BACKLOG #17).
  const handleNewConversation = () => {
    try {
      useStore.getState().setCoachActiveConversation(null);
      setStreamingMessage(null);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    } catch (e) { console.error("[v2] setCoachActiveConversation", e); }
  };

  // Phase 6D SP4a (Bug-12) — empty state honesto para users no auth.
  // Antes: caía al DEFAULT_QUOTA "PLAN PRO 0/100" engañoso. Ahora muestra
  // CoachAuthRequired con CTA explícita a /signin. El resto del componente
  // no monta (no input bar, no quota row).
  if (isUnauthenticated) {
    return (
      <>
        <HeaderV2 onBellClick={onBellClick} />
        <CoachAuthRequired onSignin={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent("/app?tab=coach")}`;
          }
        }} />
      </>
    );
  }

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <CoachIntro hasWeeklySummary={false} />
      <QuotaRow
        used={quota.used}
        max={quota.max}
        plan={quota.plan}
        onUpgrade={() => onNavigate && onNavigate({ target: "/pricing" })}
      />
      {hasMessages && (
        <NewConversationRow onClick={handleNewConversation} />
      )}
      {hasMessages ? (
        <ConversationListWithCrisis messages={messages} onProtocolTap={handleProtocolTap} />
      ) : (
        <EmptyState onPick={(p) => { setPendingPrefill(p); sendMessage(p); }} />
      )}

      {/* Spacer para que la conversacion no quede oculta detras del input fijo + disclaimer. */}
      <div style={{ height: layout.bottomNavHeight + 110 }} aria-hidden="true" />

      <InputBar
        disabled={isQuotaExceeded}
        valueExternal={pendingPrefill}
        onChangeExternal={setPendingPrefill}
        onSend={sendMessage}
      />

      {/* Phase 6C SP3 — disclaimer portado de /coach page legacy. Liability:
          coach es asistente, no sustituye atención clínica. */}
      <CoachDisclaimer />

      {showQuotaBanner && (
        <QuotaExceededBanner
          max={quota.max}
          autoDismissMs={4000}
          onDismiss={() => setShowQuotaBanner(false)}
        />
      )}
      {coachError && (
        <CoachErrorBanner
          type={coachError.type}
          message={coachError.message}
          cta={coachError.cta}
          onCtaPress={handleErrorCta}
          onDismiss={() => setCoachError(null)}
        />
      )}
      {mfaRequired && (
        <MfaStepUpModal
          onCancel={() => setMfaRequired(false)}
          onVerify={() => setMfaRequired(false)}
        />
      )}
    </>
  );
}

// Conversation list que tambien renderiza CrisisCard inline cuando un
// mensaje tiene role "coach-crisis".
function ConversationListWithCrisis({ messages, onProtocolTap }) {
  const hasCrisis = messages.some((m) => m.role === "coach-crisis");
  if (!hasCrisis) return <ConversationList messages={messages} onProtocolTap={onProtocolTap} />;
  return <ConversationListCrisis messages={messages} onProtocolTap={onProtocolTap} />;
}

function ConversationListCrisis({ messages, onProtocolTap }) {
  return (
    <>
      <ConversationList messages={messages.filter((m) => m.role !== "coach-crisis")} onProtocolTap={onProtocolTap} />
      {messages.filter((m) => m.role === "coach-crisis").map((m, i) => (
        <CrisisCard key={m.id || `crisis-${i}`} resources={m.resources || []} />
      ))}
    </>
  );
}

// Phase 6C SP3 — botón "Nueva conversación" arriba del log. Discreto:
// link mono cyan, no compite con el contenido. Aparece solo cuando hay
// mensajes (no muestra si está empty — en empty no hay nada que dejar).
function NewConversationRow({ onClick }) {
  return (
    <div
      style={{
        paddingInline: spacing.s24,
        paddingBlock: 12,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        data-testid="coach-new-conversation"
        aria-label="Empezar nueva conversación con el coach"
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: colors.accent.phosphorCyan,
          cursor: "pointer",
          padding: "6px 4px",
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: typography.weight.medium,
        }}
      >
        + Nueva conversación
      </button>
    </div>
  );
}

// Disclaimer fijo arriba del input bar, debajo del bottom nav.
// Liability legal — coach es asistente, NO sustituye atención clínica.
// Texto portado de /coach page legacy (eliminada Phase 6C SP3).
function CoachDisclaimer() {
  return (
    <div
      data-v2-coach-disclaimer
      style={{
        position: "fixed",
        insetInlineStart: 0,
        insetInlineEnd: 0,
        // Phase 6D SP5 Bug-41 — height hoisted a layout.coachInputBarHeight
        // (68px). Antes 56px hardcoded causaba ~12px de overlap visible
        // detrás del top del InputBar en algunos viewports.
        insetBlockEnd: `calc(${layout.bottomNavHeight}px + ${layout.coachInputBarHeight}px + env(safe-area-inset-bottom, 0px))`,
        padding: "8px 24px",
        textAlign: "center",
        fontFamily: typography.family,
        fontSize: typography.size.microCaps,
        fontWeight: typography.weight.regular,
        color: "rgba(255,255,255,0.32)",
        lineHeight: 1.4,
        // Phase 6D SP5 Bug-45 — gradient antes era transparent → bg.base
        // (#08080A) lo que generaba lectura extraña con el blur del nav
        // detrás (la fade chocaba con el blur translucent). Solid panel
        // semi-opaco evita ese conflicto y mantiene legibilidad.
        background: "rgba(8,8,10,0.92)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      Bio-Ignición Coach es asistente. No sustituye atención clínica profesional.
    </div>
  );
}

async function safeJson(resp) {
  try { return await resp.json(); } catch { return null; }
}

// PHASE 6D SP5 Bug-13 — banner inline para errores transitorios (401/5xx/network).
// Sustituye el patrón anterior de logCoachMessage("No pude responder ahora")
// que ensuciaba el historial persistido. Aparece encima del InputBar (zIndex 52)
// con CTA específico al tipo de error. Auto-dismiss NO implementado: errors
// requieren acción del user (signin/retry). border-color por tipo da señal visual.
// Exportado named para tests unitarios sin necesidad de mockear todo CoachV2.
export function CoachErrorBanner({ type, message, cta, onCtaPress, onDismiss }) {
  const accent = type === "unauthenticated"
    ? colors.accent.phosphorCyan
    : type === "network"
      ? colors.semantic?.warn || "rgba(255,193,7,0.9)"
      : colors.semantic?.danger || "rgba(255,80,80,0.9)";
  return (
    <div
      data-v2-coach-error-banner
      data-error-type={type}
      role="alert"
      style={{
        position: "fixed",
        insetInlineStart: 0,
        insetInlineEnd: 0,
        insetBlockEnd: `calc(${layout.bottomNavHeight}px + 68px + 32px + env(safe-area-inset-bottom, 0px))`,
        paddingInline: spacing.s16,
        zIndex: 52,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: layout.maxContentWidth,
          marginInline: "auto",
          background: "rgba(8,8,10,0.94)",
          border: `0.5px solid ${accent}`,
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          pointerEvents: "auto",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            inlineSize: 6,
            blockSize: 6,
            borderRadius: 999,
            background: accent,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.35,
          }}
        >
          {message}
        </span>
        {cta ? (
          <button
            type="button"
            onClick={onCtaPress}
            data-testid={`coach-error-cta-${cta.action}`}
            style={{
              appearance: "none",
              background: "transparent",
              border: `0.5px solid ${accent}`,
              borderRadius: 8,
              color: accent,
              cursor: "pointer",
              paddingBlock: 8,
              paddingInline: 14,
              minBlockSize: 36,
              fontFamily: typography.family,
              fontSize: 11,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {cta.label}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          data-testid="coach-error-dismiss"
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            padding: 4,
            margin: -4,
            fontFamily: typography.family,
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Phase 6D SP4a (Bug-12) — empty state honesto cuando user no está
// autenticado. Reemplaza el QuotaRow fake "PLAN PRO 0/100" + InputBar
// que pretendían que el coach estaba disponible. Ahora copy explícito +
// CTA a /signin con callback de regreso al tab coach.
function CoachAuthRequired({ onSignin }) {
  return (
    <section
      data-v2-coach-auth-required
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s96,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 32,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.03em",
            color: colors.text.primary,
            lineHeight: 1.1,
          }}
        >
          Coach.
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          Inicia sesión para conversar con tu coach neural.
        </p>
      </div>
      <article
        style={{
          background: "transparent",
          border: `0.5px dashed ${colors.separator}`,
          borderRadius: 16,
          padding: spacing.s24,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.5,
          }}
        >
          El coach usa contexto de tu calibración + sesiones para responder. Para protegerlo, requiere autenticación.
        </p>
        <button
          type="button"
          onClick={onSignin}
          data-testid="coach-auth-signin"
          style={{
            appearance: "none",
            background: "transparent",
            border: `0.5px solid ${colors.accent.phosphorCyan}`,
            borderRadius: 8,
            color: colors.accent.phosphorCyan,
            cursor: "pointer",
            paddingBlock: 14,
            paddingInline: 20,
            minBlockSize: 48,
            fontFamily: typography.family,
            fontSize: 12,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
        >
          Iniciar sesión
        </button>
      </article>
    </section>
  );
}
