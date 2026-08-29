import React, { useEffect } from "react";
import { ClayCard, ClayToggle, ClayButton, ClayBadge } from "../design-system";
import { useFocus } from "../store/focus";

export function FocusGuardian() {
  const { on, mode, suppressedCount, queue, isFullscreen, isDND, load, toggle, flush } = useFocus();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ClayCard eyebrow="04 · Focus Guardian">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--console-text-muted)" }}>
            Suppresses notifications while you study and queues them for recap.
          </p>
          {isFullscreen && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--console-text-muted)" }}>
              fullscreen detected
            </p>
          )}
          {isDND && !isFullscreen && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--console-text-muted)" }}>
              outside active hours
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ClayBadge status={on ? "healthy" : "unauthenticated"}>
            {on ? "guarding" : "off"}
          </ClayBadge>
          <ClayToggle on={on} onChange={() => toggle(!on)} />
        </div>
      </div>

      {on && (
        <div style={{ marginTop: 14 }}>
          <div className="console-row" style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: 12 }}>MODE</span>
            <span style={{ fontSize: 12 }}>{mode}</span>
          </div>
          <div className="console-row" style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: 12 }}>SUPPRESSED NOTIFICATIONS</span>
            <strong style={{ fontSize: 14 }}>{suppressedCount}</strong>
          </div>

          {queue.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="console-eyebrow" style={{ marginBottom: 6 }}>
                queued
              </div>
              {queue.map((n) => (
                <div key={n.id} className="console-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <strong style={{ fontSize: 12 }}>{n.title}</strong>
                  <span style={{ fontSize: 11, color: "var(--console-text-muted)" }}>{n.body}</span>
                  <span style={{ fontSize: 10, color: "var(--console-text-muted)" }}>
                    {new Date(n.queuedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <ClayButton variant="accent" onClick={flush}>
                  Flush queue ({queue.length})
                </ClayButton>
              </div>
            </div>
          )}

          {queue.length === 0 && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--console-text-muted)" }}>
              No notifications suppressed yet. Anything silenced while guarding lands here for review.
            </p>
          )}
        </div>
      )}
    </ClayCard>
  );
}