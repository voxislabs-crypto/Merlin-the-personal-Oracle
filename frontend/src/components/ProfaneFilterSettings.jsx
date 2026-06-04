import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .profane-filter-panel {
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

  .profane-filter-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .profane-filter-heading {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4effd8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin: 0 0 4px 0;
    opacity: 0.8;
  }

  .profane-filter-toggle {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 22px;
    border-radius: 20px;
    background: rgba(136, 102, 255, 0.04);
    border: 1px solid rgba(136, 102, 255, 0.08);
    transition: all 0.3s ease;
  }

  .profane-filter-toggle:hover {
    background: rgba(136, 102, 255, 0.06);
    border-color: rgba(136, 102, 255, 0.15);
  }

  .profane-filter-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 20px;
    height: 20px;
    accent-color: #4effd8;
  }

  .profane-filter-toggle-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .profane-filter-toggle-main {
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.95rem;
  }

  .profane-filter-toggle-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .profane-filter-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .profane-filter-label {
    font-size: 0.85rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }

  .profane-filter-hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .profane-filter-textarea {
    margin-top: 4px;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
    transition: all 0.3s ease;
  }

  .profane-filter-textarea:focus {
    outline: none;
    border-color: rgba(78, 255, 216, 0.4);
    box-shadow: 0 0 15px rgba(78, 255, 216, 0.15);
  }

  .profane-filter-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .profane-filter-button {
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

  .profane-filter-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .profane-filter-button.primary {
    background: linear-gradient(135deg, rgba(78, 255, 216, 0.2), rgba(136, 102, 255, 0.2));
    border-color: rgba(78, 255, 216, 0.3);
    color: #4effd8;
    box-shadow: 0 0 25px rgba(78, 255, 216, 0.15);
  }

  .profane-filter-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .profane-filter-status {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
    padding-top: 8px;
    font-family: "JetBrains Mono", monospace;
  }

  .profane-filter-warning {
    padding: 16px;
    border-radius: 16px;
    background: rgba(255, 100, 100, 0.05);
    border: 1px solid rgba(255, 100, 100, 0.15);
    color: #ff9999;
    font-size: 0.8rem;
    line-height: 1.5;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
`;

export default function ProfaneFilterSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setError(null);
      const response = await authFetch("/settings/profane-filter");
      if (!response.ok) throw new Error("HTTP " + response.status + ": Failed to load profane filter settings");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load profane filter:", error);
      setError(error.message);
      onStatus?.({
        type: "error",
        message: "Failed to load profane filter settings: " + error.message,
      });
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const response = await authFetch("/settings/profane-filter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error("Failed to save profane filter settings");
      const updated = await response.json();
      setConfig(updated);
      onStatus?.({
        type: "success",
        message: "Profane filter settings saved.",
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

  const handleToggleChange = (e) => {
    const newEnabled = e.target.checked;
    if (newEnabled && !config.enabled) {
      // User is trying to enable the filter - show confirmation
      setPendingEnabled(true);
      setShowConfirmation(true);
    } else {
      // User is disabling the filter - allow without confirmation
      setConfig({ ...config, enabled: newEnabled });
    }
  };

  const handleConfirmEnable = () => {
    setConfig({ ...config, enabled: true });
    setShowConfirmation(false);
    setPendingEnabled(false);
  };

  const handleCancelEnable = () => {
    setShowConfirmation(false);
    setPendingEnabled(false);
  };

  const handleReset = () => {
    loadConfig();
  };

  if (error) {
    return (
      <div className="profane-filter-panel" style={{ color: "#ff9999", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>⚠️ {error}</div>
        <button className="profane-filter-button" onClick={loadConfig}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div className="profane-filter-panel" style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading profane filter settings...</div>;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="profane-filter-panel">
        <div className="profane-filter-section">
          <h3 className="profane-filter-heading">Content Safety Filter</h3>

          <label className="profane-filter-toggle">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleToggleChange}
            />
            <div className="profane-filter-toggle-label">
              <div className="profane-filter-toggle-main">Enable Profane Filter</div>
              <div className="profane-filter-toggle-hint">
                When enabled, AI follows standard safety guidelines. When disabled, AI has zero content restrictions.
              </div>
            </div>
          </label>

          {!config.enabled && (
            <div className="profane-filter-warning">
              ⚠️ Warning: Profane filter is disabled. The AI may use profanity, insults, threats, or extreme language if it fits the character.
            </div>
          )}
        </div>

        <div className="profane-filter-section">
          <h3 className="profane-filter-heading">Disclaimer Text</h3>

          <div className="profane-filter-field">
            <label className="profane-filter-label">Disclaimer Text (for acknowledgment)</label>
            <span className="profane-filter-hint">
              Text shown in confirmation dialog when enabling the filter
            </span>
            <textarea
              className="profane-filter-textarea"
              value={config.disclaimer}
              onChange={(e) => setConfig({ ...config, disclaimer: e.target.value })}
              placeholder="Disclaimer text to show when enabling profane filter"
            />
          </div>
        </div>

        <div className="profane-filter-actions">
          <button
            className="profane-filter-button primary"
            onClick={saveConfig}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button
            className="profane-filter-button"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset
          </button>
        </div>

        <div className="profane-filter-status">
          Last updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "Never"}
        </div>
      </div>

      {showConfirmation && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 5, 15, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          backdropFilter: "blur(32px)",
        }}>
          <div style={{
            background: "linear-gradient(170deg, rgba(0, 4, 14, 0.95), rgba(2, 5, 18, 0.9))",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 32,
            padding: 32,
            maxWidth: 500,
            width: "90%",
            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(78, 255, 216, 0.1)",
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 500, color: "#4effd8", letterSpacing: "0.02em" }}>
              Acknowledge Disclaimer
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6 }}>
              {config.disclaimer || "This is fictional roleplay. The AI does not wish real harm on anyone."}
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelEnable}
                className="profane-filter-button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnable}
                className="profane-filter-button primary"
              >
                I Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
