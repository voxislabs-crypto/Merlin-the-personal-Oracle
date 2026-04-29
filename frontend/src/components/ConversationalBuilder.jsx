import { useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";

const styles = `
  .conversational-builder {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .conversational-builder-header {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
  }

  .conversational-builder-hint {
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

  .extract-button {
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

  .extract-button:hover {
    background: rgba(0, 180, 255, 0.35);
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.3);
  }

  .extract-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
`;

const CONVERSATION_STEPS = [
  {
    id: "personality_type",
    question: "Hi! I'll help you create a personality through conversation. Tell me what kind of personality you're looking for.",
  },
  {
    id: "energy_level",
    question: "Got it. How energetic should they be? (low, medium, or high)",
  },
  {
    id: "traits",
    question: "What specific traits should they have? (e.g., chaotic, sarcastic, intelligent)",
  },
  {
    id: "quirks",
    question: "Any quirks or mannerisms? (e.g., uses catchphrases, nervous habits)",
  },
];

export default function ConversationalBuilder({ onStatus }) {
  const authFetch = useAuthFetch();
  const [messages, setMessages] = useState([
    { role: "assistant", content: CONVERSATION_STEPS[0].question }
  ]);
  const [input, setInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Store response for current step
    const stepId = CONVERSATION_STEPS[currentStep].id;
    setResponses((prev) => ({ ...prev, [stepId]: input.trim() }));

    // Advance to next step or complete
    const nextStep = currentStep + 1;
    if (nextStep < CONVERSATION_STEPS.length) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: CONVERSATION_STEPS[nextStep].question }]);
      }, 500);
    } else {
      // All steps complete - show completion message
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Great! I have enough information. Click 'Generate Persona Preview' to extract the structured parameters." }]);
      }, 500);
    }
  };

  const handleExtract = async () => {
    if (messages.length < 2) {
      setError("Need at least one user message to extract persona.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setPreview(null);

    try {
      const response = await authFetch("/extract-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: messages }),
      });

      if (!response.ok) {
        throw new Error("Extraction failed");
      }

      const text = await response.text();
      const result = JSON.parse(text || "{}");
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setPreview(result.data);
      onStatus?.({
        type: "success",
        message: "Persona extracted successfully!",
      });
    } catch (err) {
      setError(err.message || "Failed to extract persona");
      onStatus?.({
        type: "error",
        message: `Extraction failed: ${err.message}`,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="conversational-builder">
        <h2 className="conversational-builder-header">Conversational Persona Builder</h2>
        <p className="conversational-builder-hint">
          Describe the personality you want through natural conversation. When ready, click "Generate Preview" to extract structured parameters.
        </p>

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
            placeholder="Describe the personality..."
            rows={2}
          />
          <button className="chat-button" onClick={handleSendMessage} disabled={!input.trim()}>
            Send
          </button>
        </div>

        <button
          className="extract-button"
          onClick={handleExtract}
          disabled={isExtracting || currentStep < CONVERSATION_STEPS.length}
        >
          {isExtracting ? "Extracting..." : "Generate Persona Preview"}
        </button>

        {error && <div className="error-message">{error}</div>}

        {preview && (
          <div className="preview-section">
            <h3 className="preview-header">Extracted Persona Preview</h3>
            <pre className="preview-content">{JSON.stringify(preview, null, 2)}</pre>
          </div>
        )}
      </div>
    </>
  );
}
