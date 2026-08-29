import React from "react";
import "./design-system.css";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function ClayCard({
  pressed,
  large,
  eyebrow,
  children,
  ...rest
}: DivProps & { pressed?: boolean; large?: boolean; eyebrow?: string }) {
  const cls = [
    "console-card",
    pressed ? "console-card--pressed" : "",
    large ? "console-card--lg" : ""
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {eyebrow && <div className="console-eyebrow">{eyebrow}</div>}
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
  const cls = ["console-btn", variant !== "default" ? `console-btn--${variant}` : ""].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function ClayInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="console-input" {...props} />;
}

export function ClayToggle({
  on,
  onChange,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean; onChange: () => void }) {
  return (
    <button
      className={`console-toggle ${on ? "console-toggle--on" : ""}`}
      onClick={onChange}
      aria-pressed={on}
      {...rest}
    >
      <span className="console-toggle__knob" />
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
    <span className={`console-badge console-badge--${status}`}>
      <span className="console-badge__dot" />
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
    <div className="console-modal__backdrop" onClick={onClose}>
      <div className="console-modal__panel" onClick={(e) => e.stopPropagation()}>
        {title && <h3 style={{ margin: "0 0 16px", color: "var(--console-text)" }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
