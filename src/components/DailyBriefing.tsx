import React, { useEffect, useState } from "react";
import { ClayCard, ClayButton } from "../design-system";
import { jarvis } from "../lib/jarvis";
import { BriefingItem } from "../../shared/types";

export function DailyBriefing() {
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = (await jarvis.briefing.generate()) as BriefingItem[];
    setItems(res);
    setLoading(false);
  };

  useEffect(() => {
    generate();
  }, []);

  return (
    <ClayCard large>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Daily Briefing</h2>
        <ClayButton variant="ghost" onClick={generate} disabled={loading}>
          {loading ? "…" : "Regenerate"}
        </ClayButton>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "var(--clay-text-muted)", fontSize: 13 }}>
          Nothing queued yet. Add tasks or connect Classroom to build your morning summary.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i, idx) => (
            <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderRadius: 16, boxShadow: "var(--clay-shadow-raised-sm)" }}>
              <span style={{ fontSize: 18 }}>{i.kind === "assignment" ? "📚" : "✅"}</span>
              <div style={{ flex: 1, fontSize: 14 }}>{i.title}</div>
              {i.dueAt && <span style={{ fontSize: 12, color: "var(--clay-text-muted)" }}>{new Date(i.dueAt).toLocaleDateString()}</span>}
            </div>
          ))}
        </div>
      )}
    </ClayCard>
  );
}
