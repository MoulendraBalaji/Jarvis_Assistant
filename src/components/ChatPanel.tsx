import React, { useEffect, useRef, useState } from "react";
import { ClayCard, ClayInput, ClayButton } from "../design-system";
import { useChat } from "../store/chat";
import { IntentResult } from "../../shared/types";

export function ChatPanel() {
  const { messages, thinking, load, send } = useChat();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    if (/^\/screen/i.test(trimmed)) {
      useChat.getState().sendScreen(trimmed);
    } else {
      send(trimmed);
    }
  };

  return (
    <ClayCard large style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Conversation</h3>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} text={m.text} intent={m.intent} />
        ))}
        {thinking && <Bubble role="assistant" text="…" intent={undefined} />}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <ClayInput placeholder="Ask JARVIS anything…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <ClayButton variant="primary" onClick={submit}>Send</ClayButton>
      </div>
    </ClayCard>
  );
}

function Bubble({ role, text, intent }: { role: string; text: string; intent?: string }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "78%",
          padding: "12px 16px",
          borderRadius: 20,
          boxShadow: "var(--clay-shadow-raised-sm)",
          background: isUser ? "linear-gradient(135deg,#a3b8f7,#c3d0fb)" : "var(--clay-surface)",
          color: isUser ? "#1f2740" : "var(--clay-text)",
          fontSize: 14
        }}
      >
        {text}
        {intent && !isUser && (
          <div style={{ fontSize: 11, color: "var(--clay-text-muted)", marginTop: 6 }}>intent: {intent}</div>
        )}
      </div>
    </div>
  );
}
