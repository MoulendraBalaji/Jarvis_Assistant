import React, { useEffect } from "react";
import { ClayCard, ClayBadge, ClayButton } from "../design-system";
import { useIntegrations } from "../store/integrations";

export function IntegrationsHealth() {
  const { adapters, load, reconnect, authorize } = useIntegrations();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ClayCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Integrations Health</h3>
        <button onClick={load} style={{ border: "none", background: "transparent", color: "var(--clay-text-muted)", cursor: "pointer", fontSize: 12 }}>refresh</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {adapters.map((a) => (
          <div key={a.id} style={{ padding: "12px 14px", borderRadius: 16, boxShadow: "var(--clay-shadow-raised-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 14 }}>{a.label}</strong>
              <ClayBadge status={a.status}>{a.status}</ClayBadge>
            </div>
            <p style={{ margin: "6px 0 10px", fontSize: 12, color: "var(--clay-text-muted)" }}>{a.description}</p>
            {a.lastSyncAt && (
              <div style={{ fontSize: 11, color: "var(--clay-text-muted)", marginBottom: 8 }}>
                last sync {new Date(a.lastSyncAt).toLocaleTimeString()}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {a.status === "unauthenticated" || a.status === "dead" ? (
                <ClayButton variant="accent" onClick={() => authorize(a.id)}>Authorize</ClayButton>
              ) : (
                <ClayButton variant="ghost" onClick={() => reconnect(a.id)}>Reconnect</ClayButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}
