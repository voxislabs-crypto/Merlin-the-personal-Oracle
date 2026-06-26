import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .mood-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 32px;
    border-radius: 28px;
    background: linear-gradient(170deg, rgba(0, 4, 14, 0.9), rgba(2, 5, 18, 0.85));
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(24px);
  }

  .mood-settings-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .mood-settings-heading {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4effd8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin: 0 0 4px 0;
    opacity: 0.8;
  }

  .mood-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 12px 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .mood-settings-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mood-settings-label-main {
    font-size: 0.9rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }

  .mood-settings-label-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .mood-settings-control {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .mood-settings-slider {
    width: 160px;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    transition: background 0.3s ease;
  }

  .mood-settings-slider:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .mood-settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4effd8;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(78, 255, 216, 0.5);
    border: 2px solid #fff;
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .mood-settings-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 20px rgba(78, 255, 216, 0.7);
  }

  .mood-settings-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4effd8;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 0 15px rgba(78, 255, 216, 0.5);
  }

  .mood-settings-value {
    min-width: 48px;
    text-align: right;
    font-size: 0.8rem;
    font-family: "JetBrains Mono", monospace;
    font-weight: 500;
    color: #4effd8;
    opacity: 0.9;
  }

  .mood-settings-recovery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }

  .mood-settings-recovery-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border-radius: 20px;
    background: rgba(136, 102, 255, 0.04);
    border: 1px solid rgba(136, 102, 255, 0.08);
  }

  .mood-settings-recovery-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .mood-settings-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .mood-settings-button {
    padding: 12px 24px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .mood-settings-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .mood-settings-button.primary {
    background: linear-gradient(135deg, rgba(78, 255, 216, 0.2), rgba(136, 102, 255, 0.2));
    border-color: rgba(78, 255, 216, 0.3);
    color: #4effd8;
    box-shadow: 0 0 25px rgba(78, 255, 216, 0.15);
  }

  .mood-settings-button.primary:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(78, 255, 216, 0.3), rgba(136, 102, 255, 0.3));
    border-color: rgba(78, 255, 216, 0.4);
    box-shadow: 0 0 40px rgba(78, 255, 216, 0.3);
  }

  .mood-settings-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .mood-settings-status {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
    padding-top: 8px;
    font-family: "JetBrains Mono", monospace;
  }
`;

export default function MoodRuntimeSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setError(null);
      const response = await authFetch("/settings/mood-runtime");
      if (!response.ok) throw new Error("HTTP " + response.status + ": Failed to load mood settings");
      const data = await response.json();
      setConfig(data);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to load mood settings:", error);
      setError(error.message);
      onStatus?.({
        type: "error",
        message: "Failed to load mood settings: " + error.message,
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
        message: "Failed to save: " + error.message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (error) {
    return (
      <div className="mood-settings-panel" style={{ color: "#ff9999", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>⚠️ {error}</div>
        <button className="mood-settings-button" onClick={loadConfig}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div className="mood-settings-panel" style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading mood settings...</div>;
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
