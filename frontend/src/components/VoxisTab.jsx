import { useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import VoxisThinking from "./VoxisThinking.jsx";

const styles = `
  .voxis-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }

  .voxis-header {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
  }

  .voxis-hint {
    font-size: 0.85rem;
    color: var(--muted);
    margin-bottom: 16px;
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 12px;
    background: rgba(14, 22, 40, 0.6);
  }

  .chat-message {
    padding: 10px 14px;
    border-radius: 8px;
    max-width: 80%;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .chat-message.user {
    align-self: flex-end;
    background: rgba(0, 180, 255, 0.2);
    color: var(--text);
  }

  .chat-message.assistant {
    align-self: flex-start;
    background: rgba(100, 100, 100, 0.2);
    color: var(--text);
  }

  .chat-input-area {
    display: flex;
    gap: 8px;
  }

  .chat-input {
    flex: 1;
    padding: 12px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    border-radius: 8px;
    background: rgba(6, 10, 20, 0.8);
    color: var(--text);
    font-size: 0.9rem;
    font-family: inherit;
    resize: none;
    min-height: 44px;
  }

  .chat-input:focus {
    outline: none;
    border-color: rgba(0, 180, 255, 0.5);
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.2);
  }

  .chat-button {
    padding: 12px 20px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.15);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .chat-button:hover {
    background: rgba(0, 180, 255, 0.25);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.25);
  }

  .chat-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 12px 20px;
    border: 1px solid rgba(0, 180, 255, 0.5);
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.25);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-button:hover {
    background: rgba(0, 180, 255, 0.35);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.3);
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button.primary {
    background: rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.5);
  }

  .action-button.primary:hover {
    background: rgba(0, 255, 136, 0.3);
  }

  .preview-section {
    padding: 16px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 12px;
    background: rgba(14, 22, 40, 0.6);
  }

  .preview-header {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;
  }

  .preview-content {
    font-family: monospace;
    font-size: 0.85rem;
    color: #00ff88;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-message {
    padding: 12px;
    border: 1px solid rgba(255, 100, 100, 0.3);
    border-radius: 8px;
    background: rgba(100, 20, 20, 0.4);
    color: #ff9999;
    font-size: 0.85rem;
  }

  .mode-selector {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .mode-button {
    padding: 8px 16px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    border-radius: 6px;
    background: rgba(6, 10, 20, 0.8);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mode-button.active {
    background: rgba(0, 180, 255, 0.25);
    border-color: rgba(0, 180, 255, 0.5);
  }

  .mode-button:hover:not(.active) {
    background: rgba(0, 180, 255, 0.15);
  }

  /* Persona Preview Panel */
  .persona-preview-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 520px;
    max-width: 92%;
    background: linear-gradient(145deg, #14141f, #0a0a12);
    border: 2px solid #C0262E;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 0 60px rgba(192, 38, 46, 0.6);
    z-index: 1000;
  }

  .persona-preview-panel h3 {
    color: #FF1F3A;
    text-align: center;
    margin-bottom: 1.5rem;
    letter-spacing: 0.06em;
  }

  .persona-preview-content {
    background: rgba(15, 15, 23, 0.7);
    padding: 1.2rem;
    border-radius: 10px;
    margin-bottom: 1.8rem;
    line-height: 1.7;
    font-size: 0.98rem;
    color: #ffffff;
  }

  .persona-preview-content strong {
    color: #FF1F3A;
  }

  .persona-preview-buttons {
    display: flex;
    gap: 1rem;
  }

  .persona-preview-buttons button {
    flex: 1;
    padding: 1rem;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .persona-preview-buttons button:first-child {
    background: #C0262E;
    color: white;
    border: none;
  }

  .persona-preview-buttons button:last-child {
    background: transparent;
    color: #c0c0d8;
    border: 2px solid #666688;
  }

  .persona-preview-buttons button:hover {
    transform: translateY(-2px);
  }

  .persona-preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999;
  }
`;

export default function VoxisTab({ selectedPersonality, onPersonalityUpdated, onStatus }) {
  const authFetch = useAuthFetch();
  const [mode, setMode] = useState(selectedPersonality ? "modify" : "create");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Voxis, your AI guide. I can help you create new personalities or modify existing ones. What would you like to do?" }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  
  // VoxisThinking state
  const [isVoxisThinking, setIsVoxisThinking] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("thinking");
  const [currentPersonaName, setCurrentPersonaName] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const userMessageObj = { role: "user", content: userMessage };
    const updatedMessages = [...messages, userMessageObj];
    setMessages(updatedMessages);
    setInput("");
    setIsProcessing(true);
    setIsVoxisThinking(true);
    setCurrentPhase("thinking");

    // Detect if this is the final step
    const isFinal = userMessage.toLowerCase().includes("done") || 
                    userMessage.toLowerCase().includes("create it") ||
                    userMessage.toLowerCase().includes("make it") ||
                    userMessage.toLowerCase().includes("lock it in") ||
                    userMessage.toLowerCase().includes("generate preview");

    try {
      const response = await authFetch("/api/voxis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, isFinalStep: isFinal }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Voxis");
      }

      const data = await response.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);

      // Smart phase detection based on reply content
      const replyLower = data.reply.toLowerCase();
      if (replyLower.includes("forging") || replyLower.includes("creating") || replyLower.includes("building")) {
        setCurrentPhase("forging");
      } else if (replyLower.includes("analyzing") || replyLower.includes("understanding")) {
        setCurrentPhase("analyzing");
      } else if (replyLower.includes("resolving") || replyLower.includes("contradiction")) {
        setCurrentPhase("resolving");
      } else if (replyLower.includes("stabilizing") || replyLower.includes("finalizing")) {
        setCurrentPhase("stabilizing");
      } else if (replyLower.includes("birth") || replyLower.includes("bringing into existence")) {
        setCurrentPhase("birthing");
      } else {
        setCurrentPhase("thinking");
      }

      // If Voxis gave us a persona, show preview modal
      if (data.extractedPersona) {
        console.log("✅ Persona ready:", data.extractedPersona);
        setPreview(data.extractedPersona);
        setShowPreviewModal(true);
        onStatus?.({
          type: "success",
          message: "Persona extracted from conversation!",
        });
      }
    } catch (err) {
      setError(err.message || "Failed to send message");
      setMessages([...updatedMessages, { role: "assistant", content: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsProcessing(false);
      setIsVoxisThinking(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (messages.length < 2) {
      setError("Need at least one user message to generate preview.");
      return;
    }

    setIsProcessing(true);
    setIsVoxisThinking(true);
    setCurrentPhase("analyzing");
    setCurrentPersonaName(preview?.name || selectedPersonality?.name || "");
    setError(null);
    setPreview(null);

    try {
      setCurrentPhase("forging");
      
      const response = await authFetch("/extract-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          conversation: messages,
          mode,
          currentPersona: selectedPersonality || null
        }),
      });

      if (!response.ok) {
        throw new Error("Extraction failed");
      }

      const text = await response.text();
      const result = JSON.parse(text || "{}");
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setCurrentPhase("stabilizing");
      setPreview(result.data);
      onStatus?.({
        type: "success",
        message: "Preview generated successfully!",
      });
    } catch (err) {
      setError(err.message || "Failed to generate preview");
      onStatus?.({
        type: "error",
        message: `Preview failed: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      setIsVoxisThinking(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!preview || !selectedPersonality) {
      setError("No preview or no selected personality to modify.");
      return;
    }

    setIsProcessing(true);
    setIsVoxisThinking(true);
    setCurrentPhase("resolving");
    setCurrentPersonaName(selectedPersonality.name);
    setError(null);

    try {
      const response = await authFetch(`/personality/${selectedPersonality.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });

      if (!response.ok) {
        throw new Error("Failed to apply changes");
      }

      setCurrentPhase("stabilizing");
      const updated = await response.json();
      onPersonalityUpdated?.(updated);
      onStatus?.({
        type: "success",
        message: "Changes applied successfully!",
      });
      setPreview(null);
      setMessages([
        { role: "assistant", content: "Changes applied successfully! What else would you like to do?" }
      ]);
    } catch (err) {
      setError(err.message || "Failed to apply changes");
      onStatus?.({
        type: "error",
        message: `Apply failed: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      setIsVoxisThinking(false);
    }
  };

  const handleCreatePersona = async () => {
    if (!preview) {
      setError("No preview to create persona from.");
      return;
    }

    setIsProcessing(true);
    setIsVoxisThinking(true);
    setCurrentPhase("birthing");
    setCurrentPersonaName(preview.name || "New Persona");
    setError(null);

    try {
      const response = await authFetch("/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preview.name || "New Persona",
          ...preview,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create persona");
      }

      setCurrentPhase("stabilizing");
      const created = await response.json();
      onPersonalityUpdated?.(created);
      onStatus?.({
        type: "success",
        message: "Persona created successfully!",
      });
      setPreview(null);
      setMessages([
        { role: "assistant", content: "Persona created successfully! What else would you like to do?" }
      ]);
    } catch (err) {
      setError(err.message || "Failed to create persona");
      onStatus?.({
        type: "error",
        message: `Create failed: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      setIsVoxisThinking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([{ role: "assistant", content: "Hi! I'm Voxis, your AI guide. I can help you create new personalities or modify existing ones. What would you like to do?" }]);
    setPreview(null);
    setError(null);
    setExplanation(null);
  };

  const handleExplainBehavior = async () => {
    if (!selectedPersonality) {
      setError("Select a personality to explain its behavior.");
      return;
    }

    setIsExplaining(true);
    setError(null);
    setExplanation(null);

    try {
      const response = await authFetch("/explain-behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality: selectedPersonality,
          sessionId: null, // Would need to be passed from chat context
        }),
      });

      if (!response.ok) {
        throw new Error("Explanation failed");
      }

      const text = await response.text();
      const result = JSON.parse(text || "{}");
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setExplanation(result.explanation);
    } catch (err) {
      setError(err.message || "Failed to generate explanation");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="voxis-tab">
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === "create" ? "active" : ""}`}
            onClick={() => {
              setMode("create");
              handleReset();
            }}
          >
            Create New
          </button>
          <button
            className={`mode-button ${mode === "modify" ? "active" : ""}`}
            onClick={() => {
              setMode("modify");
              handleReset();
            }}
            disabled={!selectedPersonality}
          >
            Modify Selected
          </button>
        </div>

        <h3 className="voxis-header">
          {mode === "create" ? "Create New Personality" : `Modify: ${selectedPersonality?.name || "No persona selected"}`}
        </h3>
        {mode === "modify" && !selectedPersonality && (
          <p className="voxis-hint">Select a personality from the sidebar to modify it.</p>
        )}
        {mode === "modify" && selectedPersonality && (
          <p className="voxis-hint">Describe the changes you want to make to this personality.</p>
        )}
        {mode === "create" && (
          <p className="voxis-hint">Describe the personality you want to create through natural language.</p>
        )}

        <div className="chat-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want..."
            rows={2}
            disabled={isProcessing}
          />
          <button className="chat-button" onClick={handleSendMessage} disabled={!input.trim() || isProcessing}>
            Send
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="action-button"
            onClick={handleGeneratePreview}
            disabled={isProcessing || messages.length < 2}
          >
            {isProcessing ? "Processing..." : "Generate Preview"}
          </button>
          <button className="action-button" onClick={handleReset} disabled={isProcessing}>
            Reset
          </button>
          {selectedPersonality && (
            <button
              className="action-button"
              onClick={handleExplainBehavior}
              disabled={isExplaining}
            >
              {isExplaining ? "Explaining..." : "Why?"}
            </button>
          )}
          {preview && mode === "modify" && (
            <button
              className="action-button primary"
              onClick={handleApplyChanges}
              disabled={isProcessing}
            >
              Apply Changes
            </button>
          )}
          {preview && mode === "create" && (
            <button
              className="action-button primary"
              onClick={handleCreatePersona}
              disabled={isProcessing}
            >
              Create Persona
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {explanation && (
          <div className="preview-section">
            <h3 className="preview-header">Behavior Explanation</h3>
            <p style={{ color: "#87a8b9", fontSize: "0.9rem", lineHeight: 1.5 }}>{explanation}</p>
          </div>
        )}

        {preview && (
          <div className="preview-section">
            <h3 className="preview-header">Preview</h3>
            {preview.humanReadableDiff && preview.humanReadableDiff.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: "0.9rem", color: "#00ff88", marginBottom: 8 }}>Proposed Changes:</h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: "#87a8b9", fontSize: "0.85rem" }}>
                  {preview.humanReadableDiff.map((diff, idx) => (
                    <li key={idx}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}
            {preview.reasoning && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: "0.9rem", color: "#00ff88", marginBottom: 8 }}>Reasoning:</h4>
                <p style={{ margin: 0, color: "#87a8b9", fontSize: "0.85rem" }}>{preview.reasoning}</p>
              </div>
            )}
            <details>
              <summary style={{ cursor: "pointer", color: "#00b4ff", fontSize: "0.85rem", marginBottom: 8 }}>
                Show raw JSON
              </summary>
              <pre className="preview-content">{JSON.stringify(preview, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
      
      <VoxisThinking 
        isActive={isVoxisThinking}
        phase={currentPhase}
        personaName={currentPersonaName}
        onDismiss={() => setIsVoxisThinking(false)}
      />

      {/* Persona Preview Modal */}
      {showPreviewModal && preview && (
        <>
          <div 
            className="persona-preview-overlay" 
            onClick={() => setShowPreviewModal(false)}
          />
          <div className="persona-preview-panel">
            <h3>Proposed Persona</h3>
            <div className="persona-preview-content">
              <strong>Name:</strong> {preview.name}<br/>
              <strong>Description:</strong> {preview.description}<br/>
              <strong>Traits:</strong> {preview.traits?.join(", ") || "None"}<br/>
              <strong>Dark Humor:</strong> {preview.darkHumor ? "Yes" : "No"}
            </div>
            <div className="persona-preview-buttons">
              <button onClick={() => {
                handleCreatePersona();
                setShowPreviewModal(false);
              }}>
                ✅ Create This Persona
              </button>
              <button onClick={() => {
                setShowPreviewModal(false);
                setPreview(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
