import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .cognition-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 900px;
  }

  .cognition-settings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 12px;
    background: rgba(14, 22, 40, 0.6);
  }

  .cognition-settings-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .cognition-settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .cognition-settings-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cognition-settings-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
  }

  .cognition-settings-hint {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .cognition-settings-input {
    padding: 8px 10px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 6px;
    background: rgba(6, 10, 20, 0.8);
    color: var(--text);
    font-size: 0.85rem;
  }

  .cognition-settings-input:focus {
    outline: none;
    border-color: rgba(0, 180, 255, 0.5);
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.2);
  }

  .cognition-settings-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cognition-settings-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .cognition-settings-toggle-label {
    display: flex;
    flex-direction: column;
  }

  .cognition-settings-toggle-main {
    font-weight: 600;
    color: var(--text);
    font-size: 0.85rem;
  }

  .cognition-settings-toggle-hint {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .cognition-settings-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .cognition-settings-button {
    padding: 10px 18px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.1);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cognition-settings-button:hover {
    background: rgba(0, 180, 255, 0.2);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.25);
  }

  .cognition-settings-button.primary {
    background: rgba(0, 180, 255, 0.25);
    border-color: rgba(0, 180, 255, 0.5);
  }

  .cognition-settings-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cognition-settings-status {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 8px;
  }
`;

export default function CognitionLoopSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await authFetch("/settings/cognition-loop");
      if (!response.ok) throw new Error("Failed to load cognition loop settings");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to load cognition settings: ${error.message}`,
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

  if (!config) {
    return <div className="cognition-settings-panel">Loading cognition loop settings...</div>;
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
