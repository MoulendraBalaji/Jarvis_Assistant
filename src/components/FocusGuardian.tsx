import React, { useState } from "react";
import { ClayCard, ClayToggle, ClayButton } from "../design-system";

export function FocusGuardian() {
  const [on, setOn] = useState(false);
  const [distractions, setDistractions] = useState(0);

  return (
    <ClayCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Focus Guardian</h3>
          <p style={{ margin: 0, fontSize: 12, color: "var(--clay-text-muted)" }}>
            Local-only. Watches focus switches during study blocks. Nothing leaves the device.
          </p>
        </div>
        <ClayToggle on={on} onChange={() => setOn((v) => !v)} />
      </div>
      {on && (
        <div style={{ marginTop: 14, fontSize: 13 }}>
          Focus mode active. {distractions} distraction nudges sent.
          <div style={{ marginTop: 10 }}>
            <ClayButton variant="ghost" onClick={() => setDistractions((d) => d + 1)}>Simulate nudge</ClayButton>
          </div>
        </div>
      )}
    </ClayCard>
  );
}
