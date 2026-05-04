import { useEffect, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .companion-alias-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 640px;
  }

  .companion-alias-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 12px;
    background: rgba(14, 22, 40, 0.6);
  }

  .companion-alias-heading {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
  }

  .companion-alias-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .companion-alias-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .companion-alias-toggle-main {
    font-size: 0.85rem;
    color: var(--text);
    font-weight: 600;
  }

  .companion-alias-toggle-hint {
    font-size: 0.72rem;
    color: var(--muted);
  }

  .companion-alias-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .companion-alias-label {
    font-size: 0.8rem;
    color: var(--text);
    font-weight: 600;
  }

  .companion-alias-hint {
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.45;
  }

  .companion-alias-textarea {
    min-height: 110px;
    resize: vertical;
    border-radius: 8px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    background: rgba(6, 10, 20, 0.84);
    color: var(--text);
    padding: 10px;
    font-size: 0.84rem;
    font-family: inherit;
  }

  .companion-alias-textarea:focus {
    outline: none;
    border-color: rgba(0, 180, 255, 0.45);
    box-shadow: 0 0 10px rgba(0, 180, 255, 0.2);
  }

  .companion-alias-actions {
    display: flex;
    gap: 12px;
  }

  .companion-alias-button {
    padding: 10px 18px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.1);
    color: var(--text);
    font-size: 0.84rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .companion-alias-button:hover {
    background: rgba(0, 180, 255, 0.2);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.24);
  }

  .companion-alias-button.primary {
    background: rgba(0, 180, 255, 0.25);
    border-color: rgba(0, 180, 255, 0.48);
  }

  .companion-alias-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .companion-alias-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .companion-alias-chip {
    border: 1px solid rgba(0, 180, 255, 0.28);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.75rem;
    color: #b6e9ff;
    background: rgba(0, 180, 255, 0.1);
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
  const [aliasInput, setAliasInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const response = await authFetch("/settings/companion-aliases");
      if (!response.ok) {
        throw new Error("Failed to load companion alias settings");
      }
      const data = await response.json();
      setConfig(data);
      setAliasInput(aliasesToInput(data.aliases));
      setIsDirty(false);
    } catch (error) {
      onStatus?.({
        type: "error",
        message: `Failed to load companion aliases: ${error.message}`,
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

  if (!config) {
    return <div className="companion-alias-panel">Loading companion alias settings...</div>;
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
