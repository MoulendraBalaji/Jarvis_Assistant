import React from "react";
import "./design-system.css";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function ClayCard({
  pressed,
  large,
  children,
  ...rest
}: DivProps & { pressed?: boolean; large?: boolean }) {
  const cls = [
    "clay-card",
    pressed ? "clay-card--pressed" : "",
    large ? "clay-card--lg" : ""
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export function ClayButton({
  variant = "default",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "accent" | "ghost";
}) {
  const cls = ["clay-btn", variant !== "default" ? `clay-btn--${variant}` : ""].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function ClayInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="clay-input" {...props} />;
}

export function ClayToggle({
  on,
  onChange,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean; onChange: () => void }) {
  return (
    <button
      className={`clay-toggle ${on ? "clay-toggle--on" : ""}`}
      onClick={onChange}
      aria-pressed={on}
      {...rest}
    >
      <span className="clay-toggle__knob" />
    </button>
  );
}

export function ClayBadge({
  status,
  children
}: {
  status: "healthy" | "degraded" | "dead" | "unauthenticated";
  children: React.ReactNode;
}) {
  return (
    <span className={`clay-badge clay-badge--${status}`}>
      <span className="clay-badge__dot" />
      {children}
    </span>
  );
}

export function ClayModal({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="clay-modal__backdrop" onClick={onClose}>
      <div className="clay-modal__panel" onClick={(e) => e.stopPropagation()}>
        {title && <h3 style={{ margin: "0 0 16px", color: "var(--clay-text)" }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
