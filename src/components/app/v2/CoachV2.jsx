"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { evaluateSafetySignals } from "@/lib/coachSafety";
import HeaderV2 from "./home/HeaderV2";
import CoachIntro from "./coach/CoachIntro";
import QuotaRow from "./coach/QuotaRow";
import WeeklySummaryCard from "./coach/WeeklySummaryCard";
import ConversationList from "./coach/ConversationList";
import EmptyState from "./coach/EmptyState";
import InputBar from "./coach/InputBar";
import CrisisCard from "./coach/CrisisCard";
import QuotaExceededBanner from "./coach/QuotaExceededBanner";
import MfaStepUpModal from "./coach/MfaStepUpModal";
import {
  FIXTURE_QUOTA,
  FIXTURE_QUOTA_EXCEEDED,
  FIXTURE_QUOTA_FREE,
  FIXTURE_WEEKLY_SUMMARY,
  FIXTURE_MESSAGES,
  FIXTURE_MESSAGES_STREAMING,
} from "./coach/fixtures";
import { layout } from "./tokens";

// Tab Coach v2 — chat con LLM real /api/coach SSE.
// Override flags ?coach=empty|conversation|streaming|quota|weekly|all
// para preview de cada estado sin necesidad de API real.

const VALID_COACH_OVERRIDES = new Set([
  "empty", "conversation", "streaming", "quota", "weekly", "all",
]);

export default function CoachV2({ onNavigate, onBellClick, devOverride = null }) {
  const store = useStore();
  useEffect(() => { console.log("[v2] CoachV2 active", { devOverride }); }, [devOverride]);

  const initial = applyDevOverride(devOverride);
  const [messages, setMessages] = useState(initial.messages);
  const [quota, setQuota] = useState(initial.quota);
  const [showQuotaBanner, setShowQuotaBanner] = useState(devOverride === "quota");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingPrefill, setPendingPrefill] = useState("");
  const abortRef = useRef(null);

  const summary = initial.summary;
  const hasMessages = messages.length > 0;

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;
    if (quota && quota.max !== Infinity && quota.used >= quota.max) {
      setShowQuotaBanner(true);
      return;
    }
    const safety = evaluateSafetySignals(store, { userText: text, locale: "es-MX" });
    const userMsg = { id: `u-${Date.now()}`, role: "user", content: text, ts: Date.now() };

    if (safety.level === "crisis") {
      // NO al LLM. NO contabiliza quota. Render crisis card como mensaje del coach.
      const crisisMsg = {
        id: `c-${Date.now()}`,
        role: "coach-crisis",
        content: "",
        ts: Date.now(),
        resources: safety.resources,
      };
      setMessages((prev) => [...prev, userMsg, crisisMsg]);
      return;
    }

    const placeholderId = `c-${Date.now()}`;
    const placeholder = { id: placeholderId, role: "coach", content: "", ts: Date.now(), streaming: true };
    setMessages((prev) => [...prev, userMsg, placeholder]);

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const resp = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      });

      if (resp.status === 403 && resp.headers.get("x-mfa-required") === "true") {
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        setMfaRequired(true);
        return;
      }
      if (resp.status === 429) {
        const body = await safeJson(resp);
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        setQuota({ used: body?.used ?? quota.used, max: body?.max ?? quota.max, plan: body?.plan ?? quota.plan });
        setShowQuotaBanner(true);
        return;
      }
      if (!resp.ok || !resp.body) {
        setMessages((prev) => prev.map((m) => m.id === placeholderId
          ? { ...m, content: "No pude responder ahora. Intenta de nuevo en un momento.", streaming: false }
          : m));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
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
              setMessages((prev) => prev.map((m) => m.id === placeholderId ? { ...m, content: acc } : m));
            }
            if (payload.done) {
              setMessages((prev) => prev.map((m) => m.id === placeholderId ? { ...m, streaming: false } : m));
              setQuota((q) => q.max === Infinity ? q : { ...q, used: q.used + 1 });
            }
            if (payload.error) {
              setMessages((prev) => prev.map((m) => m.id === placeholderId
                ? { ...m, content: acc || "Algo se interrumpió. Intenta otra vez.", streaming: false }
                : m));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === placeholderId
        ? { ...m, content: "Conexión interrumpida.", streaming: false }
        : m));
    } finally {
      abortRef.current = null;
    }
  };

  const isQuotaExceeded = quota && quota.max !== Infinity && quota.used >= quota.max;

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <CoachIntro hasWeeklySummary={!!summary} />
      <QuotaRow
        used={quota.used}
        max={quota.max}
        plan={quota.plan}
        onUpgrade={() => onNavigate && onNavigate({ target: "/pricing" })}
      />
      {summary && (
        <WeeklySummaryCard
          summary={summary}
          onExport={() => onNavigate && onNavigate({ action: "export-weekly-summary" })}
        />
      )}
      {hasMessages ? (
        <ConversationListWithCrisis messages={messages} />
      ) : (
        <EmptyState onPick={(p) => { setPendingPrefill(p); sendMessage(p); }} />
      )}

      {/* Spacer para que la conversacion no quede oculta detras del input fijo. */}
      <div style={{ height: layout.bottomNavHeight + 80 }} aria-hidden="true" />

      <InputBar
        disabled={isQuotaExceeded}
        valueExternal={pendingPrefill}
        onChangeExternal={setPendingPrefill}
        onSend={sendMessage}
      />

      {showQuotaBanner && (
        <QuotaExceededBanner
          max={quota.max}
          autoDismissMs={devOverride === "quota" ? 0 : 4000}
          onDismiss={() => setShowQuotaBanner(false)}
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
function ConversationListWithCrisis({ messages }) {
  const hasCrisis = messages.some((m) => m.role === "coach-crisis");
  if (!hasCrisis) return <ConversationList messages={messages} />;
  // Render lista normal pero reemplaza coach-crisis por CrisisCard.
  return <ConversationListCrisis messages={messages} />;
}

function ConversationListCrisis({ messages }) {
  return (
    <>
      <ConversationList messages={messages.filter((m) => m.role !== "coach-crisis")} />
      {messages.filter((m) => m.role === "coach-crisis").map((m) => (
        <CrisisCard key={m.id} resources={m.resources || []} />
      ))}
    </>
  );
}

function applyDevOverride(devOverride) {
  if (!VALID_COACH_OVERRIDES.has(devOverride)) {
    return { messages: FIXTURE_MESSAGES, quota: FIXTURE_QUOTA, summary: FIXTURE_WEEKLY_SUMMARY };
  }
  switch (devOverride) {
    case "empty":
      return { messages: [], quota: FIXTURE_QUOTA_FREE, summary: null };
    case "conversation":
      return { messages: FIXTURE_MESSAGES, quota: FIXTURE_QUOTA, summary: null };
    case "streaming":
      return { messages: FIXTURE_MESSAGES_STREAMING, quota: FIXTURE_QUOTA, summary: null };
    case "quota":
      return { messages: FIXTURE_MESSAGES, quota: FIXTURE_QUOTA_EXCEEDED, summary: null };
    case "weekly":
      return { messages: [], quota: FIXTURE_QUOTA, summary: FIXTURE_WEEKLY_SUMMARY };
    case "all":
    default:
      return { messages: FIXTURE_MESSAGES, quota: FIXTURE_QUOTA, summary: FIXTURE_WEEKLY_SUMMARY };
  }
}

async function safeJson(resp) {
  try { return await resp.json(); } catch { return null; }
}
