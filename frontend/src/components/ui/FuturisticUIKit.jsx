import { useMemo, useState } from "react";

import "../../styles/futuristic-ui-kit.css";

export function FuturisticButton({ children, variant = "primary", className = "", ...props }) {
  const variantClass = variant === "secondary" ? "secondary" : variant === "ghost" ? "ghost" : "";
  return (
    <button type="button" className={`futuristic-btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function FuturisticCard({ title, children, className = "" }) {
  return (
    <article className={`futuristic-card holo-border ${className}`.trim()}>
      {title ? <h3 className="heading-fx" style={{ marginTop: 0 }}>{title}</h3> : null}
      {children}
    </article>
  );
}

export function FuturisticPopup({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="futuristic-popup-backdrop" role="dialog" aria-modal="true" aria-label={title || "Popup"}>
      <section className="futuristic-popup holo-border scanline">
        <header className="futuristic-popup-header">
          <strong className="heading-fx neon-text-cyan">{title || "System Notice"}</strong>
          <button type="button" className="popup-close-btn" onClick={onClose} aria-label="Close popup">
            X
          </button>
        </header>
        <div style={{ padding: "16px" }}>{children}</div>
      </section>
    </div>
  );
}

export function FuturisticTabs({ tabs, active, onChange }) {
  return (
    <div className="futuristic-tab-list">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`futuristic-tab ${active === tab.id ? "active" : ""}`.trim()}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function FuturisticPanel({ title, children, className = "" }) {
  return (
    <section className={`futuristic-panel scanline ${className}`.trim()}>
      {title ? (
        <header className="futuristic-panel-header">
          <strong className="heading-fx neon-text-cyan">{title}</strong>
        </header>
      ) : null}
      <div style={{ padding: "14px" }}>{children}</div>
    </section>
  );
}

export function FuturisticInput({ label, id, ...props }) {
  return (
    <label htmlFor={id} style={{ display: "grid", gap: "6px" }}>
      {label ? <span style={{ fontSize: "0.82rem", color: "var(--fx-muted)" }}>{label}</span> : null}
      <input id={id} className="futuristic-input" {...props} />
    </label>
  );
}

export function FuturisticToggle({ checked, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button
        type="button"
        className={`futuristic-toggle ${checked ? "on" : ""}`.trim()}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      />
      {label ? <span style={{ color: "var(--fx-muted)", fontSize: "0.85rem" }}>{label}</span> : null}
    </div>
  );
}

export function FuturisticBadge({ children, className = "" }) {
  return <span className={`futuristic-badge pulse-glow ${className}`.trim()}>{children}</span>;
}

export function FuturisticProgress({ value = 0 }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="futuristic-progress" aria-label={`Progress ${width}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={width}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

export function FuturisticOrb({ status = "neutral", small = false }) {
  const statusClass = status === "positive" || status === "warning" || status === "critical" ? status : "";
  return <div className={`futuristic-orb ${statusClass} ${small ? "small" : ""}`.trim()} aria-hidden="true" />;
}

export function FuturisticUIKitExamples() {
  const [activeTab, setActiveTab] = useState("brain");
  const [openPopup, setOpenPopup] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const tabs = useMemo(
    () => [
      { id: "brain", label: "Brain" },
      { id: "chat", label: "Chat" },
      { id: "voice", label: "Voice" },
    ],
    [],
  );

  return (
    <section className="voxis-futuristic-root" style={{ display: "grid", gap: "14px", padding: "16px", borderRadius: "20px" }}>
      <FuturisticPanel title="Brain Tab Header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <h2 className="heading-fx neon-text-cyan" style={{ margin: "0 0 8px" }}>Neural Core Telemetry</h2>
            <FuturisticTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          </div>
          <FuturisticOrb status="positive" />
        </div>
      </FuturisticPanel>

      <FuturisticCard title="Personality Card" className="data-stream">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "var(--fx-muted)" }}>Persona</p>
            <strong className="heading-fx" style={{ fontSize: "1.1rem" }}>Nova Strategist</strong>
          </div>
          <FuturisticBadge>Stable</FuturisticBadge>
        </div>
        <div style={{ marginTop: "12px" }}>
          <FuturisticProgress value={72} />
        </div>
      </FuturisticCard>

      <FuturisticPanel title="Live Mood Orb">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FuturisticOrb status="warning" />
          <div>
            <strong>Arousal Spike</strong>
            <p style={{ margin: 0, color: "var(--fx-muted)" }}>Shift to calm prosody profile suggested.</p>
          </div>
        </div>
      </FuturisticPanel>

      <FuturisticPanel title="Fading Confirmation Popup">
        <div style={{ display: "grid", gap: "10px", maxWidth: "320px" }}>
          <FuturisticInput id="persona-name" label="Persona Name" placeholder="Type alias" />
          <FuturisticToggle checked={voiceEnabled} onChange={setVoiceEnabled} label="Voice playback enabled" />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <FuturisticButton onClick={() => setOpenPopup(true)}>Save Persona</FuturisticButton>
            <FuturisticButton variant="ghost">Cancel</FuturisticButton>
          </div>
        </div>
      </FuturisticPanel>

      <FuturisticPopup open={openPopup} title="Profile Updated" onClose={() => setOpenPopup(false)}>
        <p style={{ marginTop: 0 }}>Your voice routing and neural preferences were synced to runtime settings.</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <FuturisticButton variant="secondary" onClick={() => setOpenPopup(false)}>
            Acknowledge
          </FuturisticButton>
        </div>
      </FuturisticPopup>
    </section>
  );
}
