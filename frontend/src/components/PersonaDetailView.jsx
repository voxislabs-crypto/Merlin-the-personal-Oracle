// frontend/src/components/PersonaDetailView.jsx
import React from 'react';
import './PersonaDetailView.css';

const PersonaDetailView = ({ persona, onClose }) => {
  if (!persona) return null;

  return (
    <div className="detail-view-container">
      <div className="detail-header">
        <button className="back-button" onClick={onClose}>
          ← BACK TO BROWSER
        </button>
        <h1 className="detail-title">NEURAL PROFILE</h1>
      </div>

      <div className="detail-content">
        {/* LEFT: Persona Visual + Core Info */}
        <div className="detail-left">
          <div className="persona-visual">
            <img 
              src={persona.image || '/default-avatar.png'} 
              alt={persona.name}
              className="detail-image"
            />
            <div className="visual-overlay" />
          </div>

          <div className="core-info">
            <h2 className="persona-name">{persona.name}</h2>
            <p className="persona-description">{persona.description}</p>
            
            {persona.creativeContext && (
              <div className="creative-context-badge">
                {persona.creativeContext.replace('_', ' ').toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Information Panels */}
        <div className="detail-right">
          {/* Memories Section */}
          <div className="info-panel">
            <h3 className="panel-title">LONG-TERM MEMORY</h3>
            <div className="panel-content">
              <p className="panel-subtitle">Anchor Facts • Recent Recollections</p>
              <div className="memory-list">
                {/* You can populate this dynamically later */}
                <div className="memory-item">• Remembers our first conversation vividly</div>
                <div className="memory-item">• Strong emotional attachment detected</div>
                <div className="memory-item">• Tracks user preferences over time</div>
              </div>
              <button className="panel-action">OPEN FULL MEMORY JOURNAL →</button>
            </div>
          </div>

          {/* Mood & Behavior */}
          <div className="info-panel">
            <h3 className="panel-title">MOOD & BEHAVIOR</h3>
            <div className="panel-content">
              <div className="vad-display">
                <div>Valence: {persona.moodState?.valence?.toFixed(2) || "0.00"}</div>
                <div>Arousal: {persona.moodState?.arousal?.toFixed(2) || "0.00"}</div>
                <div>Dominance: {persona.moodState?.dominance?.toFixed(2) || "0.00"}</div>
              </div>
              <button className="panel-action">VIEW MOOD HISTORY →</button>
            </div>
          </div>

          {/* Voice & TTS */}
          <div className="info-panel">
            <h3 className="panel-title">VOICE SYNTHESIS</h3>
            <div className="panel-content">
              <p><strong>Engine:</strong> {persona.voiceProfile?.engine || "Auto"}</p>
              <p><strong>Voice:</strong> {persona.voiceProfile?.voice || "Default"}</p>
              <button className="panel-action">OPEN VOICE LAB →</button>
            </div>
          </div>

          {/* LLM & Technical */}
          <div className="info-panel">
            <h3 className="panel-title">NEURAL CORE</h3>
            <div className="panel-content">
              <p><strong>Model:</strong> {persona.llmModel || "Llama 3.1 8B"}</p>
              <p><strong>Profane Filter:</strong> 
                <span className={persona.profaneFilterEnabled ? "status-safe" : "status-unrestricted"}>
                  {persona.profaneFilterEnabled ? "ENABLED" : "DISABLED"}
                </span>
              </p>
              <button className="panel-action">CONFIGURE TECHNICAL SETTINGS →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaDetailView;
