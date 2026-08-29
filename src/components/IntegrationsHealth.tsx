import React, { useEffect } from "react";
import { ClayCard, ClayBadge, ClayButton } from "../design-system";
import { useIntegrations } from "../store/integrations";

export function IntegrationsHealth() {
  const { adapters, load, reconnect, authorize } = useIntegrations();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ClayCard eyebrow="07 · Sources / Health">
      <div className="console-row" style={{ justifyContent: "space-between" }}>
        <span className="console-meta">live health monitor</span>
        <button className="console-delete" onClick={load} title="Refresh">⟳</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {adapters.map((a) => (
          <div key={a.id} className="console-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong className="console-meta" style={{ fontSize: 12, color: "var(--console-text)" }}>{a.label}</strong>
              <ClayBadge status={a.status}>{a.status}</ClayBadge>
            </div>
            <p className="console-meta" style={{ margin: 0 }}>{a.description}</p>
            {a.lastSyncAt && (
              <div className="console-meta">last sync {new Date(a.lastSyncAt).toLocaleTimeString()}</div>
            )}
            {a.errorMessage && a.status === "dead" && (
              <div className="console-meta" style={{ color: "var(--console-red)" }}>! {a.errorMessage}</div>
            )}
            {!a.category && (
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {a.status === "unauthenticated" || a.status === "dead" ? (
                  <ClayButton variant="accent" onClick={() => authorize(a.id)}>Authorize</ClayButton>
                ) : (
                  <ClayButton variant="ghost" onClick={() => reconnect(a.id)}>Reconnect</ClayButton>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ClayCard>
  );
}