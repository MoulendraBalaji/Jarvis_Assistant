import React, { useEffect, useState } from "react";
import { ClayCard, ClayButton, ClayInput } from "../design-system";
import { useTasks } from "../store/tasks";
import { useChat } from "../store/chat";
import * as chrono from "chrono-node";

export function TaskBoard() {
  const { tasks, load, create, toggle, remove } = useTasks();
  const [title, setTitle] = useState("");

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!title.trim()) return;
    const parsed = chrono.parse(title, new Date(), { forwardDate: true });
    const dueAt = parsed.length ? parsed[0].start.date().getTime() : null;
    await create(title.trim(), dueAt);
    setTitle("");
  };

  return (
    <ClayCard large>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Task Board</h2>
        <span style={{ color: "var(--clay-text-muted)", fontSize: 13 }}>{tasks.filter((t) => !t.completed).length} open</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <ClayInput
          placeholder="Add a task…  e.g. Submit essay by Friday"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <ClayButton variant="primary" onClick={submit}>Add</ClayButton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
        {tasks.length === 0 && (
          <p style={{ color: "var(--clay-text-muted)", fontSize: 13 }}>
            No tasks yet. Try the chat: “remind me to call mom tomorrow”.
          </p>
        )}
        {tasks.map((t) => (
          <div
            key={t.id}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 16, boxShadow: "var(--clay-shadow-raised-sm)" }}
          >
            <input type="checkbox" checked={!!t.completed} onChange={() => toggle(t.id)} style={{ accentColor: "#8aa0f0", width: 18, height: 18 }} />
            <div style={{ flex: 1 }}>
              <div style={{ textDecoration: t.completed ? "line-through" : "none", color: t.completed ? "var(--clay-text-muted)" : "var(--clay-text)" }}>{t.title}</div>
              {t.dueAt && <div style={{ fontSize: 12, color: "var(--clay-text-muted)" }}>{new Date(t.dueAt).toLocaleString()}</div>}
            </div>
            <button onClick={() => remove(t.id)} style={{ border: "none", background: "transparent", color: "var(--clay-text-muted)", cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
      <QuickAsk onAsk={(q) => useChat.getState().send(q)} />
    </ClayCard>
  );
}

function QuickAsk({ onAsk }: { onAsk: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <ClayInput placeholder="Or just ask JARVIS…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (onAsk(q), setQ(""))} />
      <ClayButton variant="ghost" onClick={() => (onAsk(q), setQ(""))}>Ask</ClayButton>
    </div>
  );
}
