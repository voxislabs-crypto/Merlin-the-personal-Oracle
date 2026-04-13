import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .mood-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 20px;
    border-radius: 12px;
    background: rgba(6, 14, 28, 0.88);
    border: 1px solid rgba(0, 180, 255, 0.12);
  }

  .mood-settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mood-settings-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .mood-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .mood-settings-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mood-settings-label-main {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
  }

  .mood-settings-label-hint {
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.4;
  }

  .mood-settings-control {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mood-settings-slider {
    width: 140px;
    height: 5px;
    border-radius: 8px;
    background: linear-gradient(
      to right,
      rgba(0, 180, 255, 0.2),
      rgba(0, 180, 255, 0.4)
    );
    -webkit-appearance: none;
    appearance: none;
    outline: none;
  }

  .mood-settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.6);
  }

  .mood-settings-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.6);
  }

  .mood-settings-value {
    min-width: 50px;
    text-align: right;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--accent);
  }

  .mood-settings-recovery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .mood-settings-recovery-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mood-settings-recovery-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    text-transform: capitalize;
  }

  .mood-settings-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .mood-settings-button {
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    background: rgba(0, 180, 255, 0.08);
    color: var(--accent);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .mood-settings-button:hover {
    background: rgba(0, 180, 255, 0.15);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.25);
  }

  .mood-settings-button.primary {
    background: rgba(0, 180, 255, 0.2);
    border-color: rgba(0, 180, 255, 0.5);
  }

  .mood-settings-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mood-settings-status {
    font-size: 0.8rem;
    color: var(--muted);
    padding-top: 8px;
  }
`;

export default function MoodRuntimeSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const response = await authFetch("/settings/mood-runtime");
      if (!response.ok) throw new Error("Failed to load mood settings");
      const data = await response.json();
      setConfig(data);
      setIsDirty(false);
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to load mood settings: ${error.message}`,
      });
    }
  }

  async function saveConfig() {
    if (!config) return;
    setIsSaving(true);
    try {
      const response = await authFetch("/settings/mood-runtime", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error("Failed to save mood settings");
      const updated = await response.json();
      setConfig(updated);
      setIsDirty(false);
      onStatus?.({
        type: "success",
        message: "Mood runtime settings saved.",
      });
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to save: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!config) {
    return <div className="mood-settings-panel">Loading mood settings...</div>;
  }

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleRecoveryChange = (archetype, value) => {
    setConfig((prev) => ({
      ...prev,
      recoveryCurves: { ...prev.recoveryCurves, [archetype]: value },
    }));
    setIsDirty(true);
  };

  const handleReset = () => {
    loadConfig();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="mood-settings-panel">
        <div className="mood-settings-section">
          <h3 className="mood-settings-heading">Core Dynamics</h3>

          <div className="mood-settings-row">
            <div className="mood-settings-label">
              <div className="mood-settings-label-main">Inertia (Mood Stickiness)</div>
              <div className="mood-settings-label-hint">
                Higher = mood resists change, stays consistent longer (0.5–0.95)
              </div>
            </div>
            <div className="mood-settings-control">
              <input
                type="range"
                className="mood-settings-slider"
                min="0.5"
                max="0.95"
                step="0.01"
                value={config.inertia}
                onChange={(e) => handleChange("inertia", Number(e.target.value))}
              />
              <span className="mood-settings-value">{config.inertia.toFixed(2)}</span>
            </div>
          </div>

          <div className="mood-settings-row">
            <div className="mood-settings-label">
              <div className="mood-settings-label-main">Responsiveness (Sensitivity)</div>
              <div className="mood-settings-label-hint">
                Higher = mood reacts faster to user turns (0.05–0.5)
              </div>
            </div>
            <div className="mood-settings-control">
              <input
                type="range"
                className="mood-settings-slider"
                min="0.05"
                max="0.5"
                step="0.01"
                value={config.responsiveness}
                onChange={(e) => handleChange("responsiveness", Number(e.target.value))}
              />
              <span className="mood-settings-value">{config.responsiveness.toFixed(2)}</span>
            </div>
          </div>

          <div className="mood-settings-row">
            <div className="mood-settings-label">
              <div className="mood-settings-label-main">Per-Turn Delta Cap</div>
              <div className="mood-settings-label-hint">
                Max mood shift allowed in a single turn (0.2–0.8)
              </div>
            </div>
            <div className="mood-settings-control">
              <input
                type="range"
                className="mood-settings-slider"
                min="0.2"
                max="0.8"
                step="0.05"
                value={config.perTurnDeltaCap}
                onChange={(e) => handleChange("perTurnDeltaCap", Number(e.target.value))}
              />
              <span className="mood-settings-value">{config.perTurnDeltaCap.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mood-settings-section">
          <h3 className="mood-settings-heading">Recovery Curves by Archetype</h3>
          <div className="mood-settings-label-hint">
            How fast each archetype's mood returns to baseline between turns (0.01–0.25)
          </div>

          <div className="mood-settings-recovery-grid">
            {Object.entries(config.recoveryCurves).map(([archetype, value]) => (
              <div key={archetype} className="mood-settings-recovery-item">
                <label className="mood-settings-recovery-label">{archetype}</label>
                <input
                  type="range"
                  className="mood-settings-slider"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={value}
                  onChange={(e) => handleRecoveryChange(archetype, Number(e.target.value))}
                />
                <div className="mood-settings-value">{value.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mood-settings-actions">
          <button
            className="mood-settings-button primary"
            onClick={saveConfig}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="mood-settings-button"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
          >
            Reset
          </button>
        </div>

        {config.updatedAt && (
          <div className="mood-settings-status">
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </>
  );
}
