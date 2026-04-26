import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .expression-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 20px;
    border-radius: 12px;
    background: rgba(6, 14, 28, 0.88);
    border: 1px solid rgba(0, 180, 255, 0.12);
  }

  .expression-settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .expression-settings-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .expression-settings-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.06);
    border: 1px solid rgba(0, 180, 255, 0.12);
  }

  .expression-settings-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .expression-settings-toggle-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .expression-settings-toggle-main {
    font-weight: 600;
    color: var(--text);
    font-size: 0.9rem;
  }

  .expression-settings-toggle-hint {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .expression-settings-mode {
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 8px;
    padding: 16px;
    background: rgba(0, 180, 255, 0.02);
  }

  .expression-settings-mode-title {
    font-weight: 700;
    color: var(--text);
    margin: 0 0 12px 0;
    font-size: 0.9rem;
    text-transform: capitalize;
  }

  .expression-settings-mode-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    padding: 10px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.2);
  }

  .expression-settings-mode-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .expression-settings-mode-label-main {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
  }

  .expression-settings-mode-label-hint {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .expression-settings-input {
    width: 80px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    background: rgba(0, 180, 255, 0.04);
    color: var(--text);
    font-weight: 600;
    text-align: center;
  }

  .expression-settings-slider {
    flex: 1;
    max-width: 120px;
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

  .expression-settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: 0 0 6px rgba(0, 180, 255, 0.5);
  }

  .expression-settings-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 6px rgba(0, 180, 255, 0.5);
  }

  .expression-settings-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .expression-settings-button {
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

  .expression-settings-button:hover {
    background: rgba(0, 180, 255, 0.15);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.25);
  }

  .expression-settings-button.primary {
    background: rgba(0, 180, 255, 0.2);
    border-color: rgba(0, 180, 255, 0.5);
  }

  .expression-settings-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .expression-settings-status {
    font-size: 0.8rem;
    color: var(--muted);
    padding-top: 8px;
  }
`;

export default function ExpressionSamplingSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const response = await authFetch("/settings/expression-sampling");
      if (!response.ok) throw new Error("Failed to load expression sampling settings");
      const data = await response.json();
      setConfig(data);
      setIsDirty(false);
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to load expression settings: ${error.message}`,
      });
    }
  }

  async function saveConfig() {
    if (!config) return;
    setIsSaving(true);
    try {
      const response = await authFetch("/settings/expression-sampling", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error("Failed to save expression sampling settings");
      const updated = await response.json();
      setConfig(updated);
      setIsDirty(false);
      onStatus?.({
        type: "success",
        message: "Expression sampling settings saved.",
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
    return <div className="expression-settings-panel">Loading expression sampling settings...</div>;
  }

  const handleGlobalToggle = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const handleModeToggle = (mode) => {
    setConfig((prev) => ({
      ...prev,
      modeProfiles: {
        ...prev.modeProfiles,
        [mode]: {
          ...prev.modeProfiles[mode],
          enabled: !prev.modeProfiles[mode].enabled,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleModeChange = (mode, key, value) => {
    setConfig((prev) => ({
      ...prev,
      modeProfiles: {
        ...prev.modeProfiles,
        [mode]: {
          ...prev.modeProfiles[mode],
          [key]: value,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleReset = () => {
    loadConfig();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="expression-settings-panel">
        <div className="expression-settings-section">
          <h3 className="expression-settings-heading">Global Settings</h3>

          <label className="expression-settings-toggle">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={() => handleGlobalToggle("enabled")}
            />
            <div className="expression-settings-toggle-label">
              <div className="expression-settings-toggle-main">Enable Expression Sampling</div>
              <div className="expression-settings-toggle-hint">
                Master toggle for phrase variation layer
              </div>
            </div>
          </label>

          <label className="expression-settings-toggle">
            <input
              type="checkbox"
              checked={config.deterministicSeed}
              onChange={() => handleGlobalToggle("deterministicSeed")}
            />
            <div className="expression-settings-toggle-label">
              <div className="expression-settings-toggle-main">Deterministic Seed</div>
              <div className="expression-settings-toggle-hint">
                Reproducible replies for same input; disable for randomness
              </div>
            </div>
          </label>
        </div>

        <div className="expression-settings-section">
          <h3 className="expression-settings-heading">Mode-Specific Profiles</h3>

          {Object.entries(config.modeProfiles).map(([mode, profile]) => (
            <div key={mode} className="expression-settings-mode">
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={profile.enabled}
                  onChange={() => handleModeToggle(mode)}
                  style={{ cursor: "pointer" }}
                />
                <h4 className="expression-settings-mode-title" style={{ margin: 0 }}>
                  {mode} Mode
                </h4>
              </label>

              <div className="expression-settings-mode-control">
                <div className="expression-settings-mode-label">
                  <div className="expression-settings-mode-label-main">Top-K Candidates</div>
                  <div className="expression-settings-mode-label-hint">
                    Pool size for selection (1–6)
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={profile.topK}
                  onChange={(e) => handleModeChange(mode, "topK", Math.round(Number(e.target.value)))}
                  className="expression-settings-input"
                  disabled={!profile.enabled}
                />
              </div>

              <div className="expression-settings-mode-control">
                <div className="expression-settings-mode-label">
                  <div className="expression-settings-mode-label-main">Temperature</div>
                  <div className="expression-settings-mode-label-hint">
                    Randomness of selection (0.05–1.2)
                  </div>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.2"
                  step="0.05"
                  value={profile.temperature}
                  onChange={(e) =>
                    handleModeChange(mode, "temperature", Number(e.target.value))
                  }
                  className="expression-settings-slider"
                  disabled={!profile.enabled}
                />
                <span style={{ minWidth: 40, textAlign: "right", fontWeight: 600, fontSize: "0.85rem", color: "#00f5ff" }}>
                  {profile.temperature.toFixed(2)}
                </span>
              </div>

              <div className="expression-settings-mode-control">
                <div className="expression-settings-mode-label">
                  <div className="expression-settings-mode-label-main">Max Replacements</div>
                  <div className="expression-settings-mode-label-hint">
                    Phrases to vary per response (0–3)
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={profile.maxReplacements}
                  onChange={(e) =>
                    handleModeChange(mode, "maxReplacements", Math.round(Number(e.target.value)))
                  }
                  className="expression-settings-input"
                  disabled={!profile.enabled}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="expression-settings-actions">
          <button
            className="expression-settings-button primary"
            onClick={saveConfig}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="expression-settings-button"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
          >
            Reset
          </button>
        </div>

        {config.updatedAt && (
          <div className="expression-settings-status">
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </>
  );
}
