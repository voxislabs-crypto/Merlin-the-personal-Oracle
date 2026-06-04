import { useEffect, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .companion-alias-panel {
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

  .companion-alias-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .companion-alias-heading {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4effd8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin: 0 0 4px 0;
    opacity: 0.8;
  }

  .companion-alias-toggle {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 22px;
    border-radius: 20px;
    background: rgba(136, 102, 255, 0.04);
    border: 1px solid rgba(136, 102, 255, 0.08);
    transition: all 0.3s ease;
  }

  .companion-alias-toggle:hover {
    background: rgba(136, 102, 255, 0.06);
    border-color: rgba(136, 102, 255, 0.15);
  }

  .companion-alias-toggle input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #4effd8;
  }

  .companion-alias-toggle-main {
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.95rem;
  }

  .companion-alias-toggle-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .companion-alias-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .companion-alias-label {
    font-size: 0.85rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }

  .companion-alias-hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .companion-alias-textarea {
    margin-top: 4px;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 110px;
    transition: all 0.3s ease;
  }

  .companion-alias-textarea:focus {
    outline: none;
    border-color: rgba(78, 255, 216, 0.4);
    box-shadow: 0 0 15px rgba(78, 255, 216, 0.15);
  }

  .companion-alias-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .companion-alias-button {
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

  .companion-alias-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .companion-alias-button.primary {
    background: linear-gradient(135deg, rgba(78, 255, 216, 0.2), rgba(136, 102, 255, 0.2));
    border-color: rgba(78, 255, 216, 0.3);
    color: #4effd8;
    box-shadow: 0 0 25px rgba(78, 255, 216, 0.15);
  }

  .companion-alias-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .companion-alias-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .companion-alias-chip {
    border: 1px solid rgba(78, 255, 216, 0.2);
    border-radius: 12px;
    padding: 6px 12px;
    font-size: 0.75rem;
    color: #4effd8;
    background: rgba(78, 255, 216, 0.05);
    font-family: "JetBrains Mono", monospace;
  }
`;

function parseAliases(input) {
  const values = String(input || "")
    .split(/[\n,]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
    if (unique.length >= 40) break;
  }

  return unique;
}

function aliasesToInput(aliases) {
  return Array.isArray(aliases) ? aliases.join("\n") : "";
}

export default function CompanionAliasSettings({ onStatus }) {
  const authFetch = useAuthFetch();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [aliasInput, setAliasInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setError(null);
      const response = await authFetch("/settings/companion-aliases");
      if (!response.ok) {
        throw new Error("HTTP " + response.status + ": Failed to load companion alias settings");
      }
      const data = await response.json();
      setConfig(data);
      setAliasInput(aliasesToInput(data.aliases));
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to load companion aliases:", error);
      setError(error.message);
      onStatus?.({
        type: "error",
        message: "Failed to load companion aliases: " + error.message,
      });
    }
  }

  async function saveConfig() {
    if (!config) return;

    setIsSaving(true);
    try {
      const payload = {
        enabled: Boolean(config.enabled),
        aliases: parseAliases(aliasInput),
      };

      const response = await authFetch("/settings/companion-aliases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save companion alias settings");
      }

      setConfig(data);
      setAliasInput(aliasesToInput(data.aliases));
      setIsDirty(false);
      onStatus?.({
        type: "success",
        message: "Companion alias settings saved.",
      });
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to save companion aliases: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleEnabledChange(nextEnabled) {
    setConfig((current) => ({
      ...current,
      enabled: Boolean(nextEnabled),
    }));
    setIsDirty(true);
  }

  function handleAliasInputChange(nextValue) {
    setAliasInput(nextValue);
    setIsDirty(true);
  }

  if (error) {
    return (
      <div className="companion-alias-panel" style={{ color: "#ff9999", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}>⚠️ {error}</div>
        <button className="companion-alias-button" onClick={() => void loadConfig()}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div className="companion-alias-panel" style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading companion alias settings...</div>;
  }

  const parsedAliases = parseAliases(aliasInput);

  return (
    <>
      <style>{styles}</style>
      <div className="companion-alias-panel">
        <div className="companion-alias-section">
          <h3 className="companion-alias-heading">Companion Name Mapping</h3>
          <label className="companion-alias-toggle">
            <input
              type="checkbox"
              checked={Boolean(config.enabled)}
              onChange={(event) => handleEnabledChange(event.target.checked)}
            />
            <div>
              <div className="companion-alias-toggle-main">Enable runtime companion name swapping</div>
              <div className="companion-alias-toggle-hint">
                Replaces legacy companion names in persona text with the current user display name.
              </div>
            </div>
          </label>
        </div>

        <div className="companion-alias-section">
          <div className="companion-alias-field">
            <label className="companion-alias-label" htmlFor="companionAliasInput">
              Aliases to replace
            </label>
            <span className="companion-alias-hint">
              Add one alias per line (or comma-separated). Example: morty, sidekick, partner.
            </span>
            <textarea
              id="companionAliasInput"
              className="companion-alias-textarea"
              value={aliasInput}
              onChange={(event) => handleAliasInputChange(event.target.value)}
              placeholder="morty"
            />
          </div>

          <div className="companion-alias-hint">Parsed aliases ({parsedAliases.length}/40):</div>
          <div className="companion-alias-preview">
            {parsedAliases.length > 0
              ? parsedAliases.map((alias) => (
                  <span key={alias} className="companion-alias-chip">{alias}</span>
                ))
              : <span className="companion-alias-hint">No aliases configured.</span>}
          </div>

          <div className="companion-alias-actions">
            <button
              type="button"
              className="companion-alias-button primary"
              onClick={() => void saveConfig()}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? "Saving..." : "Save Companion Aliases"}
            </button>
            <button
              type="button"
              className="companion-alias-button"
              onClick={() => void loadConfig()}
              disabled={isSaving}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
