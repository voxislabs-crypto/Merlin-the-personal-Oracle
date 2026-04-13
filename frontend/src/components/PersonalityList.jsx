import { useState } from "react";
import AvatarCore from "./AvatarCore.jsx";

const listStyles = `
  .list-header {
    display: flex;
    align-items: center;
    font-weight: 700;
    color: var(--text);
  }

  .personality-expand {
    border: 1px solid rgba(134, 232, 255, 0.34);
    background: linear-gradient(180deg, rgba(208, 248, 255, 0.16), rgba(18, 40, 74, 0.24));
    color: var(--accent);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -8px 14px rgba(0, 0, 0, 0.2),
      0 8px 16px rgba(0, 18, 42, 0.32);
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  .personality-expand:hover {
    transform: translateY(-2px);
    border-color: rgba(176, 244, 255, 0.5);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.36),
      inset 0 -8px 14px rgba(0, 0, 0, 0.16),
      0 12px 22px rgba(0, 164, 255, 0.2);
  }

  .personality-detail {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 180, 255, 0.12);
    display: grid;
    gap: 8px;
  }

  .personality-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .persona-danger-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .persona-icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(134, 232, 255, 0.28);
    background: rgba(9, 24, 42, 0.76);
    color: #bfefff;
    display: grid;
    place-items: center;
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .persona-icon-btn svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .persona-icon-btn:hover {
    transform: translateY(-2px);
    border-color: rgba(176, 244, 255, 0.5);
    box-shadow: 0 10px 20px rgba(0, 166, 255, 0.16);
  }

  .persona-icon-btn.danger {
    color: #ffb4b4;
    border-color: rgba(255, 124, 124, 0.28);
  }

  .persona-icon-btn.danger:hover {
    border-color: rgba(255, 154, 154, 0.54);
    background: rgba(72, 14, 18, 0.76);
    box-shadow: 0 10px 20px rgba(180, 28, 44, 0.22);
  }

  .persona-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(2, 8, 18, 0.74);
    backdrop-filter: blur(8px);
  }

  .persona-modal {
    width: min(460px, 100%);
    border-radius: 22px;
    border: 1px solid rgba(134, 232, 255, 0.24);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 28%),
      linear-gradient(155deg, rgba(7, 22, 44, 0.98), rgba(4, 10, 22, 0.98));
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
    padding: 20px;
    display: grid;
    gap: 14px;
  }

  .persona-modal-header h3 {
    margin: 0 0 6px;
    font-size: 1.08rem;
    color: #f3fbff;
  }

  .persona-modal-header p {
    margin: 0;
    color: var(--muted);
    line-height: 1.5;
    font-size: 0.92rem;
  }

  .persona-modal-label {
    color: #c8efff;
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .persona-modal-input {
    width: 100%;
    border-radius: 14px;
    border: 1px solid rgba(134, 232, 255, 0.3);
    background: rgba(4, 14, 28, 0.9);
    color: #effbff;
    padding: 12px 14px;
    font-size: 0.96rem;
  }

  .persona-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .persona-modal-btn {
    border-radius: 999px;
    border: 1px solid rgba(134, 232, 255, 0.28);
    background: rgba(8, 20, 36, 0.82);
    color: #d8f7ff;
    padding: 10px 14px;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .persona-modal-btn.warn {
    border-color: rgba(255, 201, 106, 0.4);
    background: linear-gradient(135deg, rgba(255, 190, 90, 0.24), rgba(110, 62, 8, 0.34));
    color: #fff2c7;
  }

  .persona-modal-btn.danger {
    border-color: rgba(255, 138, 138, 0.45);
    background: linear-gradient(135deg, rgba(255, 92, 92, 0.26), rgba(116, 18, 26, 0.38));
    color: #ffe4e4;
  }

  .persona-modal-btn:disabled {
    opacity: 0.55;
  }

  .choose-persona {
    border: 1px solid rgba(149, 237, 255, 0.38);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 34%),
      linear-gradient(135deg, rgba(0, 200, 255, 0.2), rgba(0, 80, 220, 0.26));
    color: #dff4ff;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.34),
      inset 0 -8px 16px rgba(0, 0, 0, 0.2),
      0 10px 20px rgba(0, 166, 255, 0.2);
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  .choose-persona:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(188, 246, 255, 0.56);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.42),
      inset 0 -8px 16px rgba(0, 0, 0, 0.16),
      0 14px 24px rgba(0, 172, 255, 0.26);
  }

  .choose-persona:disabled {
    opacity: 0.6;
  }

  .personality-card {
    padding: 10px 12px;
    border-radius: 18px;
    border: 1px solid rgba(0, 180, 255, 0.08);
    background: rgba(6, 14, 28, 0.72);
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
  }

  .personality-card:hover {
    border-color: rgba(0, 180, 255, 0.20);
    background: rgba(0, 180, 255, 0.04);
  }

  .personality-card.active {
    border-color: rgba(0, 180, 255, 0.38);
    box-shadow: 0 0 0 1px rgba(0, 180, 255, 0.12), 0 12px 32px rgba(0, 60, 140, 0.28);
    background: rgba(0, 180, 255, 0.06);
    transform: translateY(-1px);
  }

  .personality-card-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }

  .personality-avatar {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 999px;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .personality-card h3 {
    margin: 0;
    font-size: 1rem;
      .personality-expand {
        border: 1px solid rgba(0, 180, 255, 0.2);
        background: rgba(0, 180, 255, 0.06);
        color: var(--accent);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 0.72rem;
        font-weight: 700;
      }

      .personality-detail {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 180, 255, 0.12);
        display: grid;
        gap: 8px;
      }

      .personality-actions {
        display: flex;
        justify-content: flex-end;
      }

      .choose-persona {
        border: 1px solid rgba(0, 180, 255, 0.28);
        background: linear-gradient(135deg, rgba(0, 200, 255, 0.18), rgba(0, 80, 220, 0.2));
        color: #dff4ff;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .choose-persona:disabled {
        opacity: 0.6;
      }

    font-weight: 700;
    color: var(--text);
  }

  .personality-card p {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .personality-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .personality-meta span {
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(0, 180, 255, 0.07);
    border: 1px solid rgba(0, 180, 255, 0.14);
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .empty-list {
    padding: 18px;
    border-radius: 18px;
    background: rgba(0, 180, 255, 0.03);
    color: var(--muted);
    line-height: 1.65;
    border: 1px dashed rgba(0, 180, 255, 0.14);
    font-size: 0.92rem;
  }
`;

export default function PersonalityList({
  personalities = [],
  activeId,
  isLoading,
  onRefresh,
  onSelect,
  onOpenChat,
  onResetPersona,
  onDeletePersona,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmName, setConfirmName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmAction() {
    if (!confirmAction?.personality || isSubmitting) {
      return;
    }

    const action = confirmAction.type === "delete" ? onDeletePersona : onResetPersona;
    if (typeof action !== "function") {
      return;
    }

    try {
      setIsSubmitting(true);
      await action(confirmAction.personality, confirmName);
      setConfirmAction(null);
      setConfirmName("");
    } catch {
      // Keep the dialog open so the user can correct the confirmation or retry.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{listStyles}</style>
      <div className="list-header">
        <h2>Saved Personas</h2>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <p className="list-copy">
        Pick an active character for chat. Voxis now stores messages in SQLite and can save a
        lightweight voice profile with each persona.
      </p>

      {isLoading ? (
        <div className="empty-list">Loading personalities...</div>
      ) : personalities.length ? (
        <div className="personality-stack">
          {personalities.map((personality) => {
            const isActive = personality.id === activeId;
            const traitCount = Array.isArray(personality.traits) ? personality.traits.length : 0;
            const quirkCount = Array.isArray(personality.quirks) ? personality.quirks.length : 0;
            const sourceCount = Array.isArray(personality.researchSources)
              ? personality.researchSources.length
              : Array.isArray(personality.sourceUrls)
              ? personality.sourceUrls.length
              : 0;

            return (
              <div
                key={personality.id}
                className={`personality-card ${isActive ? "active" : ""}`}
              >
                <div className="personality-card-header">
                  <div className="personality-avatar">
                    <AvatarCore
                      size="compact"
                      valence={Number(personality.moodState?.valence || 0)}
                      arousal={Number(personality.moodState?.arousal || 0)}
                      phase="idle"
                      speaking={false}
                      mode="scientist"
                      personalitySeed={`${personality.id}:${personality.name}:${personality.creativeContext || "default"}`}
                      expressionProfile={personality.expressionProfile}
                      expressionPreset={personality.expressionProfile?.preset || "auto"}
                    />
                  </div>
                  <h3>{personality.name}</h3>
                  <button
                    type="button"
                    className="personality-expand"
                    onClick={() =>
                      setExpandedId((current) =>
                        current === personality.id ? null : personality.id,
                      )
                    }
                  >
                    {expandedId === personality.id ? "Hide" : "Details"}
                  </button>
                </div>

                {expandedId === personality.id ? (
                  <div className="personality-detail">
                    <p>{personality.description}</p>
                    <div className="personality-meta">
                      <span>{personality.moodLabel || personality.mood}</span>
                      {personality.creativeContext && personality.creativeContext !== "default" && (
                        <span>{personality.creativeContext.replace(/_/g, " ")}</span>
                      )}
                      <span>{traitCount} traits</span>
                      <span>{quirkCount} quirks</span>
                      <span>{sourceCount} sources</span>
                    </div>
                    <div className="personality-actions">
                      <button
                        type="button"
                        className="choose-persona"
                        disabled={isActive}
                        onClick={() => {
                          onSelect(personality.id);
                          onOpenChat();
                        }}
                      >
                        {isActive ? "Selected" : "Choose Persona"}
                      </button>
                      <div className="persona-danger-actions">
                        <button
                          type="button"
                          className="persona-icon-btn"
                          title={`Reset ${personality.name}`}
                          aria-label={`Reset ${personality.name}`}
                          onClick={() => {
                            setConfirmAction({ type: "reset", personality });
                            setConfirmName("");
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 5a7 7 0 1 1-6.36 9.92" />
                            <path d="M5 5v5h5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="persona-icon-btn danger"
                          title={`Delete ${personality.name}`}
                          aria-label={`Delete ${personality.name}`}
                          onClick={() => {
                            setConfirmAction({ type: "delete", personality });
                            setConfirmName("");
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16" />
                            <path d="M9 7V4h6v3" />
                            <path d="M7 7l1 13h8l1-13" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-list">
          No personalities saved yet. Open the Character Request page and create one.
        </div>
      )}

      {confirmAction?.personality ? (
        <div
          className="persona-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${confirmAction.type === "delete" ? "Delete" : "Reset"} persona`}
          onClick={() => {
            if (!isSubmitting) {
              setConfirmAction(null);
              setConfirmName("");
            }
          }}
        >
          <div className="persona-modal" onClick={(event) => event.stopPropagation()}>
            <div className="persona-modal-header">
              <div>
                <h3>
                  {confirmAction.type === "delete" ? "Delete persona" : "Reset learned memory"}
                </h3>
                <p>
                  {confirmAction.type === "delete"
                    ? "This permanently removes the persona, chat history, saved memory, and local voice artifacts."
                    : "This keeps the persona profile but clears chat history, learned memory, and the live mood state."}
                </p>
              </div>
            </div>

            <label className="persona-modal-label" htmlFor="persona-confirm-name">
              Type <strong>{confirmAction.personality.name}</strong> to proceed.
            </label>
            <input
              id="persona-confirm-name"
              className="persona-modal-input"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={confirmAction.personality.name}
              autoFocus
            />

            <div className="persona-modal-actions">
              <button
                type="button"
                className="persona-modal-btn"
                onClick={() => {
                  setConfirmAction(null);
                  setConfirmName("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`persona-modal-btn ${confirmAction.type === "delete" ? "danger" : "warn"}`}
                onClick={() => void handleConfirmAction()}
                disabled={isSubmitting || confirmName.trim() !== confirmAction.personality.name}
              >
                {isSubmitting
                  ? "Working..."
                  : confirmAction.type === "delete"
                    ? "Proceed Delete"
                    : "Proceed Reset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
