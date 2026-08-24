import React from "react";
import "./orb.css";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export function AssistantOrb({
  state = "idle",
  size = 96,
  onActivate
}: {
  state?: OrbState;
  size?: number;
  onActivate?: () => void;
}) {
  return (
    <div
      className={`orb orb--${state}`}
      style={{ width: size, height: size }}
      onClick={onActivate}
      role="button"
      aria-label="JARVIS assistant orb"
    >
      <div className="orb__core" />
      <div className="orb__ring" />
      <div className="orb__pulse" />
    </div>
  );
}
