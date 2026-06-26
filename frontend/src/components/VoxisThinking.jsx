import React, { useEffect, useCallback } from 'react';
import './VoxisThinking.css';

const VoxisThinking = ({ 
  isActive, 
  phase = "thinking", 
  personaName = "", 
  onDismiss 
}) => {
  const phases = {
    thinking:    { main: "Voxis is thinking...",          sub: "Reading the depths of your desire",    color: "#C0262E" },
    analyzing:   { main: "Analyzing intent...",           sub: "Peeling back every layer",            color: "#8B00FF" },
    forging:     { main: `Forging ${personaName || "new entity"}...`, sub: "Weaving darkness and desire", color: "#FF1F3A" },
    resolving:   { main: "Resolving contradictions...",   sub: "Evil bunny lover detected",           color: "#C0262E" },
    stabilizing: { main: "Stabilizing identity...",       sub: "Locking core memories in place",      color: "#A855FF" },
    birthing:    { main: "Birth sequence initiated",      sub: "They are coming into existence",      color: "#FF1F3A" }
  };

  const current = phases[phase] || phases.thinking;

  const handleEscape = useCallback((e) => {
    if (e.key === "Escape" && onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isActive, handleEscape]);

  if (!isActive) return null;

  return (
    <div className="voxis-thinking-overlay" role="status" aria-live="polite">
      <div className="voxis-core">
        <div className="voxis-orb">
          <div className="orb-glow" />
          <div className="orb-inner" />
        </div>

        <div className="scan-ring ring-1" />
        <div className="scan-ring ring-2" />
        <div className="scan-ring ring-3" />

        <div className="thinking-content">
          <div className="status-text" style={{ color: current.color }}>
            {current.main}
          </div>
          <div className="sub-status">{current.sub}</div>

          <div className="status-line">
            <div className="pulse-dot" />
            <span>LIVING NEURAL FORGE</span>
          </div>
        </div>
      </div>

      <div className="bottom-hint">
        Speak naturally • Voxis is listening
      </div>
    </div>
  );
};

export default VoxisThinking;
