import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .expression-settings-panel {
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

  .expression-settings-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .expression-settings-heading {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4effd8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin: 0 0 4px 0;
    opacity: 0.8;
  }

  .expression-settings-toggle {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 22px;
    border-radius: 20px;
    background: rgba(136, 102, 255, 0.04);
    border: 1px solid rgba(136, 102, 255, 0.08);
    transition: all 0.3s ease;
  }

  .expression-settings-toggle:hover {
    background: rgba(136, 102, 255, 0.06);
    border-color: rgba(136, 102, 255, 0.15);
  }

  .expression-settings-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 20px;
    height: 20px;
    accent-color: #4effd8;
  }

  .expression-settings-toggle-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .expression-settings-toggle-main {
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.95rem;
  }

  .expression-settings-toggle-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .expression-settings-mode {
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .expression-settings-mode-title {
    font-weight: 500;
    color: #4effd8;
    margin: 0;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.9;
  }

  .expression-settings-mode-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 16px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .expression-settings-mode-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .expression-settings-mode-label-main {
    font-size: 0.85rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }

  .expression-settings-mode-label-hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .expression-settings-input {
    width: 72px;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.4);
    color: #4effd8;
    font-family: "JetBrains Mono", monospace;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s ease;
  }

  .expression-settings-input:focus {
    outline: none;
    border-color: rgba(78, 255, 216, 0.4);
    box-shadow: 0 0 15px rgba(78, 255, 216, 0.15);
  }

  .expression-settings-slider {
    flex: 1;
    max-width: 140px;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    -webkit-appearance: none;
    appearance: none;
    outline: none;
  }

  .expression-settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4effd8;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(78, 255, 216, 0.5);
    border: 2px solid #fff;
  }

  .expression-settings-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .expression-settings-button {
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

  .expression-settings-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .expression-settings-button.primary {
    background: linear-gradient(135deg, rgba(78, 255, 216, 0.2), rgba(136, 102, 255, 0.2));
    border-color: rgba(78, 255, 216, 0.3);
    color: #4effd8;
    box-shadow: 0 0 25px rgba(78, 255, 216, 0.15);
  }

  .expression-settings-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .expression-settings-status {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
    padding-top: 8px;
    font-family: "JetBrains Mono", monospace;
  }
`;

export default function ExpressionSamplingSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setError(null);
      const response = await authFetch("/settings/expression-sampling");
      if (!response.ok) throw new Error("HTTP " + response.status + ": Failed to load expression settings");
      const data = await response.json();
      setConfig(data);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to load expression sampling:", error);
      setError(error.message);
      onStatus?.({
        type: "error",
        message: "Failed to load expression settings: " + error.message,
      });
    }
  };

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

  if (error) {
    return (
      <div className="expression-settings-panel" style={{ color: "#ff9999", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>⚠️ {error}</div>
        <button className="expression-settings-button" onClick={loadConfig}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div className="expression-settings-panel" style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading expression sampling settings...</div>;
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
                <span style={{ minWidth: 40, textAlign: "right", fontWeight: 500, fontSize: "0.8rem", color: "#4effd8", fontFamily: "JetBrains Mono, monospace" }}>
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
