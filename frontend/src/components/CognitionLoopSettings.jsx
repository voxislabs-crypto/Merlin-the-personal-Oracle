import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .cognition-settings-panel {
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

  .cognition-settings-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .cognition-settings-heading {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4effd8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin: 0 0 4px 0;
    opacity: 0.8;
  }

  .cognition-settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .cognition-settings-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .cognition-settings-label {
    font-size: 0.85rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }

  .cognition-settings-hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .cognition-settings-input {
    margin-top: 4px;
    padding: 10px 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    color: #4effd8;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }

  .cognition-settings-input:focus {
    outline: none;
    border-color: rgba(78, 255, 216, 0.4);
    box-shadow: 0 0 15px rgba(78, 255, 216, 0.15);
  }

  .cognition-settings-toggle {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 22px;
    border-radius: 20px;
    background: rgba(136, 102, 255, 0.04);
    border: 1px solid rgba(136, 102, 255, 0.08);
    transition: all 0.3s ease;
  }

  .cognition-settings-toggle:hover {
    background: rgba(136, 102, 255, 0.06);
    border-color: rgba(136, 102, 255, 0.15);
  }

  .cognition-settings-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 20px;
    height: 20px;
    accent-color: #4effd8;
  }

  .cognition-settings-toggle-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cognition-settings-toggle-main {
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.95rem;
  }

  .cognition-settings-toggle-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .cognition-settings-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .cognition-settings-button {
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

  .cognition-settings-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .cognition-settings-button.primary {
    background: linear-gradient(135deg, rgba(78, 255, 216, 0.2), rgba(136, 102, 255, 0.2));
    border-color: rgba(78, 255, 216, 0.3);
    color: #4effd8;
    box-shadow: 0 0 25px rgba(78, 255, 216, 0.15);
  }

  .cognition-settings-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .cognition-settings-status {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
    padding-top: 8px;
    font-family: "JetBrains Mono", monospace;
  }
`;

export default function CognitionLoopSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setError(null);
      const response = await authFetch("/settings/cognition-loop");
      if (!response.ok) throw new Error("HTTP " + response.status + ": Failed to load cognition settings");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load cognition settings:", error);
      setError(error.message);
      onStatus?.({
        type: "error",
        message: "Failed to load cognition settings: " + error.message,
      });
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const response = await authFetch("/settings/cognition-loop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error("Failed to save cognition loop settings");
      const updated = await response.json();
      setConfig(updated);
      onStatus?.({
        type: "success",
        message: "Cognition loop settings saved.",
      });
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to save: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadConfig();
  };

  if (error) {
    return (
      <div className="cognition-settings-panel" style={{ color: "#ff9999", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>⚠️ {error}</div>
        <button className="cognition-settings-button" onClick={loadConfig}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div className="cognition-settings-panel" style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading cognition loop settings...</div>;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="cognition-settings-panel">
        <div className="cognition-settings-section">
          <h3 className="cognition-settings-heading">Core Settings</h3>

          <label className="cognition-settings-toggle">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            <div className="cognition-settings-toggle-label">
              <div className="cognition-settings-toggle-main">Enable Cognition Loop</div>
              <div className="cognition-settings-toggle-hint">
                Master toggle for background personality reflection
              </div>
            </div>
          </label>

          <label className="cognition-settings-toggle">
            <input
              type="checkbox"
              checked={config.autonomousDecisionEnabled}
              onChange={(e) => setConfig({ ...config, autonomousDecisionEnabled: e.target.checked })}
            />
            <div className="cognition-settings-toggle-label">
              <div className="cognition-settings-toggle-main">Autonomous Decision Mode</div>
              <div className="cognition-settings-toggle-hint">
                Personality chooses SILENT/THINK/REACH_OUT instead of always reflecting
              </div>
            </div>
          </label>

          <div className="cognition-settings-grid">
            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Interval (minutes)</label>
              <span className="cognition-settings-hint">How often the loop runs (5-180)</span>
              <input
                type="number"
                min="5"
                max="180"
                value={config.intervalMinutes}
                onChange={(e) => setConfig({ ...config, intervalMinutes: parseInt(e.target.value) || 15 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Max Personalities Per Run</label>
              <span className="cognition-settings-hint">Personalities processed per cycle (1-25)</span>
              <input
                type="number"
                min="1"
                max="25"
                value={config.maxPersonalitiesPerRun}
                onChange={(e) => setConfig({ ...config, maxPersonalitiesPerRun: parseInt(e.target.value) || 8 })}
                className="cognition-settings-input"
              />
            </div>
          </div>
        </div>

        <div className="cognition-settings-section">
          <h3 className="cognition-settings-heading">Memory & Context</h3>

          <div className="cognition-settings-grid">
            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Recent Messages Window</label>
              <span className="cognition-settings-hint">Messages to consider (4-20)</span>
              <input
                type="number"
                min="4"
                max="20"
                value={config.recentMessagesWindow}
                onChange={(e) => setConfig({ ...config, recentMessagesWindow: parseInt(e.target.value) || 8 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Memory Context Limit</label>
              <span className="cognition-settings-hint">Memory facts to retrieve (3-20)</span>
              <input
                type="number"
                min="3"
                max="20"
                value={config.memoryContextLimit}
                onChange={(e) => setConfig({ ...config, memoryContextLimit: parseInt(e.target.value) || 8 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Max New Goals Per Run</label>
              <span className="cognition-settings-hint">Goals to add per cycle (0-3)</span>
              <input
                type="number"
                min="0"
                max="3"
                value={config.maxNewGoalsPerRun}
                onChange={(e) => setConfig({ ...config, maxNewGoalsPerRun: parseInt(e.target.value) || 1 })}
                className="cognition-settings-input"
              />
            </div>
          </div>
        </div>

        <div className="cognition-settings-section">
          <h3 className="cognition-settings-heading">Reach-Out Delivery</h3>

          <label className="cognition-settings-toggle">
            <input
              type="checkbox"
              checked={config.deliveryEnabled}
              onChange={(e) => setConfig({ ...config, deliveryEnabled: e.target.checked })}
            />
            <div className="cognition-settings-toggle-label">
              <div className="cognition-settings-toggle-main">Enable Reach-Out Delivery</div>
              <div className="cognition-settings-toggle-hint">
                Allow personalities to proactively message users
              </div>
            </div>
          </label>

          <div className="cognition-settings-grid">
            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Inactivity Hours for Reach-Out</label>
              <span className="cognition-settings-hint">Hours of silence before outreach (6-168)</span>
              <input
                type="number"
                min="6"
                max="168"
                value={config.inactivityHoursForReachOut}
                onChange={(e) => setConfig({ ...config, inactivityHoursForReachOut: parseFloat(e.target.value) || 24 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Delivery Min Interval (minutes)</label>
              <span className="cognition-settings-hint">Minimum time between messages (2-240)</span>
              <input
                type="number"
                min="2"
                max="240"
                value={config.deliveryMinIntervalMinutes}
                onChange={(e) => setConfig({ ...config, deliveryMinIntervalMinutes: parseInt(e.target.value) || 10 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Delivery Max Per Hour</label>
              <span className="cognition-settings-hint">Maximum messages per hour (1-12)</span>
              <input
                type="number"
                min="1"
                max="12"
                value={config.deliveryMaxPerHour}
                onChange={(e) => setConfig({ ...config, deliveryMaxPerHour: parseInt(e.target.value) || 2 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Delivery Priority Threshold</label>
              <span className="cognition-settings-hint">Minimum curiosity score (0.4-0.95)</span>
              <input
                type="number"
                min="0.4"
                max="0.95"
                step="0.05"
                value={config.deliveryPriorityThreshold}
                onChange={(e) => setConfig({ ...config, deliveryPriorityThreshold: parseFloat(e.target.value) || 0.6 })}
                className="cognition-settings-input"
              />
            </div>
          </div>
        </div>

        <div className="cognition-settings-section">
          <h3 className="cognition-settings-heading">Quiet Hours & Guardrails</h3>

          <label className="cognition-settings-toggle">
            <input
              type="checkbox"
              checked={config.quietHoursEnabled}
              onChange={(e) => setConfig({ ...config, quietHoursEnabled: e.target.checked })}
            />
            <div className="cognition-settings-toggle-label">
              <div className="cognition-settings-toggle-main">Enable Quiet Hours</div>
              <div className="cognition-settings-toggle-hint">
                Suppress reach-out during specified hours
              </div>
            </div>
          </label>

          <div className="cognition-settings-grid">
            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Quiet Hours Start (0-23)</label>
              <span className="cognition-settings-hint">Hour when quiet period begins</span>
              <input
                type="number"
                min="0"
                max="23"
                value={config.quietHoursStartHour}
                onChange={(e) => setConfig({ ...config, quietHoursStartHour: parseInt(e.target.value) || 1 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Quiet Hours End (0-23)</label>
              <span className="cognition-settings-hint">Hour when quiet period ends</span>
              <input
                type="number"
                min="0"
                max="23"
                value={config.quietHoursEndHour}
                onChange={(e) => setConfig({ ...config, quietHoursEndHour: parseInt(e.target.value) || 7 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Startup Grace (minutes)</label>
              <span className="cognition-settings-hint">Delay before first reach-out (0-120)</span>
              <input
                type="number"
                min="0"
                max="120"
                value={config.startupGraceMinutes}
                onChange={(e) => setConfig({ ...config, startupGraceMinutes: parseInt(e.target.value) || 10 })}
                className="cognition-settings-input"
              />
            </div>

            <div className="cognition-settings-field">
              <label className="cognition-settings-label">Active User Window (minutes)</label>
              <span className="cognition-settings-hint">Recent activity blocks reach-out (1-30)</span>
              <input
                type="number"
                min="1"
                max="30"
                value={config.activeUserWindowMinutes}
                onChange={(e) => setConfig({ ...config, activeUserWindowMinutes: parseInt(e.target.value) || 2 })}
                className="cognition-settings-input"
              />
            </div>
          </div>
        </div>

        <div className="cognition-settings-actions">
          <button
            className="cognition-settings-button primary"
            onClick={saveConfig}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button
            className="cognition-settings-button"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset
          </button>
        </div>

        <div className="cognition-settings-status">
          Last updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "Never"}
        </div>
      </div>
    </>
  );
}
