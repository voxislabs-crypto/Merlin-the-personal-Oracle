import { useState, useEffect } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .profane-filter-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 600px;
  }

  .profane-filter-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 12px;
    background: rgba(14, 22, 40, 0.6);
  }

  .profane-filter-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .profane-filter-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .profane-filter-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .profane-filter-toggle-label {
    display: flex;
    flex-direction: column;
  }

  .profane-filter-toggle-main {
    font-weight: 600;
    color: var(--text);
    font-size: 0.85rem;
  }

  .profane-filter-toggle-hint {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .profane-filter-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .profane-filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
  }

  .profane-filter-hint {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .profane-filter-textarea {
    padding: 10px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 6px;
    background: rgba(6, 10, 20, 0.8);
    color: var(--text);
    font-size: 0.85rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
  }

  .profane-filter-textarea:focus {
    outline: none;
    border-color: rgba(0, 180, 255, 0.5);
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.2);
  }

  .profane-filter-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .profane-filter-button {
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

  .profane-filter-button:hover {
    background: rgba(0, 180, 255, 0.2);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.25);
  }

  .profane-filter-button.primary {
    background: rgba(0, 180, 255, 0.25);
    border-color: rgba(0, 180, 255, 0.5);
  }

  .profane-filter-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .profane-filter-status {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 8px;
  }

  .profane-filter-warning {
    padding: 12px;
    border: 1px solid rgba(255, 100, 100, 0.3);
    border-radius: 8px;
    background: rgba(100, 20, 20, 0.4);
    color: #ff9999;
    font-size: 0.8rem;
  }
`;

export default function ProfaneFilterSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await authFetch("/settings/profane-filter");
      if (!response.ok) throw new Error("Failed to load profane filter settings");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to load profane filter settings: ${error.message}`,
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

  if (!config) {
    return <div className="profane-filter-panel">Loading profane filter settings...</div>;
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
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            background: "rgba(14, 22, 40, 0.95)",
            border: "1px solid rgba(0, 180, 255, 0.3)",
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: "90%",
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
              Acknowledge Disclaimer
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5 }}>
              {config.disclaimer || "This is fictional roleplay. The AI does not wish real harm on anyone."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelEnable}
                style={{
                  padding: "10px 18px",
                  border: "1px solid rgba(0, 180, 255, 0.3)",
                  borderRadius: 8,
                  background: "rgba(0, 180, 255, 0.1)",
                  color: "var(--text)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnable}
                style={{
                  padding: "10px 18px",
                  border: "1px solid rgba(0, 180, 255, 0.5)",
                  borderRadius: 8,
                  background: "rgba(0, 180, 255, 0.25)",
                  color: "var(--text)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
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
