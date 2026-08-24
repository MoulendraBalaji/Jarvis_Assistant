import React, { useEffect, useState } from "react";
import { ClayCard } from "../design-system";
import { jarvis } from "../lib/jarvis";
import { Assignment } from "../../shared/types";

export function AssignmentFeed() {
  const [items, setItems] = useState<Assignment[]>([]);

  useEffect(() => {
    const load = async () => {
      const raw = (await jarvis.briefing.generate()) as any[];
      setItems(raw.filter((r) => r.kind === "assignment").map((r) => ({ id: r.title, course: "", title: r.title, dueAt: r.dueAt, link: "", state: "", syncedAt: 0 })));
    };
    load();
  }, []);

  return (
    <ClayCard>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Classroom</h3>
      {items.length === 0 ? (
        <p style={{ color: "var(--clay-text-muted)", fontSize: 13 }}>
          Connect Google Classroom in Integrations to load live coursework.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((a) => (
            <div key={a.id} style={{ fontSize: 13, padding: "8px 12px", borderRadius: 14, boxShadow: "var(--clay-shadow-raised-sm)" }}>
              {a.title}
              {a.dueAt && <span style={{ color: "var(--clay-text-muted)" }}> · due {new Date(a.dueAt).toLocaleDateString()}</span>}
            </div>
          ))}
        </div>
      )}
    </ClayCard>
  );
}
