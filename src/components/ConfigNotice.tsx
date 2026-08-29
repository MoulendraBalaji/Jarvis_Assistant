import React, { useEffect } from "react";
import { useIntegrations } from "../store/integrations";
import { AdapterState } from "../../shared/types";

export function ConfigNotice() {
  const { adapters, load } = useIntegrations();

  useEffect(() => {
    load();
  }, [load]);

  const envRow = adapters.find((a: AdapterState) => a.id === "env");
  if (!envRow || envRow.status === "healthy") return null;

  const detail = envRow.description.replace(/See .env.example for details\.?$/, "").trim();

  return (
    <div className="console-config-notice" role="status">
      <span className="console-config-notice__tag">CONFIG</span>
      <span className="console-config-notice__text">
        {detail || "Some AI service keys are not configured."}
      </span>
      <span className="console-config-notice__hint">set them in .env — see Sources</span>
    </div>
  );
}