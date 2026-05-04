"use client";
import { useEffect, useRef } from "react";
import { colors, typography, spacing } from "../tokens";
import MessageUser from "./MessageUser";
import MessageCoach from "./MessageCoach";

export default function ConversationList({ messages = [], onProtocolTap }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <section
      data-v2-coach-conversation
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s32,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s24,
        }}
      >
        CONVERSACIÓN
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.s24 }}>
        {messages.map((m) =>
          m.role === "user"
            ? <MessageUser key={m.id} content={m.content} ts={m.ts} />
            : <MessageCoach key={m.id} content={m.content} ts={m.ts} streaming={!!m.streaming} onProtocolTap={onProtocolTap} />
        )}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </section>
  );
}
