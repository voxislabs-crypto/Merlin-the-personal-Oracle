import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { getApiErrorMessage, readApiResponsePayload } from "../lib/apiResponse.js";
import { buildTtsCacheKey, getTtsCache, setTtsCache } from "../utils/ttsCache.js";
import { getRequestMetricsSnapshot, trackedFetch } from "../utils/requestTracker.js";
import { useParallelVoiceBuffer } from "../hooks/useParallelVoiceBuffer.js";
import NeuralCore from "./NeuralCore.jsx";
import AvatarCore from "./AvatarCore.jsx";
import BrainTab from "./BrainTab.jsx";
import PerformancePlayer from "./PerformancePlayer.jsx";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion.js";
import { interpretEmotionSpectrum } from "../lib/emotionSpectrum.js";

const TTS_DEBUG_PROVIDER_LOCK = String(import.meta.env.VITE_TTS_DEBUG_PROVIDER_LOCK ?? "true").trim().toLowerCase() !== "false";
const TTS_DISABLE_KOKORO = String(import.meta.env.VITE_TTS_DISABLE_KOKORO ?? "false").trim().toLowerCase() === "true";
const DEFAULT_DISABLE_NEURONMAP_3D = String(import.meta.env.VITE_DISABLE_NEURONMAP_3D ?? "true").trim().toLowerCase() !== "false";
const CUSTOM_CARTESIA_VOICE_OPTION = "__custom_cartesia_voice__";
const QUICK_VOICE_FAVORITES_KEY = "voxis.quickVoiceFavorites.v1";
const LIVE_CALL_LEVEL_THRESHOLD = 0.018;
const LIVE_CALL_SILENCE_MS = 900;
const LIVE_CALL_MAX_RECORDING_MS = 12000;
const LIVE_CALL_RECOVER_MS = 700; // settle delay between turns
const STREAM_POST_SEND_GRACE_MS = 1200;

// ── Live Call Conversation State Machine ────────────────────────────────────
// Single source of truth for the live voice turn lifecycle.
// Replaces the previous "liveCallPhase" + boolean-soup of isSending /
// isGeneratingAudio / isAudioPlaying guards with explicit transitions.
const CONV_PHASE = Object.freeze({
  IDLE:             "idle",
  LISTENING:        "listening",
  TRANSCRIBING:     "transcribing",
  THINKING:         "thinking",
  GENERATING_AUDIO: "generating_audio",
  SPEAKING:         "speaking",
  RECOVERING:       "recovering",
  ERROR:            "error",
});

function convPhaseReducer(state, action) {
  switch (action.type) {
    // Call lifecycle
    case "CALL_START":   return CONV_PHASE.LISTENING;
    case "CALL_END":     return CONV_PHASE.IDLE;
    // Recorder lifecycle
    case "RECORDED":     return state === CONV_PHASE.LISTENING    ? CONV_PHASE.TRANSCRIBING     : state;
    // STT result
    case "TRANSCRIPT":   return state === CONV_PHASE.TRANSCRIBING ? CONV_PHASE.THINKING          : state;
    case "NO_SPEECH":    return state === CONV_PHASE.TRANSCRIBING ? CONV_PHASE.RECOVERING        : state;
    // LLM + TTS lifecycle (driven by observed external props)
    case "LLM_DONE":     return state === CONV_PHASE.THINKING     ? CONV_PHASE.GENERATING_AUDIO  : state;
    case "AUDIO_START":  return (state === CONV_PHASE.GENERATING_AUDIO || state === CONV_PHASE.THINKING) ? CONV_PHASE.SPEAKING : state;
    case "AUDIO_END":    return state === CONV_PHASE.SPEAKING      ? CONV_PHASE.RECOVERING        : state;
    // Recovery → next turn
    case "RECOVERED":    return state === CONV_PHASE.RECOVERING    ? CONV_PHASE.LISTENING         : state;
    // User interruption — cut AI response, re-arm microphone immediately
    case "INTERRUPT":    return (
      state === CONV_PHASE.SPEAKING ||
      state === CONV_PHASE.GENERATING_AUDIO ||
      state === CONV_PHASE.THINKING
    ) ? CONV_PHASE.LISTENING : state;
    // Error terminal
    case "ERROR":        return CONV_PHASE.ERROR;
    default:             return state;
  }
}
const CARTESIA_QUICK_VOICE_OPTIONS = [
  { id: "a0e99841-438c-4a64-b679-ae501e7d6091", label: "Sonic default" },
  { id: "694f9389-aac1-45b6-b726-9d9369183238", label: "Warm Narrator" },
  { id: "2ee87190-8f84-4925-97da-e52547f9462c", label: "Balanced Voice" },
];

function readQuickVoiceFavorites() {
  try {
    if (typeof window === "undefined") {
      return { cartesia: [], kokoro: [] };
    }
    const raw = window.localStorage.getItem(QUICK_VOICE_FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      cartesia: Array.isArray(parsed?.cartesia) ? parsed.cartesia : [],
      kokoro: Array.isArray(parsed?.kokoro) ? parsed.kokoro : [],
    };
  } catch {
    return { cartesia: [], kokoro: [] };
  }
}

function buildPersonaKeywords(personality) {
  const sourceText = [
    personality?.name,
    personality?.role,
    personality?.tagline,
    personality?.description,
    personality?.creativeContext,
    personality?.speakingStyle,
    personality?.voiceStyle,
    personality?.alignment,
    personality?.tone,
    ...(Array.isArray(personality?.voiceTags) ? personality.voiceTags : []),
  ]
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  const tokens = sourceText
    .split(/[^a-z0-9]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);

  return new Set(tokens);
}

function normalizeVoiceEngineForDebug(engine) {
  const normalized = String(engine || "auto").trim().toLowerCase();
  if (!TTS_DEBUG_PROVIDER_LOCK) {
    if (TTS_DISABLE_KOKORO && normalized === "kokoro") {
      return "auto";
    }
    return normalized || "auto";
  }

  if (TTS_DISABLE_KOKORO) {
    return ["auto", "cartesia"].includes(normalized) ? normalized : "auto";
  }

  return ["auto", "kokoro", "cartesia"].includes(normalized) ? normalized : "auto";
}

function MiniBrain({ brainEvents = [] }) {
  const latest = useMemo(() => {
    const map = {};
    for (const ev of brainEvents) {
      map[ev.stage] = ev;
    }
    return map;
  }, [brainEvents]);

  const mood = latest["mood_update"]?.mood;
  const narrative = [...brainEvents].reverse().find(ev => ev.narrative)?.narrative;

  if (!mood && !narrative) return null;

  const vadBar = (val) => {
    const pct = Math.round(((val + 1) / 2) * 100);
    return (
      <div className="mb-bar-track">
        <div className="mb-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="mini-brain">
      <div className="mini-brain-header">◈ Cognitive State</div>
      {mood && (
        <div className="mini-brain-mood">
          <div className="mb-stat">
            <span className="mb-label">VAL</span>
            {vadBar(mood.valence || 0)}
            <span className="mb-val">{(mood.valence || 0).toFixed(2)}</span>
          </div>
          <div className="mb-stat">
            <span className="mb-label">ARO</span>
            {vadBar(mood.arousal || 0)}
            <span className="mb-val">{(mood.arousal || 0).toFixed(2)}</span>
          </div>
          <div className="mb-stat">
            <span className="mb-label">DOM</span>
            {vadBar(mood.dominance || 0)}
            <span className="mb-val">{(mood.dominance || 0).toFixed(2)}</span>
          </div>
        </div>
      )}
      {narrative && (
        <div className="mini-brain-narrative">
          {narrative}
        </div>
      )}
    </div>
  );
}

function CompactLiveBrain({ brainEvents = [], livePhase = "" }) {
  const latest = useMemo(() => {
    const map = {};
    for (const ev of brainEvents) {
      map[ev.stage] = ev;
    }
    return map;
  }, [brainEvents]);

  const mood = latest["mood_update"]?.mood || null;
  const memCount = Array.isArray(latest["memory_retrieval"]?.memories)
    ? latest["memory_retrieval"].memories.length
    : 0;

  const now = Date.now();
  const hotEvents = brainEvents.filter((ev) => {
    const ts = Number(new Date(ev?.timestamp || 0));
    return Number.isFinite(ts) && now - ts < 2200;
  }).length;

  const pulseIntensity = Math.min(1, hotEvents / 4 + (livePhase && livePhase !== "reply-complete" ? 0.25 : 0));
  const activeLineCount = Math.max(2, Math.min(8, Math.round(pulseIntensity * 8)));

  return (
    <div className="compact-live-brain">
      <div className="compact-live-brain-network">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={`n-${i}`}
            className={`clb-node ${i % 2 === 0 ? "warm" : "cool"}`}
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={`l-${i}`}
            className={`clb-line ${i < activeLineCount ? "active" : ""}`}
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <div className="compact-live-brain-stats">
        <span className="clb-chip">events {brainEvents.length}</span>
        <span className="clb-chip">hot {hotEvents}</span>
        <span className="clb-chip">mem {memCount}</span>
        <span className="clb-chip">phase {String(livePhase || "idle").replace(/_/g, " ")}</span>
      </div>
      {mood ? (
        <div className="compact-live-brain-vad">
          <span>V {Number(mood.valence || 0).toFixed(2)}</span>
          <span>A {Number(mood.arousal || 0).toFixed(2)}</span>
          <span>D {Number(mood.dominance || 0).toFixed(2)}</span>
        </div>
      ) : (
        <div className="compact-live-brain-vad">Awaiting telemetry…</div>
      )}
    </div>
  );
}

// Lightweight EPF detection — mirrors backend isPerformanceOutput
function isEPF(text) {
  const raw = String(text || "");
  return /\[\[[A-Za-z]+\d+\]\]/.test(raw) && (/^\[:\]/m.test(raw) || /^\[\d+(?:\.\d+)?:\]\s+[^\n]+/m.test(raw));
}

function stripInlineMetadataTokens(text) {
  const source = String(text || "");
  const metadataPattern = /\b(?:mosic|music|bpm|duration_secs|good_crop)\s*:\s*-?\d+(?:\.\d+)?/gi;
  const first = metadataPattern.exec(source);
  if (!first) {
    return source.trim();
  }
  return source.slice(0, first.index).trim();
}

function extractEPFDialogue(text) {
  const dialogueLines = String(text || "")
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => {
      // Plain continuation line: [:]
      if (line.startsWith("[:]") && line.length > 3) return true;
      // Timestamp line with trailing text: [12.0:] Spoken lyric here
      // Long trailing text (> 200 chars) is audio-direction prose — skip it.
      const tm = line.match(/^\[[\d.]+:\]\s+(.+)/);
      return tm && tm[1].length < 200;
    })
    .map((line) => stripInlineMetadataTokens(line.replace(/^\[(?::|[\d.]+):\]\s*/, "")))
    .filter(Boolean);

  return dialogueLines.join("\n");
}

const chatStyles = `
  .chat-shell {
    display: grid;
    gap: 16px;
  }

  .chat-placeholder,
  .chat-card {
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 22px;
    background: rgba(6, 14, 28, 0.72);
    overflow: hidden;
  }

  .chat-card {
    position: relative;
  }

  .chat-placeholder {
    padding: 24px;
    color: var(--muted);
    line-height: 1.7;
  }

  .chat-header {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(0, 180, 255, 0.08);
    background: rgba(0, 180, 255, 0.04);
  }

  .chat-header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .chat-header h3 {
    margin: 0 0 6px;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-avatar-wrap {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .mood-dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 10px var(--mood-dot-glow, rgba(0, 234, 255, 0.45));
  }

  .chat-header p {
    margin: 0;
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.6;
  }

  .mood-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 180, 255, 0.07);
  }

  .mood-zone-badge {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .mood-emotion-label {
    font-size: 0.72rem;
    color: rgba(190, 230, 255, 0.75);
    flex-shrink: 0;
  }

  .mood-vad-pair {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .mood-vad-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .mood-vad-label {
    font-size: 0.52rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(0, 180, 255, 0.45);
  }

  .mood-vad-value {
    font-size: 0.7rem;
    font-weight: 800;
    color: rgba(200, 240, 255, 0.9);
    font-family: monospace;
    min-width: 3ch;
    text-align: center;
  }

  .mood-drift-svg {
    flex: 1;
    min-width: 48px;
    max-width: 120px;
    height: 18px;
    opacity: 0.75;
  }

  .sys-observer {
    border-bottom: 1px solid rgba(0, 180, 255, 0.07);
    background: rgba(3, 10, 22, 0.92);
  }

  .sys-observer-inner {
    padding: 14px 20px 16px;
  }

  .sys-observer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }

  .sys-observer-card {
    background: rgba(0, 180, 255, 0.04);
    border: 1px solid rgba(0, 180, 255, 0.1);
    border-radius: 10px;
    padding: 8px 10px;
  }

  .sys-observer-card-title {
    font-size: 0.56rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(0, 180, 255, 0.5);
    margin-bottom: 6px;
    font-weight: 700;
  }

  .sys-observer-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 3px;
  }

  .sys-observer-label {
    font-size: 0.62rem;
    color: rgba(180, 220, 245, 0.5);
    flex-shrink: 0;
  }

  .sys-observer-value {
    font-size: 0.66rem;
    font-family: monospace;
    color: rgba(200, 240, 255, 0.85);
    text-align: right;
    word-break: break-all;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sys-observer-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.62rem;
    font-weight: 700;
  }

  .sys-observer-status::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.8;
  }

  .sys-observer-status.ok { color: #34d399; }
  .sys-observer-status.warn { color: #fbbf24; }
  .sys-observer-status.off { color: rgba(180, 180, 180, 0.5); }

  .sys-observer-bar-wrap {
    margin-top: 5px;
  }

  .sys-observer-bar-track {
    height: 4px;
    border-radius: 999px;
    background: rgba(0, 180, 255, 0.1);
    overflow: hidden;
  }

  .sys-observer-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 400ms ease;
  }

  .sys-observer-bar-label {
    font-size: 0.56rem;
    color: rgba(160, 210, 240, 0.45);
    margin-top: 2px;
  }

  .debug-toggle {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.18);
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .message-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 380px;
    max-height: 520px;
    padding: 20px;
    overflow-y: auto;
  }

  .chat-neural-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.34;
  }

  .chat-neural-bg line {
    stroke: rgba(0, 200, 255, 0.22);
    stroke-width: 1;
  }

  .chat-neural-bg line.active {
    stroke: rgba(255, 132, 72, 0.44);
    stroke-width: 1.4;
  }

  .chat-neural-bg circle {
    fill: rgba(140, 214, 255, 0.42);
  }

  .message-bubble {
    max-width: 100%;
    padding: 13px 16px;
    border-radius: 18px;
    line-height: 1.7;
    white-space: pre-wrap;
    font-size: 0.95rem;
  }

  .message-bubble.user {
    align-self: flex-end;
    max-width: min(85%, 720px);
    background: linear-gradient(135deg, rgba(0, 160, 255, 0.22), rgba(0, 80, 220, 0.20));
    border: 1px solid rgba(0, 180, 255, 0.24);
    color: var(--text);
    border-bottom-right-radius: 6px;
  }

  .message-bubble.assistant {
    align-self: stretch;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: rgba(16, 24, 44, 0.88);
    border: 1px solid rgba(0, 180, 255, 0.08);
    color: var(--text);
    border-bottom-left-radius: 6px;
  }

  .message-bubble.live {
    border-style: dashed;
    border-color: rgba(0, 240, 255, 0.28);
    background:
      linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(160, 32, 240, 0.10)),
      rgba(10, 18, 34, 0.92);
    box-shadow: 0 0 32px rgba(0, 200, 255, 0.12);
  }

  .live-phase {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: #93ecff;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .live-phase::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #00f0ff;
    box-shadow: 0 0 16px rgba(0, 240, 255, 0.8);
    animation: livePulse 1.1s ease-in-out infinite;
  }

  .debug-panel {
    margin-top: 10px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 200, 120, 0.18);
    background: rgba(4, 18, 10, 0.88);
    color: #9ef0b8;
    font-size: 0.78rem;
    line-height: 1.55;
    overflow: auto;
    max-height: 260px;
    white-space: pre-wrap;
  }
  .debug-summary {
    margin-top: 10px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 180, 255, 0.18);
    background: rgba(2, 16, 28, 0.88);
    color: #b6ecff;
  }

  .debug-summary-title {
    display: block;
    margin-bottom: 6px;
    color: #7fdfff;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .debug-summary-body {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.6;
  }

  .debug-summary-meta {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .debug-summary-chip {
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.16);
    background: rgba(0, 180, 255, 0.08);
    color: #8ddfff;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .message-role {
    display: block;
    margin-bottom: 6px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.6;
    color: var(--accent);
  }

  .assistant-normal-main {
    white-space: pre-wrap;
  }

  .assistant-next-questions {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed rgba(0, 180, 255, 0.2);
    color: rgba(188, 220, 245, 0.84);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .assistant-next-questions strong {
    display: block;
    margin-bottom: 3px;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(123, 223, 255, 0.86);
  }

  .empty-chat {
    color: var(--muted);
    line-height: 1.7;
    font-size: 0.93rem;
  }

  .composer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 16px 20px 18px;
    border-top: 1px solid rgba(0, 180, 255, 0.08);
    background: rgba(0, 180, 255, 0.02);
  }

  .composer.dragging {
    border-color: rgba(0, 180, 255, 0.4);
    background: rgba(0, 180, 255, 0.08);
  }

  .composer-input-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .composer textarea {
    width: 100%;
    min-height: 88px;
    padding: 13px 16px;
    padding-right: 100px;
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 16px;
    background: rgba(6, 14, 28, 0.90);
    color: var(--text);
    resize: vertical;
  }

  .composer textarea::placeholder {
    color: var(--muted);
  }

  .composer textarea:focus {
    outline: none;
    border-color: rgba(0, 180, 255, 0.42);
    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.08);
  }

  .composer-actions {
    position: absolute;
    right: 12px;
    top: 12px;
    display: flex;
    gap: 8px;
  }

  .composer-icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    cursor: pointer;
    transition: background 150ms, border-color 150ms, transform 100ms;
  }

  .composer-icon-btn:hover {
    background: rgba(0, 180, 255, 0.12);
    border-color: rgba(0, 180, 255, 0.4);
    transform: translateY(-1px);
  }

  .composer-icon-btn.recording {
    background: rgba(255, 96, 96, 0.2);
    border-color: rgba(255, 96, 96, 0.5);
    color: #ff6060;
    animation: recordingPulse 1.5s ease-in-out infinite;
  }

  @keyframes recordingPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 96, 96, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(255, 96, 96, 0); }
  }

  .live-call-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .live-call-layout {
    width: min(1400px, 96vw);
    max-height: 92vh;
    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(520px, 1fr);
    gap: 18px;
    align-items: stretch;
    position: relative;
  }

  .live-call-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    background: rgba(8, 18, 32, 0.96);
    border: 1px solid rgba(0, 234, 255, 0.25);
    border-radius: 24px;
    padding: 40px 48px;
    min-width: 280px;
    box-shadow: 0 0 60px rgba(0, 180, 255, 0.15);
    min-height: 360px;
    max-height: 92vh;
    overflow-y: auto;
  }

  .live-call-brain-window {
    display: flex;
    flex-direction: column;
    min-height: 360px;
    max-height: 92vh;
    min-width: 420px;
    border-radius: 22px;
    border: 1px solid rgba(0, 234, 255, 0.28);
    background: radial-gradient(circle at 20% 0%, rgba(0, 210, 255, 0.14), rgba(6, 14, 28, 0.94) 45%);
    box-shadow: 0 0 60px rgba(0, 180, 255, 0.2);
    overflow: hidden;
    resize: both;
    position: relative;
    transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .live-call-brain-window.compact {
    min-width: 440px;
    min-height: 320px;
    background: radial-gradient(circle at 50% -10%, rgba(0, 234, 255, 0.22), rgba(10, 12, 24, 0.96) 42%);
  }

  .live-call-brain-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(0, 234, 255, 0.2);
    background: rgba(2, 10, 20, 0.7);
    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .live-call-brain-head:active {
    cursor: grabbing;
  }

  .live-call-brain-title {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(156, 251, 255, 0.92);
    font-weight: 700;
  }

  .live-call-brain-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .live-call-brain-body .brain-tab {
    padding: 14px;
  }

  .live-call-brain-body .bt-grid {
    gap: 10px;
  }

  .live-call-brain-body .bt-panel {
    border-radius: 12px;
    padding: 10px 12px;
  }

  .live-call-brain-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .live-call-brain-window.compact .live-call-brain-body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  }

  .compact-live-brain {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 16px;
    border: 1px solid rgba(0, 234, 255, 0.2);
    padding: 14px;
    background: linear-gradient(140deg, rgba(0, 18, 32, 0.78), rgba(10, 12, 22, 0.92));
  }

  .compact-live-brain-network {
    position: relative;
    height: 170px;
    border-radius: 14px;
    border: 1px solid rgba(0, 234, 255, 0.18);
    background: radial-gradient(circle at 30% 20%, rgba(0, 234, 255, 0.14), rgba(2, 8, 18, 0.94) 55%);
    overflow: hidden;
  }

  .clb-node {
    position: absolute;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    margin-top: -5px;
    margin-left: -5px;
    animation: clbNodePulse 1.8s ease-in-out infinite;
    box-shadow: 0 0 10px rgba(0, 234, 255, 0.6);
  }

  .clb-node.cool { background: #67e8f9; }
  .clb-node.warm { background: #f59e0b; }

  .clb-node:nth-child(1) { transform: translate(-118px, -48px); }
  .clb-node:nth-child(2) { transform: translate(-42px, -63px); }
  .clb-node:nth-child(3) { transform: translate(48px, -32px); }
  .clb-node:nth-child(4) { transform: translate(-86px, 48px); }
  .clb-node:nth-child(5) { transform: translate(4px, 56px); }
  .clb-node:nth-child(6) { transform: translate(98px, 42px); }

  .clb-line {
    position: absolute;
    height: 2px;
    left: 50%;
    top: 50%;
    transform-origin: 0 50%;
    background: rgba(100, 180, 210, 0.2);
    opacity: 0.45;
    animation: clbLineFlow 1.6s linear infinite;
  }

  .clb-line.active {
    background: linear-gradient(90deg, rgba(0, 234, 255, 0.45), rgba(245, 158, 11, 0.7));
    opacity: 0.95;
  }

  .clb-line:nth-child(7) { width: 86px; transform: translate(-114px, -50px) rotate(14deg); }
  .clb-line:nth-child(8) { width: 104px; transform: translate(-36px, -58px) rotate(16deg); }
  .clb-line:nth-child(9) { width: 112px; transform: translate(-84px, 42px) rotate(-36deg); }
  .clb-line:nth-child(10) { width: 98px; transform: translate(4px, 52px) rotate(-12deg); }
  .clb-line:nth-child(11) { width: 120px; transform: translate(-30px, -6px) rotate(38deg); }
  .clb-line:nth-child(12) { width: 104px; transform: translate(8px, -24px) rotate(62deg); }
  .clb-line:nth-child(13) { width: 90px; transform: translate(-72px, -32px) rotate(84deg); }
  .clb-line:nth-child(14) { width: 92px; transform: translate(10px, -4px) rotate(-68deg); }

  .compact-live-brain-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .clb-chip {
    border: 1px solid rgba(0, 234, 255, 0.28);
    background: rgba(0, 234, 255, 0.08);
    color: rgba(175, 244, 255, 0.92);
    border-radius: 999px;
    padding: 4px 8px;
    font-size: 0.64rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .compact-live-brain-vad {
    display: flex;
    gap: 10px;
    color: rgba(170, 220, 245, 0.88);
    font-family: monospace;
    font-size: 0.78rem;
  }

  @keyframes clbNodePulse {
    0%, 100% { opacity: 0.65; box-shadow: 0 0 10px rgba(0, 234, 255, 0.45); }
    50% { opacity: 1; box-shadow: 0 0 18px rgba(0, 234, 255, 0.9); }
  }

  @keyframes clbLineFlow {
    0% { filter: brightness(0.8); }
    50% { filter: brightness(1.4); }
    100% { filter: brightness(0.8); }
  }

  .live-call-secondary-btn {
    border: 1px solid rgba(0, 234, 255, 0.34);
    background: rgba(0, 234, 255, 0.08);
    color: #8ef9ff;
    border-radius: 999px;
    padding: 7px 11px;
    font-size: 0.66rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 700;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease, transform 120ms ease;
  }

  .live-call-secondary-btn:hover {
    background: rgba(0, 234, 255, 0.16);
    border-color: rgba(0, 234, 255, 0.55);
    transform: translateY(-1px);
  }

  @media (max-width: 1080px) {
    .live-call-layout {
      width: min(900px, 96vw);
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .live-call-card,
    .live-call-brain-window {
      max-height: 44vh;
      min-height: 300px;
      min-width: 0;
      resize: none;
      transform: none !important;
    }

    .live-call-brain-head {
      cursor: default;
    }
  }

  .live-call-name {
    font-size: 1.05rem;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.04em;
  }

  .live-call-avatar-portrait {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top center;
    border: 2px solid rgba(0,234,255,0.4);
    box-shadow: 0 0 18px rgba(0,180,255,0.3);
    flex-shrink: 0;
  }

  .live-call-snap-guides {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: stretch;
    gap: 0;
    z-index: 9999;
  }

  .live-call-snap-zone {
    flex: 1;
    border: 1.5px dashed rgba(0,234,255,0.18);
    border-radius: 14px;
    margin: 12px 6px;
    transition: background 140ms ease, border-color 140ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .live-call-snap-zone.active {
    background: rgba(0,234,255,0.07);
    border-color: rgba(0,234,255,0.55);
  }

  .live-call-snap-zone-label {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(0,234,255,0.5);
    font-weight: 600;
  }

  .live-call-snap-zone.active .live-call-snap-zone-label {
    color: rgba(0,234,255,0.9);
  }

  .live-call-orb {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    transition: background 300ms, box-shadow 300ms;
  }

  .live-call-orb.listening {
    background: rgba(255, 96, 96, 0.18);
    animation: callListenPulse 1.4s ease-in-out infinite;
  }

  .live-call-orb.processing {
    background: rgba(255, 200, 50, 0.18);
    box-shadow: 0 0 24px rgba(255, 200, 50, 0.25);
  }

  .live-call-orb.speaking {
    background: rgba(0, 234, 255, 0.18);
    animation: callSpeakPulse 0.9s ease-in-out infinite;
  }

  .live-call-orb.error {
    background: rgba(255, 60, 60, 0.18);
    box-shadow: 0 0 24px rgba(255, 60, 60, 0.35);
  }

  .live-call-orb.interruptible {
    cursor: pointer;
    transition: background 300ms, box-shadow 300ms, filter 150ms, transform 100ms;
  }

  .live-call-orb.interruptible:hover {
    filter: brightness(1.25);
    transform: scale(1.06);
  }

  .live-call-interrupt-hint {
    font-size: 0.68rem;
    color: rgba(0,234,255,0.45);
    letter-spacing: 0.08em;
    margin-top: -8px;
  }

  .live-call-debug-log {
    margin-top: 8px;
    width: 100%;
    font-size: 0.62rem;
    color: rgba(255,255,255,0.35);
    font-family: monospace;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 8px;
  }

  @keyframes callListenPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 96, 96, 0.5); }
    50% { box-shadow: 0 0 0 20px rgba(255, 96, 96, 0); }
  }

  @keyframes callSpeakPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0, 234, 255, 0.5); }
    50% { box-shadow: 0 0 0 20px rgba(0, 234, 255, 0); }
  }

  .live-call-phase-label {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .live-call-tap-hint {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
  }

  .live-call-end-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 60, 60, 0.9);
    color: #fff;
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(255, 60, 60, 0.4);
    transition: background 150ms, transform 100ms;
  }

  .live-call-end-btn:hover {
    background: rgba(255, 60, 60, 1);
    transform: scale(1.06);
  }

  .live-call-stop-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 1px solid rgba(0,234,255,0.35);
    background: rgba(0,234,255,0.08);
    color: #00eaff;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 150ms;
  }

  .live-call-stop-btn:hover {
    background: rgba(0,234,255,0.15);
  }

  .composer-icon-btn.live-call-active {
    background: rgba(0, 234, 255, 0.18);
    border-color: rgba(0, 234, 255, 0.6);
    color: #00eaff;
    animation: recordingPulse 1.8s ease-in-out infinite;
  }

  .composer-icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .composer-file-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.06);
    border: 1px solid rgba(0, 180, 255, 0.2);
    font-size: 0.8rem;
    color: var(--text);
  }

  .composer-file-preview-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .composer-file-preview-remove {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: rgba(255, 96, 96, 0.15);
    color: #ff6060;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 150ms;
  }

  .composer-file-preview-remove:hover {
    background: rgba(255, 96, 96, 0.25);
  }

  .composer button {
    align-self: end;
    padding: 13px 22px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--accent-deep));
    color: #fff;
    font-weight: 800;
    box-shadow: 0 4px 16px rgba(0, 160, 255, 0.28);
    transition: opacity 180ms, transform 180ms;
  }

  .composer button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .composer button:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .text-button {
    margin-top: 14px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--accent);
    font-weight: 700;
  }

  /* ── Quick Voice Panel ─────────────────────────────────────── */
  .voice-panel {
    padding: 14px 20px 0;
    border-top: 1px solid rgba(0, 180, 255, 0.07);
    background: rgba(0, 20, 46, 0.28);
  }

  .voice-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }

  .voice-provider-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    background: rgba(0, 180, 255, 0.06);
    color: rgba(140, 224, 255, 0.9);
    font-size: 0.63rem;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .voice-provider-badge.pending {
    border-color: rgba(255, 210, 120, 0.35);
    background: rgba(255, 190, 60, 0.12);
    color: rgba(255, 222, 152, 0.95);
  }

  .voice-provider-badge.ok {
    border-color: rgba(62, 216, 164, 0.42);
    background: rgba(22, 190, 132, 0.16);
    color: rgba(144, 244, 210, 0.95);
  }

  .voice-provider-badge.alert {
    border-color: rgba(255, 115, 115, 0.55);
    background: rgba(255, 96, 96, 0.16);
    color: rgba(255, 188, 188, 0.98);
    box-shadow: 0 0 12px rgba(255, 96, 96, 0.2);
  }

  /* ── Mini Brain ────────────────────────────────────────────── */
  .mini-brain {
    width: 100%;
    margin-top: 14px;
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(4, 12, 28, 0.5);
    backdrop-filter: blur(20px);
    font-family: "JetBrains Mono", "Courier New", monospace;
    box-shadow: inset 0 1px 0 rgba(78, 255, 200, 0.05), 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  .mini-brain-header {
    font-size: 0.55rem;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(160, 255, 225, 0.5);
    margin-bottom: 10px;
  }

  .mini-brain-mood {
    display: grid;
    gap: 7px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 245, 255, 0.08);
  }

  .mb-stat {
    display: grid;
    grid-template-columns: 28px 1fr 36px;
    align-items: center;
    gap: 6px;
  }

  .mb-label {
    font-size: 0.54rem;
    font-weight: 900;
    color: rgba(0, 245, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .mb-bar-track {
    height: 3px;
    border-radius: 999px;
    background: rgba(0, 245, 255, 0.08);
    overflow: hidden;
  }

  .mb-bar-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #4effd8, #8866ff);
    box-shadow: 0 0 8px rgba(78, 255, 200, 0.4);
    transition: width 0.5s ease;
  }

  .mb-val {
    font-size: 0.66rem;
    font-weight: 500;
    color: rgba(160, 255, 225, 0.9);
    text-align: right;
    letter-spacing: 0.02em;
  }

  .mini-brain-narrative {
    font-size: 0.63rem;
    line-height: 1.45;
    color: rgba(180, 230, 255, 0.75);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-style: italic;
  }

  .voice-panel-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: rgba(0, 200, 255, 0.50);
    font-family: "JetBrains Mono", "Courier New", monospace;
  }

  .voice-panel-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 6px var(--accent);
    animation: vcp-blink 1.6s ease-in-out infinite;
  }

  @keyframes vcp-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }

  .voice-open-lab {
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.22);
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 150ms ease, box-shadow 150ms ease;
  }

  .voice-open-lab:hover {
    background: rgba(0, 180, 255, 0.12);
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.14);
  }

  .voice-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-bottom: 12px;
  }

  .voice-toggle {
    display: flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
    user-select: none;
  }

  .voice-toggle input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .voice-toggle-track {
    position: relative;
    flex-shrink: 0;
    width: 34px;
    height: 19px;
    border-radius: 10px;
    background: rgba(0, 180, 255, 0.09);
    border: 1px solid rgba(0, 180, 255, 0.18);
    transition: background 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
  }

  .voice-toggle-track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: rgba(0, 180, 255, 0.30);
    transition: transform 200ms ease, background 200ms ease, box-shadow 200ms ease;
  }

  .voice-toggle input:checked + .voice-toggle-track {
    background: rgba(0, 200, 255, 0.16);
    border-color: rgba(0, 200, 255, 0.50);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.20);
  }

  .voice-toggle input:checked + .voice-toggle-track::after {
    transform: translateX(15px);
    background: var(--accent);
    box-shadow: 0 0 7px rgba(0, 200, 255, 0.75);
  }

  .voice-toggle-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }

  .voice-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    padding-bottom: 14px;
  }

  .voice-telemetry {
    margin-top: -4px;
    margin-bottom: 12px;
    font-size: 0.66rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(168, 224, 255, 0.8);
    line-height: 1.45;
  }

  @keyframes personality-event-fadein {
    from { opacity: 0; transform: translateY(6px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .personality-events {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .personality-event-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 10px 5px 9px;
    border-radius: 20px;
    border: 1px solid rgba(255, 200, 80, 0.3);
    background: rgba(255, 175, 40, 0.08);
    color: rgba(255, 215, 100, 0.9);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    animation: personality-event-fadein 220ms ease forwards;
    box-shadow: 0 0 10px rgba(255, 200, 60, 0.10);
    max-width: 100%;
  }

  .personality-event-chip.catchphrase {
    border-color: rgba(255, 200, 80, 0.34);
    background: rgba(255, 175, 40, 0.1);
  }

  .personality-event-chip.voice-tag {
    border-color: rgba(90, 210, 255, 0.34);
    background: rgba(50, 180, 255, 0.1);
    color: rgba(170, 235, 255, 0.92);
  }

  .personality-event-label {
    font-size: 0.58rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255, 220, 150, 0.66);
    white-space: nowrap;
  }

  .personality-event-chip.voice-tag .personality-event-label {
    color: rgba(150, 225, 255, 0.72);
  }

  .personality-event-text {
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }

  .personality-event-count {
    margin-left: 4px;
    padding: 0 5px;
    border-radius: 999px;
    font-size: 0.56rem;
    letter-spacing: 0.08em;
    border: 1px solid rgba(255, 220, 150, 0.35);
    color: rgba(255, 235, 190, 0.9);
    background: rgba(255, 220, 150, 0.1);
  }

  .expressive-speech {
    margin-top: 2px;
    margin-bottom: 10px;
    padding: 6px 11px;
    border-left: 2px solid rgba(180, 130, 255, 0.45);
    background: rgba(150, 90, 255, 0.06);
    border-radius: 0 7px 7px 0;
    font-size: 0.78rem;
    font-style: italic;
    color: rgba(210, 180, 255, 0.88);
    line-height: 1.4;
    letter-spacing: 0.01em;
  }

  .expressive-speech-label {
    display: block;
    font-size: 0.56rem;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(180, 130, 255, 0.55);
    margin-bottom: 3px;
  }

  /* ── Icon Action Buttons ───────────────────────────────────── */
  .voice-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 14px;
  }

  .voice-icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(78, 255, 200, 0.06);
    color: rgba(160, 255, 225, 0.85);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.22s ease;
    flex-shrink: 0;
  }

  .voice-icon-btn:hover:not(:disabled) {
    background: rgba(78, 255, 200, 0.12);
    border-color: rgba(78, 255, 200, 0.3);
    box-shadow: 0 0 20px rgba(78, 255, 200, 0.2), inset 0 0 12px rgba(78, 255, 200, 0.05);
    transform: translateY(-1px);
    color: #7effd8;
  }

  .voice-icon-btn:active {
    transform: translateY(0);
  }

  .voice-icon-btn.primary {
    background: linear-gradient(135deg, rgba(78, 255, 200, 0.14), rgba(100, 60, 220, 0.16));
    border-color: rgba(78, 255, 200, 0.25);
    box-shadow: 0 4px 20px rgba(78, 255, 200, 0.12);
  }

  .voice-icon-btn.primary:hover:not(:disabled) {
    box-shadow: 0 6px 28px rgba(78, 255, 200, 0.28);
  }

  .voice-icon-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Tooltip */
  .voice-icon-btn::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    padding: 5px 11px;
    border-radius: 10px;
    background: rgba(2, 8, 20, 0.96);
    border: 1px solid rgba(78, 255, 200, 0.15);
    color: rgba(200, 255, 240, 0.9);
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease;
    z-index: 100;
    backdrop-filter: blur(12px);
  }

  .voice-icon-btn:hover::after {
    opacity: 1;
  }

  /* Keep legacy voice-btn for any remaining uses */
  .voice-btn {
    padding: 9px 15px;
    border: none;
    border-radius: 9px;
    background: linear-gradient(135deg, var(--accent), var(--accent-deep));
    color: #fff;
    font-weight: 800;
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 3px 12px rgba(0, 160, 255, 0.24);
    cursor: pointer;
    transition: box-shadow 160ms ease, transform 100ms ease;
  }

  .voice-btn:hover {
    box-shadow: 0 5px 18px rgba(0, 160, 255, 0.38);
    transform: translateY(-1px);
  }

  .voice-btn:active { transform: translateY(0); }

  .voice-btn.sec {
    background: rgba(0, 180, 255, 0.06);
    border: 1px solid rgba(0, 180, 255, 0.20);
    color: var(--accent);
    box-shadow: none;
  }

  .voice-btn.sec:hover {
    background: rgba(0, 180, 255, 0.10);
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.12);
  }

  .voice-btn:disabled {
    opacity: 0.40;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .audio-player {
    width: 100%;
    margin-top: 10px;
    margin-bottom: 2px;
    border-radius: 8px;
    accent-color: var(--accent);
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
  }

  .speed-control-label {
    font-size: 0.68rem;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(180, 130, 255, 0.55);
    margin-right: 3px;
  }

  .speed-btn {
    padding: 3px 9px;
    border: 1px solid rgba(0, 180, 255, 0.20);
    border-radius: 6px;
    background: rgba(0, 180, 255, 0.04);
    color: var(--accent);
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 120ms, border-color 120ms;
  }

  .speed-btn:hover {
    background: rgba(0, 180, 255, 0.10);
  }

  .speed-btn.active {
    background: rgba(0, 180, 255, 0.15);
    border-color: rgba(0, 180, 255, 0.50);
    color: #fff;
  }

  @media (max-width: 720px) {
    .composer {
      grid-template-columns: 1fr;
    }

    .composer button {
      width: 100%;
    }

    .message-bubble {
      max-width: 100%;
    }

    .voice-toggles {
      flex-direction: column;
      gap: 12px;
    }
  }

  @keyframes livePulse {
    0% { transform: scale(0.85); opacity: 0.55; }
    50% { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(0.85); opacity: 0.55; }
  }

  /* ── Spatial Organic Card (Vision Pro + Bioluminescent) ──── */
  .chat-card {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr) 280px;
    grid-template-rows: auto minmax(680px, auto) auto;
    border-radius: 32px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: linear-gradient(160deg, rgba(0, 4, 14, 0.90), rgba(2, 5, 18, 0.94));
    box-shadow:
      0 0 80px -20px rgba(78, 255, 200, 0.18),
      0 0 120px -40px rgba(130, 80, 255, 0.12),
      0 32px 100px rgba(0, 0, 0, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    will-change: transform;
  }

  /* Shimmer overlay — follows cursor */
  .holo-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    border-radius: inherit;
    mix-blend-mode: screen;
    transition: background 0.1s linear;
  }

  /* No scan-lines — clean spatial look */
  .chat-card::before { display: none; }

  /* Soft top-left bioluminescent bloom */
  .chat-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(
      ellipse at 15% 10%,
      rgba(78, 255, 200, 0.04) 0%,
      transparent 50%
    ), radial-gradient(
      ellipse at 85% 90%,
      rgba(130, 80, 255, 0.04) 0%,
      transparent 50%
    );
  }

  /* ── Ambient Avatar Panel ───────────────────────────────── */
  .avatar-panel {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    padding: 22px 12px 18px;
    border-right: 1px solid rgba(0, 245, 255, 0.1);
    background: linear-gradient(180deg,
      rgba(0, 245, 255, 0.04) 0%,
      rgba(176, 60, 248, 0.04) 60%,
      rgba(3, 8, 18, 0.0) 100%);
    position: relative;
    overflow: hidden;
  }

  .avatar-panel::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.3), transparent);
  }

  /* ── Avatar Orb: bioluminescent breathing glow ──────────────── */
  @keyframes holoAvatarPulse {
    0%, 100% {
      filter:
        drop-shadow(0 0 14px rgba(78, 255, 200, 0.35))
        drop-shadow(0 0 32px rgba(130, 80, 255, 0.18));
    }
    50% {
      filter:
        drop-shadow(0 0 28px rgba(78, 255, 200, 0.65))
        drop-shadow(0 0 60px rgba(130, 80, 255, 0.38))
        drop-shadow(0 0 10px rgba(200, 255, 240, 0.2));
    }
  }

  .avatar-panel-orb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    animation: holoAvatarPulse 4s ease-in-out infinite;
  }

  .avatar-panel-orb .avatar-core {
    --size: 104px !important;
  }

  /* ── Persona name: clean spatial typography ─────────────── */
  .avatar-panel-name {
    margin-top: 16px;
    font-size: 1.1rem;
    font-weight: 300;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(230, 255, 248, 0.95);
    text-align: center;
    text-shadow:
      0 0 18px rgba(78, 255, 200, 0.55),
      0 0 40px rgba(78, 255, 200, 0.2);
  }

  .avatar-panel-mood {
    margin-top: 10px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    text-align: center;
  }

  .avatar-panel-zone-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid var(--zone-border, rgba(0, 234, 255, 0.25));
    color: var(--zone-text, rgba(0, 234, 255, 0.8));
    background: var(--zone-surface, rgba(0, 234, 255, 0.08));
    box-shadow: 0 0 14px var(--zone-glow, rgba(0, 234, 255, 0.2));
  }

  @keyframes zoneShiftPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 255, 255, 0); }
    48% { transform: scale(1.05); box-shadow: 0 0 16px var(--zone-glow, rgba(0, 234, 255, 0.35)); }
    100% { transform: scale(1); box-shadow: 0 0 14px var(--zone-glow, rgba(0, 234, 255, 0.2)); }
  }

  .avatar-panel-zone-pill.zone-shift {
    animation: zoneShiftPulse 520ms ease;
  }

  .avatar-panel-emotion {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: rgba(212, 235, 255, 0.94);
    line-height: 1.45;
  }

  .avatar-panel-spectrum {
    margin-top: 2px;
    width: 100%;
    padding: 0 6px;
  }

  .avatar-panel-spectrum-track {
    position: relative;
    height: 6px;
    width: 100%;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(196, 224, 255, 0.18);
    background: linear-gradient(90deg,
      rgba(96, 165, 250, 0.8) 0%,
      rgba(52, 211, 153, 0.86) 36%,
      rgba(251, 191, 36, 0.9) 66%,
      rgba(251, 113, 133, 0.9) 100%);
  }

  .avatar-panel-spectrum-marker {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.85);
    background: var(--zone-accent, #00eaff);
    box-shadow: 0 0 12px var(--zone-glow, rgba(0, 234, 255, 0.4));
    transform: translate(-50%, -50%);
    transition: left 420ms ease;
  }

  @keyframes zoneMarkerFlash {
    0% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.2); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }

  .avatar-panel-spectrum-marker.zone-shift {
    animation: zoneMarkerFlash 520ms ease;
  }

  .avatar-panel-intensity {
    margin-top: 4px;
    font-size: 0.56rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(188, 220, 245, 0.72);
  }

  .avatar-panel-drift {
    width: 100%;
    margin-top: 6px;
    border: 1px solid rgba(134, 205, 255, 0.2);
    border-radius: 10px;
    background: rgba(3, 16, 34, 0.6);
    padding: 4px 6px 5px;
  }

  .avatar-panel-drift-label {
    font-size: 0.52rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(169, 216, 252, 0.64);
    margin-bottom: 2px;
  }

  .avatar-panel-drift svg {
    width: 100%;
    height: 24px;
    display: block;
  }

  .avatar-panel-drift-axis {
    stroke: rgba(160, 200, 236, 0.32);
    stroke-width: 1;
    stroke-dasharray: 2 2;
  }

  .avatar-panel-drift-line {
    fill: none;
    stroke: #8de8ff;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 4px rgba(141, 232, 255, 0.45));
  }

  .avatar-panel-divider {
    width: 48px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 234, 255, 0.22), transparent);
    margin: 16px 0 12px;
    flex-shrink: 0;
  }

  .avatar-panel-stats {
    display: flex;
    flex-direction: column;
    gap: 7px;
    width: 100%;
    padding: 0 4px;
  }

  .avatar-panel-stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .avatar-panel-stat-label {
    font-size: 0.60rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(0, 200, 255, 0.38);
  }

  .avatar-panel-bar-track {
    height: 3px;
    border-radius: 999px;
    background: rgba(0, 200, 255, 0.08);
    overflow: hidden;
  }

  .avatar-panel-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 600ms ease;
  }

  .avatar-panel-phase {
    margin-top: auto;
    padding-top: 14px;
    width: 100%;
    text-align: center;
  }

  .avatar-panel-phase-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(0, 234, 255, 0.14);
    background: rgba(0, 234, 255, 0.05);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(0, 234, 255, 0.55);
    transition: color 300ms, border-color 300ms, background 300ms;
  }

  .avatar-panel-phase-badge.active {
    color: #00eaff;
    border-color: rgba(0, 234, 255, 0.38);
    background: rgba(0, 234, 255, 0.10);
    box-shadow: 0 0 12px rgba(0, 234, 255, 0.18);
  }

  .chat-header {
    grid-column: 1 / -1;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(0, 234, 255, 0.10);
    background: linear-gradient(180deg, rgba(0, 234, 255, 0.04), rgba(255, 62, 207, 0.02));
  }

  .chat-header h3 {
    font-size: 1rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .chat-header p {
    color: #90a8c8;
  }

  .debug-toggle {
    border-radius: 12px;
    border-color: rgba(0, 234, 255, 0.16);
    background: rgba(0, 234, 255, 0.05);
    color: #8eecff;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .message-list {
    grid-column: 2;
    min-height: 680px;
    max-height: min(88vh, 980px);
    padding: 16px 18px;
    position: relative;
    z-index: 1;
    background:
      linear-gradient(180deg, rgba(1, 7, 18, 0.88), rgba(4, 10, 22, 0.80)),
      radial-gradient(circle at 20% 10%, rgba(0, 245, 255, 0.05), transparent 45%),
      radial-gradient(circle at 80% 90%, rgba(180, 60, 255, 0.04), transparent 45%);
  }

  .message-bubble {
    border-radius: 18px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .message-bubble.user {
    background: linear-gradient(135deg, rgba(110, 60, 200, 0.22), rgba(60, 30, 160, 0.18));
    border-color: rgba(160, 120, 255, 0.15);
  }

  .message-bubble.assistant {
    background: rgba(4, 16, 32, 0.55);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .message-role {
    color: rgba(160, 255, 225, 0.7);
  }

  /* Voice panel */
  .voice-panel {
    grid-column: 3;
    grid-row: 2;
    align-self: start;
    margin: 16px 16px 0 0;
    padding: 14px;
    border-radius: 22px;
    border: 1px solid rgba(0, 245, 255, 0.15);
    background: linear-gradient(180deg, rgba(0, 5, 18, 0.97), rgba(2, 8, 24, 0.94));
    box-shadow:
      inset 0 0 24px rgba(0, 245, 255, 0.05),
      0 0 28px rgba(0, 245, 255, 0.08);
  }

  .voice-quick-copy {
    color: #9ac0d8;
  }

  .voice-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .voice-checkbox {
    padding-top: 0;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 234, 255, 0.10);
    background: rgba(0, 234, 255, 0.04);
  }

  .voice-actions {
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    gap: 8px;
    padding-bottom: 14px;
    margin-top: 18px;
  }

  .voice-actions .voice-icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .voice-quick-controls {
    display: grid;
    gap: 10px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 234, 255, 0.08);
  }

  .voice-control-row {
    display: grid;
    gap: 4px;
  }

  .voice-control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .voice-control-label {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    color: rgba(144, 224, 255, 0.6);
    letter-spacing: 0.05em;
  }

  .voice-control-value {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--accent);
    font-family: "JetBrains Mono", monospace;
  }

  .voice-slider {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    background: rgba(0, 234, 255, 0.1);
    border-radius: 999px;
    outline: none;
  }

  .voice-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px rgba(0, 234, 255, 0.5);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .voice-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .audio-player {
    border-radius: 12px;
    opacity: 0.92;
  }

  .composer {
    grid-column: 1 / -1;
    padding: 14px 18px 18px;
    border-top: 1px solid rgba(0, 234, 255, 0.08);
    background: rgba(0, 234, 255, 0.02);
  }

  .composer textarea {
    border-radius: 14px;
    background: rgba(2, 10, 24, 0.96);
  }

  .composer button {
    min-width: 150px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── Neural activity sync — chat-card glow + avatar tilt ───── */
  @keyframes neuralCardPulse {
    0%, 100% {
      box-shadow:
        0 0 80px -20px rgba(78, 255, 200, 0.18),
        0 0 120px -40px rgba(130, 80, 255, 0.12),
        0 32px 100px rgba(0, 0, 0, 0.75),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    50% {
      box-shadow:
        0 0 100px -15px rgba(78, 255, 200, 0.38),
        0 0 140px -30px rgba(130, 80, 255, 0.25),
        0 32px 100px rgba(0, 0, 0, 0.75),
        inset 0 1px 0 rgba(255, 255, 255, 0.07);
    }
  }

  @keyframes avatarTiltThink {
    0%, 100% { transform: rotate(-2deg) scale(1.0); }
    50% { transform: rotate(2deg) scale(1.02); }
  }

  .chat-card.neural-active {
    animation: neuralCardPulse 1.4s ease-in-out infinite;
    border-color: rgba(0, 234, 255, 0.26);
  }

  .context-meter {
    position: absolute;
    right: 14px;
    bottom: 96px;
    z-index: 4;
    width: min(280px, calc(100% - 28px));
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 234, 255, 0.22);
    background: rgba(4, 12, 26, 0.9);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32);
    backdrop-filter: blur(4px);
  }

  .context-meter.warn {
    border-color: rgba(255, 177, 77, 0.45);
  }

  .context-meter.danger {
    border-color: rgba(255, 107, 120, 0.58);
  }

  .context-meter-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
  }

  .context-meter-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .context-meter-label {
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #87deff;
    font-weight: 700;
  }

  .context-meter-value {
    font-size: 0.78rem;
    color: #d4f4ff;
    font-variant-numeric: tabular-nums;
  }

  .context-meter-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 220, 255, 0.14);
    overflow: hidden;
  }

  .context-meter-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #16c9ff 0%, #55efc4 58%, #ffc76b 100%);
    transition: width 160ms ease;
  }

  .context-meter-meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 0.7rem;
    color: #8fb3c8;
    font-variant-numeric: tabular-nums;
  }

  .context-meter-info {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 1px solid rgba(135, 222, 255, 0.28);
    border-radius: 999px;
    background: rgba(10, 26, 44, 0.92);
    color: #8fe8ff;
    font-size: 0.68rem;
    font-weight: 800;
    cursor: help;
  }

  .context-meter-info:focus-visible {
    outline: 2px solid rgba(120, 224, 255, 0.8);
    outline-offset: 2px;
  }

  .context-meter-details {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    width: min(260px, calc(100vw - 44px));
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 234, 255, 0.2);
    background: rgba(3, 10, 22, 0.96);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.34);
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition: opacity 140ms ease, transform 140ms ease;
  }

  .context-meter:hover .context-meter-details,
  .context-meter:focus-within .context-meter-details {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .context-meter-details-title {
    margin-bottom: 8px;
    color: #d8f6ff;
    font-size: 0.73rem;
    font-weight: 700;
  }

  .context-meter-details-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 10px;
    font-size: 0.72rem;
    line-height: 1.4;
  }

  .context-meter-details-grid dt {
    color: #81bad1;
  }

  .context-meter-details-grid dd {
    margin: 0;
    color: #eefbff;
    text-align: right;
    word-break: break-word;
  }

  .avatar-panel-orb.thinking-tilt {
    animation: avatarTiltThink 1.6s ease-in-out infinite;
  }

  @media (max-width: 980px) {
    .chat-card {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
    }

    .avatar-panel {
      display: none;
    }

    .message-list {
      grid-column: 1;
    }

    .voice-panel {
      grid-column: 1;
      grid-row: auto;
      margin: 0 16px 16px;
    }

    .context-meter {
      left: 14px;
      right: 14px;
      width: auto;
      bottom: 92px;
    }
  }
`;

function resolvePerformanceTier(profile, mode, prefersReducedMotion) {
  if (prefersReducedMotion) {
    return "light";
  }

  const tier = String(profile?.performanceTier || "").trim().toLowerCase();
  if (["light", "balanced", "full"].includes(tier)) {
    return tier;
  }

  return mode === "kids" ? "light" : "balanced";
}

function formatAssistantContentForMode(content, mode) {
  const text = String(content || "");
  if (mode !== "normal" || !text.trim()) {
    return { main: text, nextQuestions: "" };
  }

  const answerSection = text.match(
    /(?:^|\n)\s*(?:1\)\s*)?Answer\s*:?\s*\n([\s\S]*?)(?=\n\s*2\)\s*Evidence|\n\s*3\)\s*Uncertainty|\n\s*4\)\s*Next Questions|$)/i,
  );

  if (answerSection?.[1]) {
    return { main: String(answerSection[1]).trim(), nextQuestions: "" };
  }

  const stripped = text
    .replace(/\n?\s*2\)\s*Evidence\s*[\s\S]*?(?=\n\s*3\)\s*Uncertainty|\n\s*4\)\s*Next Questions|$)/i, "")
    .replace(/\n?\s*3\)\s*Uncertainty\s*[\s\S]*?(?=\n\s*4\)\s*Next Questions|$)/i, "")
    .replace(/\n?\s*4\)\s*Next Questions\s*[\s\S]*$/i, "")
    .replace(/^\s*(?:1\)\s*)?Answer\s*:?\s*\n?/i, "")
    .trim();

  return { main: stripped, nextQuestions: "" };
}

function getAssistantDisplayContent(message, mode) {
  const rawContent = String(message?.content || "");
  const plannedDisplay = String(message?.utterancePlan?.displayText || "");
  const displayContent = String(message?.displayContent || plannedDisplay || "");
  const chatVisibleContent = mode === "scientist"
    ? rawContent
    : displayContent || extractEPFDialogue(rawContent) || rawContent;

  return formatAssistantContentForMode(chatVisibleContent, mode);
}

function getAssistantSpeechContent(message) {
  const rawContent = String(message?.content || "");
  const plannedSpeech = String(message?.utterancePlan?.speechText || "");
  return plannedSpeech || String(message?.displayContent || "") || extractEPFDialogue(rawContent) || rawContent;
}

function getResponseLensSummary(debug) {
  const lens = debug?.responseLens;
  const label = String(lens?.label || lens?.id || "").trim();
  if (!label) {
    return null;
  }

  const source = String(lens?.source || "default").trim();
  const score = Number(lens?.score);
  const priorities = Array.isArray(lens?.priority)
    ? lens.priority.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const reasons = Array.isArray(lens?.reasons)
    ? lens.reasons.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  let body = `This reply was routed through the ${label} lens.`;
  if (priorities.length > 0) {
    body += ` That means the model was pushed to ${priorities[0]}.`;
  }
  if (reasons.length > 0) {
    body += ` It was selected because ${reasons[0].charAt(0).toLowerCase()}${reasons[0].slice(1)}.`;
  } else if (source === "default") {
    body += " No stronger lens matched, so the system fell back to the persona's default focus.";
  }

  const chips = [
    `lens: ${label}`,
    `source: ${source}`,
  ];

  if (Number.isFinite(score)) {
    chips.push(`score: ${score.toFixed(2)}`);
  }

  if (debug?.flags?.embeddingsConfigured === false) {
    chips.push("memory embeddings: disabled");
    body += " Semantic memory embeddings are currently disabled, so recall ranking may be less precise.";
  }

  return {
    title: "Response Lens",
    body,
    chips,
  };
}

function buildTtsErrorMessage(error) {
  const base = String(error?.message || "Failed to generate speech.").trim();
  const provider = String(error?.ttsProvider || "").trim().toLowerCase();
  const providerCode = String(error?.ttsProviderCode || "").trim().toLowerCase();
  const providerStatus = Number(error?.ttsProviderStatus || 0);
  const httpStatus = Number(error?.httpStatus || 0);
  const isHtmlErrorPage = Boolean(error?.isHtmlErrorPage);
  const ttsHealthSnapshot = error?.ttsHealthSnapshot;

  const getRoutingHint = () => {
    if (!ttsHealthSnapshot || typeof ttsHealthSnapshot !== "object") {
      return "";
    }

    const debugLockEnabled = Boolean(ttsHealthSnapshot?.routing?.debugLockEnabled);
    const allowedEngines = Array.isArray(ttsHealthSnapshot?.routing?.allowedEngines)
      ? ttsHealthSnapshot.routing.allowedEngines.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const requestedEngine = String(ttsHealthSnapshot?.routing?.requestedEngine || "").trim().toLowerCase();
    const cartesiaConnected = Boolean(ttsHealthSnapshot?.engines?.cartesia?.connected);
    const cartesiaError = String(ttsHealthSnapshot?.engines?.cartesia?.error || "").trim();

    const parts = [];
    if (debugLockEnabled) {
      parts.push(`debug lock is on (allowed: ${allowedEngines.length ? allowedEngines.join(", ") : "none"})`);
    }
    if (requestedEngine) {
      parts.push(`requested engine=${requestedEngine}`);
    }
    if (cartesiaConnected) {
      parts.push("cartesia reports connected");
    } else if (cartesiaError) {
      parts.push(`cartesia health error: ${cartesiaError}`);
    }

    return parts.length ? ` Live TTS health: ${parts.join("; ")}.` : "";
  };

  if (isHtmlErrorPage && httpStatus === 502) {
    const effectiveLockEnabled = ttsHealthSnapshot && typeof ttsHealthSnapshot === "object"
      ? Boolean(ttsHealthSnapshot?.routing?.debugLockEnabled)
      : TTS_DEBUG_PROVIDER_LOCK;

    const lockHint = effectiveLockEnabled
      ? " Debug lock is enabled, so fallback engines may be blocked; verify the active provider credentials/voice/model or temporarily disable the lock for fallback."
      : "";

    return [
      "Speech request failed with an upstream HTML 502 before Voxis could return provider diagnostics.",
      "This usually means the reverse proxy/gateway failed while waiting on backend TTS.",
      getRoutingHint().trim(),
      "Check backend PM2 logs and nginx error logs.",
      lockHint.trim(),
      "Quick checks: /health and /health/tts.",
    ].filter(Boolean).join(" ");
  }

  if (!provider) {
    return base;
  }

  const hint = provider === "cartesia"
    ? providerStatus === 401 || providerStatus === 403
      ? "Cartesia auth failed. Re-save your Cartesia API key in Voice Provider Credentials."
      : providerStatus === 429
        ? "Cartesia rate limit hit. Retry in a moment or switch providers."
        : providerStatus === 504 || providerCode === "timeout"
          ? "Cartesia timed out. Try shorter text or verify model/voice settings."
          : providerStatus === 400 || /voice|model|invalid/.test(providerCode)
            ? "Cartesia rejected the voice/model combo. Verify voice ID (UUID) and model."
            : "Cartesia request failed. Verify provider credentials and voice/model settings."
    : provider === "elevenlabs"
      ? providerStatus === 429
        ? "ElevenLabs is rate limited. Retry shortly or use another engine."
        : "ElevenLabs request failed. Verify API key and selected voice."
      : provider === "cloud"
        ? providerStatus === 401 || providerStatus === 403
          ? "Cloud TTS auth failed. Verify TTS/OpenAI API key configuration."
          : providerStatus === 429
            ? "Cloud TTS rate limit hit. Retry shortly."
            : "Cloud TTS request failed. Verify provider settings."
        : provider === "kokoro"
          ? "Kokoro failed during synthesis. Check model preload and server resources."
          : provider === "piper"
            ? "Piper failed. Verify model path, binary, and synthesis timeout settings."
            : "TTS provider request failed. Verify provider settings.";

  const detailSuffix = ` [provider=${provider}${providerCode ? ` code=${providerCode}` : ""}${providerStatus ? ` status=${providerStatus}` : ""}]`;
  return `${base} ${hint}${detailSuffix}`.trim();
}

async function fetchTtsHealthSnapshot(authFetch) {
  if (typeof authFetch !== "function") {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1800);

  try {
    const response = await authFetch("/health/tts", {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!payload || typeof payload !== "object") {
      return null;
    }

    return {
      routing: {
        debugLockEnabled: Boolean(payload?.routing?.debugLockEnabled),
        allowedEngines: Array.isArray(payload?.routing?.allowedEngines)
          ? payload.routing.allowedEngines
          : [],
        requestedEngine: String(payload?.routing?.requestedEngine || "").trim().toLowerCase(),
      },
      engines: {
        cartesia: {
          connected: Boolean(payload?.engines?.cartesia?.connected),
          error: String(payload?.engines?.cartesia?.error || "").trim(),
        },
      },
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const MAX_STREAM_READY_AUDIO = 3;
const MAX_STREAM_SENTENCE_CHARS = 260;
const DOT_PLACEHOLDER = "__VOXIS_DOT__";
const COMMON_ABBREVIATIONS = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Prof.",
  "Sr.",
  "Jr.",
  "St.",
  "vs.",
  "etc.",
  "i.e.",
  "e.g.",
  "U.S.",
  "U.K.",
  "No.",
];

function escapeRegex(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitCompleteSentences(text) {
  const source = String(text || "");
  if (!source.trim()) {
    return { sentences: [], remainder: "" };
  }

  let protectedSource = source;
  for (const abbr of COMMON_ABBREVIATIONS) {
    protectedSource = protectedSource.replace(
      new RegExp(escapeRegex(abbr), "g"),
      abbr.replace(/\./g, DOT_PLACEHOLDER),
    );
  }

  const sentences = [];
  const matcher = /[^.!?\n]+[.!?]+["')\]]*\s*/g;
  let match = null;
  let consumedEnd = 0;

  while ((match = matcher.exec(protectedSource)) !== null) {
    const sentence = String(match[0] || "")
      .replace(new RegExp(DOT_PLACEHOLDER, "g"), ".")
      .trim();
    if (sentence) {
      sentences.push(sentence);
    }
    consumedEnd = matcher.lastIndex;
  }

  return {
    sentences,
    remainder: protectedSource
      .slice(consumedEnd)
      .replace(new RegExp(DOT_PLACEHOLDER, "g"), ".")
      .trim(),
  };
}

function normalizeSpeechChunk(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLongSpeechChunk(text, maxChars = MAX_STREAM_SENTENCE_CHARS) {
  const normalized = normalizeSpeechChunk(text);
  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const chunks = [];
  let remaining = normalized;

  while (remaining.length > maxChars) {
    let splitAt = remaining.lastIndexOf(",", maxChars);
    if (splitAt < Math.floor(maxChars * 0.4)) {
      splitAt = remaining.lastIndexOf(" ", maxChars);
    }
    if (splitAt <= 0) {
      splitAt = maxChars;
    }

    const part = remaining.slice(0, splitAt).trim();
    if (part) {
      chunks.push(part);
    }
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function coalescePersonalityEvents(events, nowMs = Date.now()) {
  const map = new Map();

  for (const rawEvent of Array.isArray(events) ? events : []) {
    const type = String(rawEvent?.type || "event").trim().toLowerCase();
    const delivery = String(rawEvent?.delivery || "overlay").trim().toLowerCase();
    const spoken = Boolean(rawEvent?.spoken);
    const text = String(rawEvent?.text || "").trim();
    const tag = String(rawEvent?.tag || "").trim();
    const labelText = text || tag;

    if (!labelText) {
      continue;
    }

    const key = `${type}:${delivery}:${spoken ? "spoken" : "silent"}:${labelText.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastSeenMs = nowMs;
      continue;
    }

    map.set(key, {
      key,
      type,
      delivery,
      spoken,
      tag,
      text,
      count: 1,
      lastSeenMs: nowMs,
    });
  }

  return Array.from(map.values());
}

export default function ChatWindow({
  personality,
  messages,
  liveDebug,
  stateDriftHistory = [],
  livePhase,
  liveSeq,
  liveReply,
  liveUsage,
  liveVoiceAdjustments = null,
  liveSingingActive = false,
  nativeLlmAudioChunks = null,
  nativeTtsActive = false,
  activeMode,
  neuralProfile,
  disableNeuronMap3d = DEFAULT_DISABLE_NEURONMAP_3D,
  isLoadingMessages,
  isSending,
  onSend,
  onSaveVoiceProfile,
  onJumpToBuilder,
  onOpenVoiceLab,
  onStatus,
  onUpdateMemory,
  onOpenPersonaEditor,
  brainEvents = null,
}) {
  const authFetch = useAuthFetch();
  const [draft, setDraft] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState({
    enabled: true,
    autoplay: false,
    engine: "auto",
    pitch: 1,
    rate: 1,
    preferredVoice: "alloy",
    providerVoice: "alloy",
    kokoroVoice: "af_heart",
    providerModel: "gpt-4o-mini-tts",
    cartesiaVoiceId: "",
    cartesiaModel: "sonic-3",
    piperModelPath: "",
    piperSpeaker: null,
  });
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const currentPlayingUrlRef = useRef("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [speechPlaybackRate, setSpeechPlaybackRate] = useState(1);
  const [cartesiaVoiceOptions, setCartesiaVoiceOptions] = useState(CARTESIA_QUICK_VOICE_OPTIONS);
  const [isLoadingCartesiaVoices, setIsLoadingCartesiaVoices] = useState(false);
  const [cartesiaVoiceLoadError, setCartesiaVoiceLoadError] = useState("");
  const [voiceFavorites, setVoiceFavorites] = useState(() => readQuickVoiceFavorites());

  // Stable ref so the parallel voice buffer hook can reach interruptLiveCall before it's defined
  const interruptLiveCallRef = useRef(null);

  // Load voice favorites from server on mount, merging with local cache
  useEffect(() => {
    authFetch("/settings/voice-favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.favorites) {
          setVoiceFavorites(data.favorites);
          try { window.localStorage.setItem(QUICK_VOICE_FAVORITES_KEY, JSON.stringify(data.favorites)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* network failure — keep local */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [speechEnergy, setSpeechEnergy] = useState(0);
  const [voiceTelemetry, setVoiceTelemetry] = useState(null);
  const [activePersonalityEvents, setActivePersonalityEvents] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [sysObserverOpen, setSysObserverOpen] = useState(false);
  const [requestMetrics, setRequestMetrics] = useState(() => getRequestMetricsSnapshot());
  const [performanceText, setPerformanceText] = useState(null); // EPF text to perform
  const [emotionDrift, setEmotionDrift] = useState([]);
  const [zoneShiftActive, setZoneShiftActive] = useState(false);
  const lastGeneratedRef = useRef("");
  const lastNarrationRef = useRef("");
  const messageListRef = useRef(null);
  const audioRef = useRef(null);
  const currentAudioUrlRef = useRef("");
  const speechPlaybackRateRef = useRef(1);
  const speechEnergyTimerRef = useRef(null);
  const ttsRequestAbortRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const zoneShiftTimerRef = useRef(null);
  const personalityEventsTimerRef = useRef(null);
  const streamAutoplaySessionRef = useRef(null);
  const streamSentenceCursorRef = useRef(0);
  const streamQueuedSentenceKeysRef = useRef(new Set());
  const streamPendingSentenceQueueRef = useRef([]);
  const streamReadyAudioQueueRef = useRef([]);
  const streamQueueProcessingRef = useRef(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamPlaybackActiveRef = useRef(false);
  // ── Live Call ──────────────────────────────────────────────────────────────
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [showLiveBrainWindow, setShowLiveBrainWindow] = useState(true);
  const [liveBrainViewMode, setLiveBrainViewMode] = useState("full");
  const [liveBrainSnapZone, setLiveBrainSnapZone] = useState("center");
  const [liveBrainIsDragging, setLiveBrainIsDragging] = useState(false);
  const [liveBrainDragActiveZone, setLiveBrainDragActiveZone] = useState("center");
  const [liveBrainWindow, setLiveBrainWindow] = useState({
    x: 0,
    y: 0,
    width: 720,
    height: 560,
  });
  const [convPhase, rawDispatchConvPhase] = useReducer(convPhaseReducer, CONV_PHASE.IDLE);

  // ── Parallel voice buffer — shadow-listens while AI is speaking ─────────
  // Captures user utterances in the background during SPEAKING / GENERATING_AUDIO.
  // Hard interrupt words ("stop", "no", "wait") fire interruptLiveCall() immediately.
  // Fillers and substantive commentary are buffered and sent with the next message.
  const parallelListenActive =
    convPhase === CONV_PHASE.SPEAKING ||
    convPhase === CONV_PHASE.GENERATING_AUDIO;

  const { getBuffer: getVoiceBuffer, clearBuffer: clearVoiceBuffer } =
    useParallelVoiceBuffer({
      isActive: parallelListenActive,
      onHardInterrupt: () => {
        interruptLiveCallRef.current?.();
      },
    });
  // Debug event log — only active when ?debug-voice is in the URL.
  const liveCallDebugMode = useMemo(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug-voice"),
    [],
  );
  const [convEventLog, setConvEventLog] = useState([]);
  // Wrapped dispatcher: logs to convEventLog in debug mode, otherwise transparent.
  const dispatchConvPhase = useCallback((action) => {
    rawDispatchConvPhase(action);
    if (liveCallDebugMode) {
      setConvEventLog((prev) =>
        [{ action: action.type, ts: Date.now() }, ...prev].slice(0, 6),
      );
    }
  }, [liveCallDebugMode]);
  const liveCallActiveRef = useRef(false); // sync ref for async closures
  const liveCallMediaRecorderRef = useRef(null);
  const liveCallChunksRef = useRef([]);
  const liveCallMicStreamRef = useRef(null);
  const liveCallSilenceDetectorRef = useRef(null);
  const liveCallSilenceStartedAtRef = useRef(0);
  const liveCallSpeechDetectedRef = useRef(false);
  const liveCallMaxDurationTimerRef = useRef(null);
  const liveBrainWindowRef = useRef(null);
  const liveBrainDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const streamAutoplayUsedRef = useRef(false);
  const streamPostSendGraceUntilRef = useRef(0);
  const prevIsSendingRef = useRef(false);
  const autoplayAssistantBaselineRef = useRef(0);
  const prevZoneKeyRef = useRef("");
  // Tracks the latest voice adjustments from the chat pipeline — applied to TTS requests
  const pendingVoiceAdjustmentsRef = useRef(null);
  const pendingSingingActiveRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const cartesiaCatalogRequestInFlightRef = useRef(false);
  const cartesiaCatalogLastAttemptRef = useRef(0);
  const cartesiaCatalogActivatedRef = useRef(false);

  // Play audio produced natively by the LLM (gpt-4o-audio-preview) instead of calling TTS.
  const nativeAudioPlayedRef = useRef(null);
  useEffect(() => {
    if (!nativeTtsActive || !Array.isArray(nativeLlmAudioChunks) || nativeLlmAudioChunks.length === 0) {
      return;
    }
    const chunkKey = nativeLlmAudioChunks.length + ":" + (nativeLlmAudioChunks[0] || "").slice(0, 8);
    if (nativeAudioPlayedRef.current === chunkKey) {
      return;
    }
    nativeAudioPlayedRef.current = chunkKey;

    try {
      const combined = nativeLlmAudioChunks.join("");
      const byteChars = atob(combined);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      requestAnimationFrame(() => {
        const audioElement = audioRef.current;
        if (audioElement instanceof HTMLAudioElement) {
          audioElement.muted = false;
          audioElement.volume = 1;
          audioElement.playbackRate = speechPlaybackRateRef.current;
          void audioElement.play().catch(() => {});
        }
      });
    } catch {
      // Ignore decoding errors — TTS fallback can still work.
    }
  }, [nativeTtsActive, nativeLlmAudioChunks]);

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant") || null,
    [messages],
  );

  const latestAssistantDebug = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && message.debug)?.debug || null,
    [messages],
  );

  const latestAssistantUsage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && message.usage)?.usage || null,
    [messages],
  );

  const latestAssistantSpeechText = useMemo(
    () => getAssistantSpeechContent(latestAssistantMessage),
    [latestAssistantMessage],
  );

  const assistantMessageCount = useMemo(
    () => messages.reduce((count, message) => count + (message?.role === "assistant" ? 1 : 0), 0),
    [messages],
  );

  const activeUsage = liveUsage || latestAssistantUsage;
  const usagePercent = useMemo(() => {
    const ratio = Number(activeUsage?.percentUsed);
    if (Number.isFinite(ratio) && ratio >= 0) {
      return Math.min(100, Math.max(0, Math.round(ratio * 100)));
    }

    const total = Number(activeUsage?.totalTokens);
    const max = Number(activeUsage?.maxTokens);
    if (Number.isFinite(total) && Number.isFinite(max) && max > 0) {
      return Math.min(100, Math.max(0, Math.round((total / max) * 100)));
    }

    return 0;
  }, [activeUsage]);
  const usageModelLabel = useMemo(() => {
    const model = String(activeUsage?.model || "").trim();
    return model || "Unknown";
  }, [activeUsage]);
  const usageSourceLabel = useMemo(() => {
    return activeUsage?.source === "provider" ? "Provider-reported" : "Live estimate";
  }, [activeUsage]);

  const providerBadge = useMemo(() => {
    const chosenEngine = String(
      voiceTelemetry?.chosenEngine || voiceTelemetry?.requested || voiceProfile.engine || "auto",
    ).trim().toLowerCase() || "auto";

    if (!voiceProfile.enabled) {
      return {
        tone: "",
        label: "Voice Off",
      };
    }

    if (voiceTelemetry?.fallbackUsed) {
      return {
        tone: "alert",
        label: `Fallback -> ${chosenEngine}`,
      };
    }

    if (isGeneratingAudio) {
      return {
        tone: "pending",
        label: `Generating ${chosenEngine}`,
      };
    }

    return {
      tone: voiceTelemetry ? "ok" : "",
      label: `Provider ${chosenEngine}`,
    };
  }, [isGeneratingAudio, voiceProfile.enabled, voiceProfile.engine, voiceTelemetry]);

  const currentTtsEngine = useMemo(() => {
    return String(
      voiceTelemetry?.chosenEngine || voiceTelemetry?.requested || voiceProfile.engine || "auto",
    ).trim().toLowerCase() || "auto";
  }, [voiceProfile.engine, voiceTelemetry]);

  const selectedCartesiaVoiceOption = useMemo(() => {
    const currentVoiceId = String(voiceProfile.cartesiaVoiceId || "").trim();
    if (!currentVoiceId) {
      return cartesiaVoiceOptions[0]?.id || CUSTOM_CARTESIA_VOICE_OPTION;
    }

    const knownVoice = cartesiaVoiceOptions.some((voice) => voice.id === currentVoiceId);
    // If in the fetched list, return the ID directly; otherwise return the ID itself
    // so the injected "(saved)" option renders as selected instead of "Custom voice ID..."
    return knownVoice ? currentVoiceId : currentVoiceId;
  }, [voiceProfile.cartesiaVoiceId, cartesiaVoiceOptions]);

  const favoriteCartesiaVoiceIds = useMemo(
    () => new Set((Array.isArray(voiceFavorites?.cartesia) ? voiceFavorites.cartesia : []).map((item) => String(item?.id || "").trim()).filter(Boolean)),
    [voiceFavorites?.cartesia],
  );

  const favoriteKokoroVoiceIds = useMemo(
    () => new Set((Array.isArray(voiceFavorites?.kokoro) ? voiceFavorites.kokoro : []).map((item) => String(item?.id || "").trim()).filter(Boolean)),
    [voiceFavorites?.kokoro],
  );

  const cartesiaFavoriteOptions = useMemo(() => {
    if (!Array.isArray(voiceFavorites?.cartesia) || voiceFavorites.cartesia.length === 0) {
      return [];
    }
    const byId = new Map(cartesiaVoiceOptions.map((voice) => [String(voice.id || "").trim(), voice]));
    const merged = voiceFavorites.cartesia
      .map((favorite) => {
        const id = String(favorite?.id || "").trim();
        if (!id) {
          return null;
        }
        const live = byId.get(id);
        return {
          id,
          label: String(live?.label || favorite?.label || id),
        };
      })
      .filter(Boolean);

    const seen = new Set();
    return merged.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [cartesiaVoiceOptions, voiceFavorites?.cartesia]);

  const recommendedCartesiaVoice = useMemo(() => {
    const keywords = buildPersonaKeywords(personality);
    if (!keywords.size || !Array.isArray(cartesiaVoiceOptions) || cartesiaVoiceOptions.length === 0) {
      return null;
    }

    let best = null;
    let bestScore = 0;

    for (const voice of cartesiaVoiceOptions) {
      const label = String(voice?.label || voice?.id || "").trim().toLowerCase();
      if (!label) {
        continue;
      }
      const tags = Array.isArray(voice?.tags)
        ? voice.tags.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
        : [];
      const voiceTerms = new Set(
        [label, ...tags]
          .join(" ")
          .split(/[^a-z0-9]+/g)
          .map((item) => item.trim())
          .filter((item) => item.length >= 3),
      );
      let score = 0;
      for (const term of voiceTerms) {
        if (keywords.has(term)) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = voice;
      }
    }

    return bestScore > 0 ? best : null;
  }, [cartesiaVoiceOptions, personality]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(QUICK_VOICE_FAVORITES_KEY, JSON.stringify(voiceFavorites));
      }
    } catch {
      // Ignore localStorage write failures.
    }
    // Sync to server (fire-and-forget)
    authFetch("/settings/voice-favorites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites: voiceFavorites }),
    }).catch(() => { /* ignore network failures */ });
  }, [voiceFavorites]);

  const displayDebug = liveDebug || latestAssistantDebug;

  // Keep voice adjustment refs in sync with incoming live props so they're
  // available inside requestSpeechAudio without needing a re-render.
  useEffect(() => {
    pendingVoiceAdjustmentsRef.current = liveVoiceAdjustments;
  }, [liveVoiceAdjustments]);

  useEffect(() => {
    pendingSingingActiveRef.current = liveSingingActive;
  }, [liveSingingActive]);

  useEffect(() => {
    const wasSending = prevIsSendingRef.current;
    if (wasSending && !isSending && streamAutoplayUsedRef.current) {
      // When SSE flips from sending->not-sending, final trailing sentence chunks
      // may be enqueued a tick later by the finalize branch. Hold FSM end briefly.
      streamPostSendGraceUntilRef.current = Date.now() + STREAM_POST_SEND_GRACE_MS;
    }
    prevIsSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    if (!sysObserverOpen) {
      return;
    }

    setRequestMetrics(getRequestMetricsSnapshot());
    const timerId = window.setInterval(() => {
      setRequestMetrics(getRequestMetricsSnapshot());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [sysObserverOpen]);

  // ── FSM Effect 1: observe external booleans → dispatch phase transitions ──
  // Translates the parent-owned isSending / isGeneratingAudio / isAudioPlaying
  // props into explicit FSM events so the call loop never needs to inspect them
  // directly.
  useEffect(() => {
    if (!isLiveCallActive) return;

    const inPostSendGrace = Date.now() < streamPostSendGraceUntilRef.current;

    const hasPendingStreamSpeech =
      streamPlaybackActiveRef.current ||
      streamQueueProcessingRef.current ||
      streamReadyAudioQueueRef.current.length > 0 ||
      streamPendingSentenceQueueRef.current.length > 0 ||
      inPostSendGrace;

    // LLM finished streaming → move to TTS
    if (convPhase === CONV_PHASE.THINKING && !isSending) {
      if (isAudioPlaying) {
        // Edge case: audio already started before we noticed (fast TTS)
        dispatchConvPhase({ type: "AUDIO_START" });
      } else {
        dispatchConvPhase({ type: "LLM_DONE" });
      }
    }

    // TTS audio begins
    if (convPhase === CONV_PHASE.GENERATING_AUDIO && isAudioPlaying) {
      dispatchConvPhase({ type: "AUDIO_START" });
    }

    // AI finished speaking — begin recovery pause before next turn
    if (
      convPhase === CONV_PHASE.SPEAKING &&
      !isAudioPlaying &&
      !isSending &&
      !isGeneratingAudio &&
      !hasPendingStreamSpeech
    ) {
      console.log('[FSM] Dispatching AUDIO_END - all conditions met');
      dispatchConvPhase({ type: "AUDIO_END" });
    } else if (convPhase === CONV_PHASE.SPEAKING && !isAudioPlaying) {
      // Debug: what's blocking the transition?
      console.log('[FSM] SPEAKING but blocked from AUDIO_END:', {
        isSending,
        isGeneratingAudio,
        streamPlaybackActive: streamPlaybackActiveRef.current,
        streamQueueProcessing: streamQueueProcessingRef.current,
        readyQueueLength: streamReadyAudioQueueRef.current.length,
        pendingQueueLength: streamPendingSentenceQueueRef.current.length,
        inPostSendGrace,
        graceUntil: streamPostSendGraceUntilRef.current,
        now: Date.now(),
      });
    }
  }, [isLiveCallActive, convPhase, isSending, isGeneratingAudio, isAudioPlaying, liveReply]);

  // ── FSM Effect 2: RECOVERING → LISTENING after settle delay ──────────────
  useEffect(() => {
    if (!isLiveCallActive || convPhase !== CONV_PHASE.RECOVERING) return;
    const id = setTimeout(() => {
      if (liveCallActiveRef.current) dispatchConvPhase({ type: "RECOVERED" });
    }, LIVE_CALL_RECOVER_MS);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveCallActive, convPhase]);

  // ── FSM Effect 3: LISTENING → arm the microphone recorder ────────────────
  useEffect(() => {
    if (!isLiveCallActive || convPhase !== CONV_PHASE.LISTENING) return;
    if (liveCallMediaRecorderRef.current && liveCallMediaRecorderRef.current.state !== "inactive") return;
    void liveCallStartRecording();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveCallActive, convPhase]);

  const loadCartesiaVoiceOptions = useCallback(async ({ force = false } = {}) => {
    if (cartesiaCatalogRequestInFlightRef.current) {
      return;
    }
    const now = Date.now();
    if (!force && now - cartesiaCatalogLastAttemptRef.current < 15000) {
      return;
    }

    cartesiaCatalogLastAttemptRef.current = now;
    cartesiaCatalogRequestInFlightRef.current = true;
    setIsLoadingCartesiaVoices(true);
    setCartesiaVoiceLoadError("");

    try {
      const response = await authFetch("/tts/provider-options?provider=cartesia");
      const payload = await readApiResponsePayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, payload, `Failed to load Cartesia voices (${response.status}).`));
      }

      const voices = Array.isArray(payload?.voices) && payload.voices.length
        ? payload.voices
          .map((voice) => ({
            id: String(voice?.id || "").trim(),
            label: String(voice?.label || voice?.id || "").trim(),
            tags: Array.isArray(voice?.tags) ? voice.tags : [],
          }))
          .filter((voice) => voice.id)
        : CARTESIA_QUICK_VOICE_OPTIONS;

      setCartesiaVoiceOptions(voices.length ? voices : CARTESIA_QUICK_VOICE_OPTIONS);
    } catch (error) {
      console.warn("[ChatWindow] Cartesia voice catalog fallback:", error?.message || error);
      setCartesiaVoiceLoadError(error?.message || "Failed to load Cartesia voice catalog.");
      setCartesiaVoiceOptions((current) => (
        Array.isArray(current) && current.length > 0 ? current : CARTESIA_QUICK_VOICE_OPTIONS
      ));
    } finally {
      cartesiaCatalogRequestInFlightRef.current = false;
      setIsLoadingCartesiaVoices(false);
    }
  }, [authFetch]);

  // Fetch Cartesia voice catalog when the engine is Cartesia (or auto w/ debug lock).
  useEffect(() => {
    const isCartesiaActive =
      voiceProfile.engine === "cartesia" ||
      (TTS_DEBUG_PROVIDER_LOCK && voiceProfile.engine === "auto");

    if (!isCartesiaActive) {
      cartesiaCatalogActivatedRef.current = false;
      return;
    }

    // Only auto-load once per activation; manual refresh still uses force:true.
    if (cartesiaCatalogActivatedRef.current) {
      return;
    }

    cartesiaCatalogActivatedRef.current = true;

    void loadCartesiaVoiceOptions({ force: false });
  }, [loadCartesiaVoiceOptions, voiceProfile.engine]);
  const pendingAssistantMessage = useMemo(() => {
    if (!isSending && !liveReply) {
      return null;
    }

    return {
      role: "assistant",
      content: liveReply || "",
      displayContent: extractEPFDialogue(liveReply || "") || liveReply || "",
      debug: displayDebug,
      live: true,
      phase: livePhase,
    };
  }, [displayDebug, livePhase, liveReply]);

  const renderedMessages = useMemo(() => {
    if (!pendingAssistantMessage) {
      return messages;
    }

    return [...messages, pendingAssistantMessage];
  }, [messages, pendingAssistantMessage]);

  const performanceTier = useMemo(
    () => resolvePerformanceTier(neuralProfile, activeMode, prefersReducedMotion),
    [neuralProfile, activeMode, prefersReducedMotion],
  );

  const neuralSignal = useMemo(() => {
    const debugMood = displayDebug?.mood?.after;
    const personalityMood = personality?.moodState;
    
    // Parse personality.moodState if it's a JSON string
    let parsedPersonalityMood = personalityMood;
    if (typeof personalityMood === 'string') {
      try {
        parsedPersonalityMood = JSON.parse(personalityMood);
      } catch (e) {
        parsedPersonalityMood = {};
      }
    }
    
    const mood = debugMood || parsedPersonalityMood || { valence: 0, arousal: 0, dominance: 0 };
    const memoryActive = ((displayDebug?.memoryInjected || []).length + (displayDebug?.userMemoryRetrieved || []).length) > 0;
    const intentActive = Boolean(displayDebug?.goal?.goal);
    const identityActive = Boolean(displayDebug?.flags?.reconditioned);

    return {
      valence: Number(mood?.valence || 0),
      arousal: Number(mood?.arousal || 0),
      memoryActive,
      intentActive,
      identityActive,
    };
  }, [displayDebug, personality?.moodState]);

  const avatarMood = useMemo(() => {
    const debugMood = displayDebug?.mood?.after;
    const personalityMood = personality?.moodState;
    
    // Parse personality.moodState if it's a JSON string
    let parsedPersonalityMood = personalityMood;
    if (typeof personalityMood === 'string') {
      try {
        parsedPersonalityMood = JSON.parse(personalityMood);
      } catch (e) {
        parsedPersonalityMood = {};
      }
    }
    
    return debugMood || parsedPersonalityMood || { valence: 0, arousal: 0, dominance: 0 };
  }, [displayDebug, personality?.moodState]);

  const emotionSpectrum = useMemo(
    () => interpretEmotionSpectrum(avatarMood),
    [avatarMood],
  );

  const emotionDriftPath = useMemo(() => {
    if (emotionDrift.length <= 1) {
      return "";
    }

    const width = 100;
    const height = 24;
    return emotionDrift
      .map((value, index) => {
        const x = (index / (emotionDrift.length - 1)) * width;
        const y = ((1 - (Number(value || 0) + 1) / 2) * (height - 2)) + 1;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [emotionDrift]);

  // ── Neural activity: combines real brain heartbeat + phase signals ───────
  const [brainActivity, setBrainActivity] = useState(0);
  const prevActivityRef = useRef(0);
  const [activitySpike, setActivitySpike] = useState(false);
  const spikeTimerRef = useRef(null);

  // Chat card tilt is intentionally disabled to keep the surface stable.

  const handleBrainActivity = useCallback((activity) => {
    setBrainActivity(activity);
  }, []);

  const neuralActivity = useMemo(() => {
    const arousalBase = Math.min(0.4, Math.abs(neuralSignal.arousal) * 0.4);
    const phaseBoost = ["intent", "generation", "reply", "memory", "memory-write", "user-memory-write", "prompt", "token"].includes(livePhase) ? 0.55 : 0;
    const memBoost = neuralSignal.memoryActive ? 0.2 : 0;
    const intentBoost = neuralSignal.intentActive ? 0.18 : 0;
    return Math.min(1, Math.max(brainActivity, arousalBase + phaseBoost + memBoost + intentBoost));
  }, [brainActivity, livePhase, neuralSignal]);

  // Spike detection — fires a 400ms flash when activity jumps sharply
  useEffect(() => {
    const delta = neuralActivity - prevActivityRef.current;
    prevActivityRef.current = neuralActivity;
    if (delta > 0.25) {
      setActivitySpike(true);
      if (spikeTimerRef.current) clearTimeout(spikeTimerRef.current);
      spikeTimerRef.current = window.setTimeout(() => setActivitySpike(false), 400);
    }
    return () => { if (spikeTimerRef.current) clearTimeout(spikeTimerRef.current); };
  }, [neuralActivity]);

  // Pre-response micro-animation state — fires just before text appears
  const [preResponseState, setPreResponseState] = useState(null);
  const preResponseTimerRef = useRef(null);
  useEffect(() => {
    if (livePhase === "intent" || livePhase === "generation") {
      setPreResponseState("thinking");
      if (preResponseTimerRef.current) clearTimeout(preResponseTimerRef.current);
      preResponseTimerRef.current = window.setTimeout(() => setPreResponseState(null), 400);
    }
    return () => { if (preResponseTimerRef.current) clearTimeout(preResponseTimerRef.current); };
  }, [livePhase]);

  // Mood CSS variables — whole UI breathes with personality emotion
  useEffect(() => {
    const arousal = Number(avatarMood.arousal || 0);
    const valence = Number(avatarMood.valence || 0);
    document.documentElement.style.setProperty("--mood-glow", `${(0.2 + Math.abs(arousal) * 0.5).toFixed(3)}`);
    document.documentElement.style.setProperty("--mood-hue", `${Math.round(180 + valence * 60)}`);
    document.documentElement.style.setProperty("--mood-valence", valence.toFixed(3));
  }, [avatarMood.arousal, avatarMood.valence]);

  // Reply pulse — micro-trigger on new messages arriving
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      setActivitySpike(true);
      if (spikeTimerRef.current) clearTimeout(spikeTimerRef.current);
      spikeTimerRef.current = window.setTimeout(() => setActivitySpike(false), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    if (!personality) {
      return;
    }

    const nextEngine = normalizeVoiceEngineForDebug(personality.voiceProfile?.engine || "auto");

    setVoiceProfile({
      enabled: personality.voiceProfile?.enabled !== false,
      autoplay: Boolean(personality.voiceProfile?.autoplay),
      engine: nextEngine,
      pitch: Number(personality.voiceProfile?.pitch) || 1,
      rate: Number(personality.voiceProfile?.rate) || 1,
      preferredVoice:
        personality.voiceProfile?.preferredVoice || personality.voiceProfile?.providerVoice || "alloy",
      providerVoice:
        personality.voiceProfile?.providerVoice || personality.voiceProfile?.preferredVoice || "alloy",
      kokoroVoice: personality.voiceProfile?.kokoroVoice || "af_heart",
      providerModel: personality.voiceProfile?.providerModel || "gpt-4o-mini-tts",
      cartesiaVoiceId: personality.voiceProfile?.cartesiaVoiceId || "",
      cartesiaModel: personality.voiceProfile?.cartesiaModel || "sonic-3",
      piperModelPath: personality.voiceProfile?.piperModelPath || "",
      piperSpeaker: personality.voiceProfile?.piperSpeaker ?? null,
    });
  }, [personality]);

  useEffect(() => {
    setVoiceTelemetry(null);
    setActivePersonalityEvents([]);
    const hasActiveStreamAutoplay =
      streamPlaybackActiveRef.current ||
      streamQueueProcessingRef.current ||
      streamReadyAudioQueueRef.current.length > 0 ||
      streamPendingSentenceQueueRef.current.length > 0;

    // Do not reset stream session/queues while a streamed reply is still
    // speaking, otherwise only the first sentence can play before truncation.
    if (!hasActiveStreamAutoplay) {
      streamAutoplaySessionRef.current = null;
      clearStreamingAutoplayQueues({ revokeQueuedAudio: true });
    }
    autoplayAssistantBaselineRef.current = assistantMessageCount;
    lastGeneratedRef.current = `${personality?.id || "none"}:${latestAssistantSpeechText}`;
    if (personalityEventsTimerRef.current) {
      window.clearTimeout(personalityEventsTimerRef.current);
    }
    setEmotionDrift([]);
    prevZoneKeyRef.current = "";
  }, [assistantMessageCount, latestAssistantSpeechText, personality?.id]);

  useEffect(() => {
    if (!voiceProfile.autoplay) {
      return;
    }

    // Arming autoplay should not immediately replay the latest historical assistant
    // response just because the tab/component became active.
    autoplayAssistantBaselineRef.current = assistantMessageCount;
    lastGeneratedRef.current = `${personality?.id || "none"}:${latestAssistantSpeechText}`;
  }, [voiceProfile.autoplay, assistantMessageCount, latestAssistantSpeechText, personality?.id]);

  useEffect(() => {
    const nextValence = Number(avatarMood?.valence || 0);
    setEmotionDrift((current) => {
      const appended = [...current, Math.max(-1, Math.min(1, nextValence))];
      return appended.slice(-28);
    });
  }, [avatarMood?.valence]);

  useEffect(() => {
    const currentZoneKey = String(emotionSpectrum?.zone?.key || "");
    if (!currentZoneKey) {
      return;
    }

    if (!prevZoneKeyRef.current) {
      prevZoneKeyRef.current = currentZoneKey;
      return;
    }

    if (prevZoneKeyRef.current !== currentZoneKey) {
      setZoneShiftActive(true);
      if (zoneShiftTimerRef.current) {
        window.clearTimeout(zoneShiftTimerRef.current);
      }
      zoneShiftTimerRef.current = window.setTimeout(() => {
        setZoneShiftActive(false);
      }, 540);
      prevZoneKeyRef.current = currentZoneKey;
    }
  }, [emotionSpectrum?.zone?.key]);

  // Show structured personality events from telemetry, coalesce duplicates, and auto-dismiss.
  useEffect(() => {
    const events = Array.isArray(voiceTelemetry?.personalityEvents)
      ? voiceTelemetry.personalityEvents
      : [];

    const nowMs = Date.now();
    const normalizedEvents = coalescePersonalityEvents(events, nowMs);

    if (normalizedEvents.length === 0) {
      setActivePersonalityEvents((current) => {
        const pruned = current.filter((event) => nowMs - Number(event?.lastSeenMs || 0) < 7000);
        return pruned;
      });
      return;
    }

    setActivePersonalityEvents((current) => {
      const merged = new Map();

      for (const event of current) {
        if (nowMs - Number(event?.lastSeenMs || 0) < 7000) {
          merged.set(event.key, event);
        }
      }

      for (const event of normalizedEvents) {
        const existing = merged.get(event.key);
        if (existing) {
          merged.set(event.key, {
            ...existing,
            count: Number(existing.count || 1) + Number(event.count || 1),
            lastSeenMs: nowMs,
            // Keep latest payload text/tag for display if it changed casing.
            text: event.text || existing.text,
            tag: event.tag || existing.tag,
          });
        } else {
          merged.set(event.key, event);
        }
      }

      return Array.from(merged.values())
        .sort((a, b) => Number(b.lastSeenMs || 0) - Number(a.lastSeenMs || 0))
        .slice(0, 4);
    });

    if (personalityEventsTimerRef.current) {
      window.clearTimeout(personalityEventsTimerRef.current);
    }
    personalityEventsTimerRef.current = window.setTimeout(() => {
      const cutoff = Date.now() - 7000;
      setActivePersonalityEvents((current) =>
        current.filter((event) => Number(event?.lastSeenMs || 0) >= cutoff),
      );
    }, 7000);
  }, [voiceTelemetry?.personalityEvents]);

  useEffect(() => {
    currentAudioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (speechEnergyTimerRef.current) {
        window.clearInterval(speechEnergyTimerRef.current);
        speechEnergyTimerRef.current = null;
      }

      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = "";
      }

      if (zoneShiftTimerRef.current) {
        window.clearTimeout(zoneShiftTimerRef.current);
      }

      if (personalityEventsTimerRef.current) {
        window.clearTimeout(personalityEventsTimerRef.current);
      }

      clearStreamingAutoplayQueues({ revokeQueuedAudio: true });
    };
  }, []);

  useEffect(() => {
    if (speechEnergyTimerRef.current) {
      window.clearInterval(speechEnergyTimerRef.current);
      speechEnergyTimerRef.current = null;
    }

    if (!isAudioPlaying) {
      setSpeechEnergy(0);
      return;
    }

    speechEnergyTimerRef.current = window.setInterval(() => {
      const audioElement = audioRef.current;
      if (!(audioElement instanceof HTMLAudioElement)) {
        setSpeechEnergy(0);
        return;
      }

      const t = Number(audioElement.currentTime || 0);
      const pulseA = Math.abs(Math.sin(t * 17.5));
      const pulseB = Math.abs(Math.sin(t * 39.2 + 0.85));
      const pulseC = Math.abs(Math.sin(t * 6.8 + 0.23));
      const combined = 0.2 + pulseA * 0.45 + pulseB * 0.25 + pulseC * 0.1;
      setSpeechEnergy(Math.min(1, combined));
    }, 42);

    return () => {
      if (speechEnergyTimerRef.current) {
        window.clearInterval(speechEnergyTimerRef.current);
        speechEnergyTimerRef.current = null;
      }
    };
  }, [isAudioPlaying]);

  useEffect(() => {
    if (!voiceProfile.enabled || !voiceProfile.autoplay || !personality || nativeTtsActive) {
      return;
    }

    const sessionKey = `${personality.id}:${messages.length}`;

    if (isSending) {
      if (streamAutoplaySessionRef.current !== sessionKey) {
        streamAutoplaySessionRef.current = sessionKey;
        clearStreamingAutoplayQueues({ revokeQueuedAudio: true });
      }

      const { sentences } = splitCompleteSentences(liveReply || "");
      if (sentences.length < streamSentenceCursorRef.current) {
        clearStreamingAutoplayQueues({ revokeQueuedAudio: true });
      }

      for (let index = streamSentenceCursorRef.current; index < sentences.length; index += 1) {
        const parts = splitLongSpeechChunk(sentences[index]);
        for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
          const sentence = normalizeSpeechChunk(parts[partIndex]);
          if (!sentence) {
            continue;
          }

          const sentenceKey = `${sessionKey}:${index}:${partIndex}:${sentence}`;
          if (streamQueuedSentenceKeysRef.current.has(sentenceKey)) {
            continue;
          }

          streamQueuedSentenceKeysRef.current.add(sentenceKey);
          streamPendingSentenceQueueRef.current.push({
            text: sentence,
            segmentIndex: index,
            segmentKey: sentenceKey,
          });
          streamAutoplayUsedRef.current = true;
        }
      }

      streamSentenceCursorRef.current = Math.max(streamSentenceCursorRef.current, sentences.length);

      if (streamPendingSentenceQueueRef.current.length > 0) {
        void processStreamingSentenceQueue();
      }

      return;
    }

    // Finalize trailing text once stream ends (even if it lacked punctuation).
    if (streamAutoplaySessionRef.current === sessionKey && streamAutoplayUsedRef.current) {
      const { sentences, remainder } = splitCompleteSentences(latestAssistantSpeechText);
      const finalized = [...sentences];
      const tail = normalizeSpeechChunk(remainder);
      if (tail) {
        finalized.push(tail);
      }

      for (let index = streamSentenceCursorRef.current; index < finalized.length; index += 1) {
        const parts = splitLongSpeechChunk(finalized[index]);
        for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
          const sentence = normalizeSpeechChunk(parts[partIndex]);
          if (!sentence) {
            continue;
          }

          const sentenceKey = `${sessionKey}:${index}:${partIndex}:${sentence}`;
          if (streamQueuedSentenceKeysRef.current.has(sentenceKey)) {
            continue;
          }

          streamQueuedSentenceKeysRef.current.add(sentenceKey);
          streamPendingSentenceQueueRef.current.push({
            text: sentence,
            segmentIndex: index,
            segmentKey: sentenceKey,
          });
        }
      }

      streamSentenceCursorRef.current = finalized.length;

      if (streamPendingSentenceQueueRef.current.length > 0) {
        void processStreamingSentenceQueue();
      }

      return;
    }

    // Fallback path for non-streamed assistant updates.
    if (!latestAssistantMessage) {
      return;
    }

    // Only autoplay after a newly generated assistant turn in this session.
    if (assistantMessageCount <= autoplayAssistantBaselineRef.current) {
      return;
    }

    const stamp = `${personality?.id || "none"}:${latestAssistantSpeechText}`;
    if (lastGeneratedRef.current === stamp) {
      return;
    }

    void generateAudio(latestAssistantSpeechText, { silentAutoplayBlock: true });
    lastGeneratedRef.current = stamp;
  }, [
    isSending,
    liveReply,
    latestAssistantMessage,
    latestAssistantSpeechText,
    assistantMessageCount,
    messages.length,
    personality?.id,
    voiceProfile.autoplay,
    voiceProfile.enabled,
  ]);

  useEffect(() => {
    const debugMood = latestAssistantDebug?.mood?.after;
    const personalityMood = personality?.moodState;
    
    // Parse personality.moodState if it's a JSON string
    let parsedPersonalityMood = personalityMood;
    if (typeof personalityMood === 'string') {
      try {
        parsedPersonalityMood = JSON.parse(personalityMood);
      } catch (e) {
        parsedPersonalityMood = {};
      }
    }
    
    const valence = Number(debugMood?.valence ?? parsedPersonalityMood?.valence ?? 0);
    const canNarrate =
      activeMode === "kids" &&
      Boolean(neuralProfile?.voiceNarrationEnabled) &&
      !prefersReducedMotion &&
      !(voiceProfile.enabled && voiceProfile.autoplay) &&
      latestAssistantMessage &&
      valence > 0.35 &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window;

    if (!canNarrate) {
      return;
    }

    const narrationStamp = `${personality?.id || "none"}:${latestAssistantSpeechText}:${valence.toFixed(2)}`;
    if (lastNarrationRef.current === narrationStamp) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      "My brain is lighting up because I'm happy about our story!",
    );
    utterance.rate = 1;
    utterance.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    lastNarrationRef.current = narrationStamp;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [
    activeMode,
    latestAssistantDebug,
    latestAssistantMessage,
    latestAssistantSpeechText,
    neuralProfile?.voiceNarrationEnabled,
    personality?.id,
    personality?.moodState?.valence,
    prefersReducedMotion,
    voiceProfile.autoplay,
    voiceProfile.enabled,
  ]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) {
      return;
    }

    messageList.scrollTop = messageList.scrollHeight;
    shouldAutoScrollRef.current = true;
  }, [personality?.id]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList || !shouldAutoScrollRef.current) {
      return;
    }

    messageList.scrollTop = messageList.scrollHeight;
  }, [renderedMessages, liveReply, liveSeq]);

  function handleMessageListScroll(event) {
    const target = event.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 48;
  }

  function updateVoiceField(name, value) {
    setVoiceProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleQuickVoiceFavorite(engine, voice) {
    const targetEngine = String(engine || "").trim().toLowerCase();
    if (!["cartesia", "kokoro"].includes(targetEngine)) {
      return;
    }
    const id = String(voice?.id || "").trim();
    const label = String(voice?.label || id).trim();
    if (!id) {
      return;
    }

    setVoiceFavorites((current) => {
      const existing = Array.isArray(current?.[targetEngine]) ? current[targetEngine] : [];
      const found = existing.some((item) => String(item?.id || "").trim() === id);
      const nextItems = found
        ? existing.filter((item) => String(item?.id || "").trim() !== id)
        : [...existing, { id, label }];
      return {
        ...(current || {}),
        [targetEngine]: nextItems,
      };
    });
  }

  function handleQuickKokoroVoiceChange(nextVoiceId) {
    const voiceId = String(nextVoiceId || "").trim();
    if (!voiceId) {
      return;
    }

    const nextProfile = {
      kokoroVoice: voiceId,
      providerVoice: voiceId,
      preferredVoice: voiceId,
    };
    setVoiceProfile((current) => ({
      ...current,
      ...nextProfile,
    }));

    // Persist immediately so the personality re-load effect doesn't reset the selection
    void onSaveVoiceProfile?.({ ...voiceProfile, ...nextProfile });

    if (latestAssistantSpeechText?.trim()) {
      void generateAudio(latestAssistantSpeechText, { silentAutoplayBlock: true, voiceOverride: nextProfile });
    }
  }

  function handleQuickCartesiaVoiceChange(nextVoiceId) {
    const voiceId = String(nextVoiceId || "").trim();
    if (!voiceId) {
      return;
    }

    const nextProfile = {
      engine: "cartesia",
      cartesiaVoiceId: voiceId,
      providerVoice: voiceId,
      preferredVoice: voiceId,
    };
    setVoiceProfile((current) => ({
      ...current,
      ...nextProfile,
    }));

    // Persist immediately so the personality re-load effect doesn't reset the selection
    void onSaveVoiceProfile?.({ ...voiceProfile, ...nextProfile });

    if (latestAssistantSpeechText?.trim()) {
      void generateAudio(latestAssistantSpeechText, { silentAutoplayBlock: true, voiceOverride: nextProfile });
    }
  }

  function clearStreamingAutoplayQueues({ revokeQueuedAudio = true } = {}) {
    streamPendingSentenceQueueRef.current = [];
    streamQueuedSentenceKeysRef.current = new Set();
    streamSentenceCursorRef.current = 0;
    streamAutoplayUsedRef.current = false;
    streamPlaybackActiveRef.current = false;

    if (revokeQueuedAudio) {
      for (const item of streamReadyAudioQueueRef.current) {
        if (item?.url) {
          URL.revokeObjectURL(item.url);
        }
      }
    }

    streamReadyAudioQueueRef.current = [];
  }

  function getStreamQueueDepth() {
    return streamPendingSentenceQueueRef.current.length + streamReadyAudioQueueRef.current.length;
  }

  async function requestSpeechAudio(text, controller, meta = {}, voiceOverride = null) {
    const requestStartedAt = performance.now();
    const effectiveVoiceProfile = voiceOverride ? { ...voiceProfile, ...voiceOverride } : voiceProfile;
    const cacheKey = buildTtsCacheKey(personality.id, text, effectiveVoiceProfile);
    const cachedBlob = getTtsCache(cacheKey);
    if (cachedBlob) {
      return {
        url: URL.createObjectURL(cachedBlob),
        telemetry: null,
      };
    }
    const response = await authFetch(`/personality/${personality.id}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        text,
        voiceProfile: {
          ...effectiveVoiceProfile,
          strictEngine: String(effectiveVoiceProfile?.engine || "").trim().toLowerCase() === "cartesia",
          // Merge emotion-graph voice adjustments so Cartesia receives speed/emotion controls
          voiceAdjustments: pendingVoiceAdjustmentsRef.current || undefined,
          singingActive: pendingSingingActiveRef.current || false,
        },
      }),
    });

    if (!response.ok) {
      const payload = await readApiResponsePayload(response);
      const baseError = getApiErrorMessage(
        response,
        payload,
        "Failed to generate speech.",
      );

      const isHtmlErrorPage =
        payload && typeof payload === "object" && typeof payload.rawText === "string"
          ? /^\s*</.test(payload.rawText)
          : false;

      let ttsHealthSnapshot = null;
      if (isHtmlErrorPage && Number(response.status) === 502) {
        ttsHealthSnapshot = await fetchTtsHealthSnapshot(authFetch);
      }

      const provider = String(payload?.details?.provider || "").trim().toLowerCase();
      const providerCode = String(payload?.details?.providerCode || "").trim().toLowerCase();
      const providerStatus = Number(payload?.details?.providerStatus || 0);

      const suffix = provider
        ? ` [provider=${provider}${providerCode ? ` code=${providerCode}` : ""}${providerStatus ? ` status=${providerStatus}` : ""}]`
        : "";
      const error = new Error(`${baseError}${suffix}`.trim());
      error.ttsProvider = provider;
      error.ttsProviderCode = providerCode;
      error.ttsProviderStatus = providerStatus;
      error.httpStatus = Number(response.status || 0);
      error.isHtmlErrorPage = isHtmlErrorPage;
      error.ttsHealthSnapshot = ttsHealthSnapshot;
      throw error;
    }

    const ttsTelemetryHeader = response.headers.get("X-Voxis-Tts-Telemetry");
    let parsedTelemetry = null;
    if (ttsTelemetryHeader) {
      try {
        parsedTelemetry = JSON.parse(decodeURIComponent(ttsTelemetryHeader));
      } catch {
        parsedTelemetry = null;
      }
    }

    const ttsSfxTimelineHeader = response.headers.get("X-Voxis-Tts-Sfx-Timeline");
    const ttsSfxHeader = response.headers.get("X-Voxis-Tts-Sfx");
    let parsedSfxTimeline = [];
    
    // Try new timeline header first, fall back to old header for backward compatibility
    if (ttsSfxTimelineHeader) {
      try {
        parsedSfxTimeline = JSON.parse(decodeURIComponent(ttsSfxTimelineHeader));
      } catch {
        parsedSfxTimeline = [];
      }
    } else if (ttsSfxHeader) {
      // Backward compatibility: convert old simple array to timeline format
      try {
        const oldSfx = JSON.parse(decodeURIComponent(ttsSfxHeader));
        if (Array.isArray(oldSfx)) {
          parsedSfxTimeline = oldSfx.map((tag, index) => ({ tag, position: "inline", ms: index * 100 }));
        }
      } catch {
        parsedSfxTimeline = [];
      }
    }

    const blob = await response.blob();
    setTtsCache(cacheKey, blob);
    const nextAudioUrl = URL.createObjectURL(blob);
    const requestMs = Math.round(performance.now() - requestStartedAt);

    let sfxBuffers = null;
    if (Array.isArray(parsedSfxTimeline) && parsedSfxTimeline.length > 0) {
      onStatus?.({
        type: "info",
        message: `SFX timeline: ${parsedSfxTimeline.map((s) => s.tag).join(", ")}`,
      });

      // Pre-fetch all SFX audio buffers
      sfxBuffers = new Map();
      const sfxPromises = parsedSfxTimeline.map(async (sfxEvent) => {
        const sfxUrl = `/api/sfx/audio/${encodeURIComponent(sfxEvent.tag)}`;
        try {
          const sfxResponse = await trackedFetch(sfxUrl, {}, { cause: `chat:sfx-prefetch:${sfxEvent.tag}` });
          if (!sfxResponse.ok) {
            // Silently skip missing SFX files (404s are expected for undefined sounds)
            if (sfxResponse.status !== 404) {
              onStatus?.({
                type: "warn",
                message: `SFX audio unavailable for: ${sfxEvent.tag} (${sfxResponse.status}).`,
              });
            }
            return null;
          }
          const sfxBlob = await sfxResponse.blob();
          const sfxArrayBuffer = await sfxBlob.arrayBuffer();
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(sfxArrayBuffer);
          sfxBuffers.set(sfxEvent.tag, audioBuffer);
          return { tag: sfxEvent.tag, buffer: audioBuffer };
        } catch (err) {
          // Only warn on actual errors, not missing files
          if (err?.status !== 404) {
            onStatus?.({
              type: "warn",
              message: `SFX failed to load: ${sfxEvent.tag}.`,
            });
          }
          return null;
        }
      });

      const loadedSfx = (await Promise.all(sfxPromises)).filter(Boolean);
    }

    const telemetry = parsedTelemetry
      ? {
          ...parsedTelemetry,
          requestMs,
          sentenceChars: String(text || "").length,
          segmentIndex: Number(meta?.segmentIndex ?? -1),
          queueDepthAtRequest: Number(meta?.queueDepthAtRequest ?? 0),
          streamingSegment: Boolean(meta?.streamingSegment),
        }
      : parsedTelemetry;

    const desiredEngine = String(effectiveVoiceProfile?.engine || "auto").trim().toLowerCase();
    const chosenEngine = String(telemetry?.chosenEngine || "").trim().toLowerCase();
    const hasCartesiaVoiceSelection = Boolean(String(effectiveVoiceProfile?.cartesiaVoiceId || "").trim());
    if (
      hasCartesiaVoiceSelection &&
      (desiredEngine === "cartesia" || desiredEngine === "auto") &&
      chosenEngine &&
      chosenEngine !== "cartesia"
    ) {
      onStatus?.({
        type: "warn",
        message: `Cartesia voice selected, but audio came from ${chosenEngine}. Check Cartesia credentials/availability in Voice Provider settings.`,
      });
    }

    return {
      url: nextAudioUrl,
      telemetry,
      sfxTimeline: parsedSfxTimeline.length > 0 ? parsedSfxTimeline : undefined,
      sfxBuffers,
    };
  }

  function playNextQueuedStreamAudio({ silentAutoplayBlock = true } = {}) {
    const nextItem = streamReadyAudioQueueRef.current.shift();
    if (!nextItem?.url) {
      streamPlaybackActiveRef.current = false;
      return;
    }

    streamPlaybackActiveRef.current = true;
    setVoiceTelemetry(nextItem.telemetry || null);

    if (nextItem.telemetry?.fallbackUsed) {
      const fallbackFrom = String(nextItem.telemetry.fallbackFrom || "primary engine");
      const chosenEngine = String(nextItem.telemetry.chosenEngine || "fallback engine");
      onStatus?.({
        type: "success",
        message: `TTS fallback active: ${fallbackFrom} failed, switched to ${chosenEngine}.`,
      });
    }

    // Don't revoke old URL here - let handleAudioEnded do it after audio finishes
    currentPlayingUrlRef.current = nextItem.url;
    setAudioUrl(nextItem.url);

    requestAnimationFrame(() => {
      const audioElement = audioRef.current;
      if (audioElement instanceof HTMLAudioElement) {
        audioElement.muted = false;
        audioElement.volume = 1;
        audioElement.playbackRate = speechPlaybackRateRef.current;
        void audioElement.play().catch((playError) => {
          if (!silentAutoplayBlock) {
            onStatus?.({
              type: "info",
              message: `Audio ready — press play on the audio control below. ${playError?.message ? `(${playError.message})` : ""}`.trim(),
            });
          }
        });
      }
    });
  }

  async function processStreamingSentenceQueue() {
    if (streamQueueProcessingRef.current || !voiceProfile.enabled || !personality) {
      return;
    }

    streamQueueProcessingRef.current = true;
    setIsGeneratingAudio(true);

    try {
      while (streamPendingSentenceQueueRef.current.length > 0) {
        if (streamReadyAudioQueueRef.current.length >= MAX_STREAM_READY_AUDIO && streamPlaybackActiveRef.current) {
          break;
        }

        const nextSentence = streamPendingSentenceQueueRef.current.shift();
        const normalized = normalizeSpeechChunk(nextSentence?.text || "");
        if (!normalized || !nextSentence?.segmentKey) {
          continue;
        }

        const controller = new AbortController();
        ttsRequestAbortRef.current = controller;

        const audioResult = await requestSpeechAudio(normalized, controller, {
          segmentIndex: nextSentence.segmentIndex,
          queueDepthAtRequest: getStreamQueueDepth(),
          streamingSegment: true,
        });
        streamReadyAudioQueueRef.current.push(audioResult);

        if (!streamPlaybackActiveRef.current) {
          playNextQueuedStreamAudio({ silentAutoplayBlock: true });
        }
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        const statusPayload = {
          type: "error",
          message: buildTtsErrorMessage(error),
        };
        if (Boolean(error?.isHtmlErrorPage) && Number(error?.httpStatus || 0) === 502) {
          statusPayload.actionId = "run-connectivity-diagnostics";
          statusPayload.actionLabel = "Run diagnostics";
        }
        onStatus?.(statusPayload);
        
        // Clear pending sentences on error - they can't be generated anyway
        streamPendingSentenceQueueRef.current = [];
        
        // If no audio is playing, mark stream as complete to unblock FSM
        if (!streamPlaybackActiveRef.current && streamReadyAudioQueueRef.current.length === 0) {
          streamPlaybackActiveRef.current = false;
        }
      }
    } finally {
      if (ttsRequestAbortRef.current) {
        ttsRequestAbortRef.current = null;
      }
      streamQueueProcessingRef.current = false;
      setIsGeneratingAudio(false);

      if (streamPendingSentenceQueueRef.current.length > 0 && !streamPlaybackActiveRef.current) {
        void processStreamingSentenceQueue();
      }
    }
  }

  function handlePlaybackRateChange(rate) {
    speechPlaybackRateRef.current = rate;
    setSpeechPlaybackRate(rate);
    const audioElement = audioRef.current;
    if (audioElement instanceof HTMLAudioElement) {
      audioElement.playbackRate = rate;
    }
  }

  function stopSpeaking() {
    const hadPendingRequest = Boolean(ttsRequestAbortRef.current);
    const audioElement = audioRef.current;
    const hadActivePlayback = Boolean(
      audioElement instanceof HTMLAudioElement &&
      !audioElement.paused &&
      !audioElement.ended,
    );

    if (ttsRequestAbortRef.current) {
      ttsRequestAbortRef.current.abort();
      ttsRequestAbortRef.current = null;
    }

    streamAutoplaySessionRef.current = null;
    clearStreamingAutoplayQueues({ revokeQueuedAudio: true });

    if (audioElement instanceof HTMLAudioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    setIsGeneratingAudio(false);
    setIsAudioPlaying(false);
    setSpeechEnergy(0);

    if (hadPendingRequest || hadActivePlayback || isGeneratingAudio || isAudioPlaying) {
      onStatus?.({
        type: "info",
        message: "Voice stopped. Any pending TTS generation was canceled.",
      });
    }
  }

  async function generateAudio(text, { silentAutoplayBlock = false, voiceOverride = null } = {}) {
    if (!voiceProfile.enabled || !text.trim() || !personality || nativeTtsActive) {
      return;
    }

    // Manual/single-shot playback takes ownership from streaming queue mode.
    streamAutoplaySessionRef.current = null;
    clearStreamingAutoplayQueues({ revokeQueuedAudio: true });

    setIsGeneratingAudio(true);
    const controller = new AbortController();
    ttsRequestAbortRef.current = controller;

    try {
      const audioResult = await requestSpeechAudio(text, controller, {}, voiceOverride);
      const nextAudioUrl = audioResult.url;

      setVoiceTelemetry(audioResult.telemetry);

      if (audioResult.telemetry?.fallbackUsed) {
        const fallbackFrom = String(audioResult.telemetry.fallbackFrom || "primary engine");
        const chosenEngine = String(audioResult.telemetry.chosenEngine || "fallback engine");
        onStatus?.({
          type: "success",
          message: `TTS fallback active: ${fallbackFrom} failed, switched to ${chosenEngine}.`,
        });
      }

      // Don't revoke old URL here - let handleAudioEnded do it after audio finishes
      currentPlayingUrlRef.current = nextAudioUrl;
      setAudioUrl(nextAudioUrl);

      requestAnimationFrame(() => {
        const audioElement = audioRef.current;
        if (audioElement instanceof HTMLAudioElement) {
          audioElement.muted = false;
          audioElement.volume = 1;
          audioElement.playbackRate = speechPlaybackRateRef.current;
          void audioElement.play().catch((playError) => {
            if (!silentAutoplayBlock) {
              onStatus?.({
                type: "info",
                message: `Audio ready — press play on the audio control below. ${playError?.message ? `(${playError.message})` : ""}`.trim(),
              });
            }
          });
        }
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      const statusPayload = {
        type: "error",
        message: buildTtsErrorMessage(error),
      };
      if (Boolean(error?.isHtmlErrorPage) && Number(error?.httpStatus || 0) === 502) {
        statusPayload.actionId = "run-connectivity-diagnostics";
        statusPayload.actionLabel = "Run diagnostics";
      }
      onStatus?.(statusPayload);
    } finally {
      if (ttsRequestAbortRef.current === controller) {
        ttsRequestAbortRef.current = null;
      }
      setIsGeneratingAudio(false);
    }
  }

  function handleAudioEnded() {
    console.log('[AUDIO] Audio ended - checking queues:', {
      readyQueue: streamReadyAudioQueueRef.current.length,
      pendingQueue: streamPendingSentenceQueueRef.current.length,
      queueProcessing: streamQueueProcessingRef.current,
      playbackActive: streamPlaybackActiveRef.current,
    });
    
    // Revoke the blob URL that just finished playing (tracked via ref)
    const finishedUrl = currentPlayingUrlRef.current;
    if (finishedUrl) {
      console.log('[AUDIO] Revoking finished audio blob URL');
      URL.revokeObjectURL(finishedUrl);
      currentPlayingUrlRef.current = "";
    }
    
    setIsAudioPlaying(false);

    if (streamReadyAudioQueueRef.current.length > 0) {
      console.log('[AUDIO] Playing next from ready queue');
      playNextQueuedStreamAudio({ silentAutoplayBlock: true });
      if (streamPendingSentenceQueueRef.current.length > 0 && !streamQueueProcessingRef.current) {
        console.log('[AUDIO] Resuming TTS processing for pending sentences');
        void processStreamingSentenceQueue();
      }
      return;
    }

    // Only mark stream playback as fully complete if there are NO pending sentences
    if (streamPendingSentenceQueueRef.current.length > 0) {
      console.log('[AUDIO] Still have pending sentences, processing...');
      // Clear playbackActive so newly generated audio will start playing
      streamPlaybackActiveRef.current = false;
      if (!streamQueueProcessingRef.current) {
        void processStreamingSentenceQueue();
      }
    } else {
      console.log('[AUDIO] All audio complete - clearing refs and grace period');
      // Truly done with streaming playback - clear grace period so FSM can transition
      streamPlaybackActiveRef.current = false;
      streamPostSendGraceUntilRef.current = 0;
    }
  }

  async function handleSaveVoiceProfile() {
    setIsSavingVoice(true);

    try {
      await onSaveVoiceProfile({
        enabled: voiceProfile.enabled,
        autoplay: voiceProfile.autoplay,
        engine: voiceProfile.engine,
        pitch: Number(voiceProfile.pitch),
        rate: Number(voiceProfile.rate),
        preferredVoice: voiceProfile.preferredVoice,
        providerVoice: voiceProfile.providerVoice || voiceProfile.preferredVoice,
        kokoroVoice: voiceProfile.kokoroVoice || "af_heart",
        providerModel: voiceProfile.providerModel,
        cartesiaVoiceId: voiceProfile.cartesiaVoiceId || "",
        cartesiaModel: voiceProfile.cartesiaModel || "sonic-3",
        piperModelPath: voiceProfile.piperModelPath,
        piperSpeaker: voiceProfile.piperSpeaker,
      });
    } finally {
      setIsSavingVoice(false);
    }
  }

  async function handleNeuralMemoryUpdate({ memoryId, content, memoryType }) {
    if (!memoryId) {
      onStatus?.({ type: "error", message: "Memory id is missing for inline edit." });
      return;
    }

    if (onUpdateMemory) {
      const ok = await onUpdateMemory({ memoryId, content, memoryType });
      if (!ok) {
        onStatus?.({ type: "error", message: "Failed to update memory." });
        return;
      }
      onStatus?.({ type: "success", message: "Memory updated." });
      return;
    }

    const response = await authFetch(`/memory/${memoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        memoryType,
      }),
    });

    if (!response.ok) {
      onStatus?.({ type: "error", message: "Failed to update memory." });
      return;
    }

    onStatus?.({ type: "success", message: "Memory updated." });
  }

  function handleOpenEditorTarget(target) {
    onOpenPersonaEditor?.(target);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const message = draft.trim();
    if (!message || isSending) {
      return;
    }

    setDraft("");
    setAttachedFile(null);
    await onSend(message);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  }

  function handleFileButtonClick() {
    fileInputRef.current?.click();
  }

  function handleRemoveFile() {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  }

  function toggleRecording() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      onStatus?.({ type: "error", message: "Speech recognition is not supported in this browser." });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDraft((prev) => prev + (prev ? " " : "") + transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        const errorMessages = {
          network: "Speech recognition requires a network connection to Google's servers. Check your internet connection or try typing instead.",
          "not-allowed": "Microphone access was denied. Allow microphone permissions in your browser settings.",
          "no-speech": "No speech detected. Please try again.",
          "audio-capture": "No microphone found. Ensure a microphone is connected and try again.",
          "service-not-allowed": "Speech recognition is not available. Use HTTPS or try a different browser.",
        };
        const message = errorMessages[event.error] ?? "Speech recognition failed. Please try again.";
        onStatus?.({ type: "error", message });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  }

  // ── Live Call ──────────────────────────────────────────────────────────────

  function stopLiveCallSilenceDetection() {
    if (liveCallSilenceDetectorRef.current) {
      liveCallSilenceDetectorRef.current.stop();
      liveCallSilenceDetectorRef.current = null;
    }
    liveCallSilenceStartedAtRef.current = 0;
    liveCallSpeechDetectedRef.current = false;
  }

  function startLiveCallSilenceDetection(stream) {
    stopLiveCallSilenceDetection();

    const AudioContextCtor =
      typeof window !== "undefined"
        ? (window.AudioContext || window.webkitAudioContext)
        : null;
    if (!AudioContextCtor || !(stream instanceof MediaStream)) {
      return;
    }

    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.1;

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);

    let rafId = 0;
    let stopped = false;

    const stop = () => {
      if (stopped) {
        return;
      }
      stopped = true;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // Ignore disconnect races during teardown.
      }
      if (context.state !== "closed") {
        void context.close().catch(() => {});
      }
    };

    const tick = () => {
      if (stopped || !liveCallActiveRef.current) {
        return;
      }

      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const s = samples[i];
        sum += s * s;
      }
      const rms = Math.sqrt(sum / samples.length);
      const now = Date.now();

      if (rms >= LIVE_CALL_LEVEL_THRESHOLD) {
        liveCallSpeechDetectedRef.current = true;
        liveCallSilenceStartedAtRef.current = 0;
      } else if (liveCallSpeechDetectedRef.current) {
        if (!liveCallSilenceStartedAtRef.current) {
          liveCallSilenceStartedAtRef.current = now;
        }
        if (now - liveCallSilenceStartedAtRef.current >= LIVE_CALL_SILENCE_MS) {
          liveCallStopListening();
          return;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    liveCallSilenceDetectorRef.current = { stop };
  }

  async function liveCallStartRecording() {
    if (!liveCallActiveRef.current) return;
    const activeRecorder = liveCallMediaRecorderRef.current;
    if (activeRecorder && activeRecorder.state !== "inactive") {
      return;
    }

    // convPhase is already LISTENING — no dispatch needed here
    liveCallChunksRef.current = [];
    stopLiveCallSilenceDetection();
    if (liveCallMaxDurationTimerRef.current) {
      window.clearTimeout(liveCallMaxDurationTimerRef.current);
      liveCallMaxDurationTimerRef.current = null;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onStatus?.({ type: "error", message: "Microphone access denied. Cannot start live call." });
      endLiveCall();
      return;
    }
    liveCallMicStreamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
    const recorder = new MediaRecorder(stream, { mimeType });
    liveCallMediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) liveCallChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      if (liveCallMaxDurationTimerRef.current) {
        window.clearTimeout(liveCallMaxDurationTimerRef.current);
        liveCallMaxDurationTimerRef.current = null;
      }
      stopLiveCallSilenceDetection();

      // Stop mic tracks
      stream.getTracks().forEach((t) => t.stop());
      liveCallMicStreamRef.current = null;
      liveCallMediaRecorderRef.current = null;

      if (!liveCallActiveRef.current) return;
      const chunks = liveCallChunksRef.current;
      if (!chunks.length) {
        // Nothing recorded — recover and listen again
        dispatchConvPhase({ type: "NO_SPEECH" });
        return;
      }

      dispatchConvPhase({ type: "RECORDED" }); // LISTENING → TRANSCRIBING
      const blob = new Blob(chunks, { type: mimeType });
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.readAsDataURL(blob);
      });

      if (!base64 || !liveCallActiveRef.current) {
        if (liveCallActiveRef.current) dispatchConvPhase({ type: "NO_SPEECH" });
        return;
      }

      let transcript = "";
      let sttError = "";
      try {
        const resp = await authFetch("/api/stt/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType,
            language: String(navigator?.language || "auto").split("-")[0] || "auto",
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          transcript = String(data?.text || data?.transcript || "").trim();
        } else {
          let errBody = null;
          try { errBody = await resp.json(); } catch { /* ignore */ }
          sttError = String(errBody?.error || `STT returned ${resp.status}`);
        }
      } catch (err) {
        sttError = String(err?.message || "STT provider unreachable");
      }

      if (!liveCallActiveRef.current) return;

      if (sttError) {
        onStatus?.({
          type: "error",
          message: `Live call: speech recognition failed — ${sttError}. Check STT settings or configure an API key.`,
        });
        dispatchConvPhase({ type: "ERROR" });
        endLiveCall();
        return;
      }

      if (transcript) {
        dispatchConvPhase({ type: "TRANSCRIPT" }); // TRANSCRIBING → THINKING
        try {
          const voiceBuffer = getVoiceBuffer();
          clearVoiceBuffer();
          await onSend(transcript, { isLiveCall: true, voiceBuffer });
        } catch {
          if (liveCallActiveRef.current) {
            dispatchConvPhase({ type: "NO_SPEECH" }); // recover and listen again
          }
        }
        // After onSend, the FSM observer effect (Effect 1) watches isSending /
        // isGeneratingAudio / isAudioPlaying and drives the remaining transitions.
      } else {
        // No speech above threshold — recover and listen again
        dispatchConvPhase({ type: "NO_SPEECH" });
      }
    };

    recorder.start();
    startLiveCallSilenceDetection(stream);
    liveCallMaxDurationTimerRef.current = window.setTimeout(() => {
      if (liveCallActiveRef.current) {
        liveCallStopListening();
      }
    }, LIVE_CALL_MAX_RECORDING_MS);
  }

  function liveCallStopListening() {
    if (liveCallMaxDurationTimerRef.current) {
      window.clearTimeout(liveCallMaxDurationTimerRef.current);
      liveCallMaxDurationTimerRef.current = null;
    }
    stopLiveCallSilenceDetection();

    if (liveCallMediaRecorderRef.current && liveCallMediaRecorderRef.current.state === "recording") {
      liveCallMediaRecorderRef.current.stop();
    }
  }

  function startLiveCall() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onStatus?.({ type: "error", message: "Live call needs browser microphone recording support (MediaRecorder)." });
      return;
    }
    if (!voiceProfile.enabled) {
      onStatus?.({ type: "error", message: "Enable voice playback before starting a live call." });
      return;
    }
    liveCallActiveRef.current = true;
    streamPostSendGraceUntilRef.current = 0;
    setIsLiveCallActive(true);
    setShowLiveBrainWindow(true);
    setLiveBrainViewMode("full");
    setLiveBrainSnapZone("center");
    setLiveBrainWindow({ x: 0, y: 0, width: 720, height: 560 });
    dispatchConvPhase({ type: "CALL_START" }); // → LISTENING; FSM Effect 3 arms the recorder
    // Force autoplay on during live call
    setVoiceProfile((prev) => ({ ...prev, autoplay: true }));
  }

  // Interrupt the AI mid-turn: stops TTS/audio immediately and re-arms the microphone.
  function interruptLiveCall() {
    if (
      convPhase !== CONV_PHASE.SPEAKING &&
      convPhase !== CONV_PHASE.GENERATING_AUDIO &&
      convPhase !== CONV_PHASE.THINKING
    ) return;
    stopSpeaking();
    dispatchConvPhase({ type: "INTERRUPT" }); // → LISTENING; FSM Effect 3 re-arms recorder
  }

  // Keep the ref in sync so the parallel voice buffer hook can reach it
  interruptLiveCallRef.current = interruptLiveCall;

  function endLiveCall() {
    liveCallActiveRef.current = false;
    streamPostSendGraceUntilRef.current = 0;
    setIsLiveCallActive(false);
    dispatchConvPhase({ type: "CALL_END" }); // → IDLE
    liveCallStopListening();
    if (liveCallMicStreamRef.current) {
      liveCallMicStreamRef.current.getTracks().forEach((t) => t.stop());
      liveCallMicStreamRef.current = null;
    }
    liveCallMediaRecorderRef.current = null;
  }

  function handleLiveBrainDragStart(event) {
    if (window.innerWidth <= 1080) return;
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;

    liveBrainDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: liveBrainWindow.x,
      originY: liveBrainWindow.y,
    };
    setLiveBrainIsDragging(true);
    setLiveBrainDragActiveZone(liveBrainSnapZone);
    event.preventDefault();
  }

  function handleLiveBrainResizeCommit() {
    if (!liveBrainWindowRef.current) return;
    const nextWidth = liveBrainWindowRef.current.offsetWidth;
    const nextHeight = liveBrainWindowRef.current.offsetHeight;
    if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight)) return;

    setLiveBrainWindow((prev) => ({
      ...prev,
      width: Math.max(420, Math.min(1200, Math.round(nextWidth))),
      height: Math.max(300, Math.min(900, Math.round(nextHeight))),
    }));
  }

  function getLiveBrainSnapTarget(windowState) {
    const maxX = Math.max(0, Math.round(window.innerWidth * 0.26));
    const maxY = Math.max(0, Math.round(window.innerHeight * 0.2));
    const leftThreshold = -Math.round(maxX * 0.38);
    const rightThreshold = Math.round(maxX * 0.38);
    const topThreshold = -Math.round(maxY * 0.45);
    const bottomThreshold = Math.round(maxY * 0.45);

    let snapZone = "center";
    let x = 0;
    if (windowState.x <= leftThreshold) {
      snapZone = "left";
      x = -Math.round(maxX * 0.82);
    } else if (windowState.x >= rightThreshold) {
      snapZone = "right";
      x = Math.round(maxX * 0.82);
    }

    let y = 0;
    if (windowState.y <= topThreshold) {
      y = -maxY;
    } else if (windowState.y >= bottomThreshold) {
      y = maxY;
    }

    return { x, y, snapZone };
  }

  useEffect(() => {
    let rafId = null;
    const onMove = (event) => {
      const drag = liveBrainDragRef.current;
      if (!drag.active) return;

      // Throttle updates with requestAnimationFrame to prevent setState storm
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        
        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        const maxX = Math.max(0, Math.round(window.innerWidth * 0.26));
        const minX = -Math.max(0, Math.round(window.innerWidth * 0.26));
        const maxY = Math.max(0, Math.round(window.innerHeight * 0.2));
        const minY = -Math.max(0, Math.round(window.innerHeight * 0.2));

        const nextX = Math.max(minX, Math.min(maxX, Math.round(drag.originX + deltaX)));
        const leftThreshold = -Math.round(maxX * 0.38);
        const rightThreshold = Math.round(maxX * 0.38);
        const zone = nextX <= leftThreshold ? "left" : nextX >= rightThreshold ? "right" : "center";
        setLiveBrainDragActiveZone(zone);

        setLiveBrainWindow((prev) => ({
          ...prev,
          x: nextX,
          y: Math.max(minY, Math.min(maxY, Math.round(drag.originY + deltaY))),
        }));
      });
    };

    const onUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      liveBrainDragRef.current.active = false;
      setLiveBrainIsDragging(false);
      handleLiveBrainResizeCommit();
      setLiveBrainWindow((prev) => {
        const snapped = getLiveBrainSnapTarget(prev);
        setLiveBrainSnapZone(snapped.snapZone);
        setLiveBrainDragActiveZone(snapped.snapZone);
        return {
          ...prev,
          x: snapped.x,
          y: snapped.y,
        };
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      liveCallActiveRef.current = false;
      liveCallStopListening();
      if (liveCallMicStreamRef.current) {
        liveCallMicStreamRef.current.getTracks().forEach((t) => t.stop());
        liveCallMicStreamRef.current = null;
      }
      if (liveCallMaxDurationTimerRef.current) {
        window.clearTimeout(liveCallMaxDurationTimerRef.current);
        liveCallMaxDurationTimerRef.current = null;
      }
      stopLiveCallSilenceDetection();
    };
  }, []);

  if (!personality) {
    return (
      <>
        <style>{chatStyles}</style>
        <div className="chat-placeholder">
          Select a saved personality or create a new one before opening chat.
          <div>
            <button type="button" className="text-button" onClick={onJumpToBuilder}>
              Go to Character Request
            </button>
          </div>
        </div>
      </>
    );
  }
              <div className="live-call-tap-hint">Speak naturally. Voxis sends after a short pause.</div>
  const avatarSpeaking = Boolean(liveReply) || isAudioPlaying;

  return (
    <>
      <style>{chatStyles}</style>

      {/* ── Live Call Overlay ─────────────────────────────────────────── */}
      {isLiveCallActive && (
        <div className="live-call-overlay">
          {liveBrainIsDragging && (
            <div className="live-call-snap-guides">
              {["left", "center", "right"].map((zone) => (
                <div key={zone} className={`live-call-snap-zone${liveBrainDragActiveZone === zone ? " active" : ""}`}>
                  <span className="live-call-snap-zone-label">{zone}</span>
                </div>
              ))}
            </div>
          )}
          <div className="live-call-layout">
            <div className="live-call-card">
              <div className="live-call-name">Live call · {personality.name}</div>
              {personality.avatarImageUrl && (
                <img
                  src={personality.avatarImageUrl}
                  alt={personality.name}
                  className="live-call-avatar-portrait"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              {(() => {
                const isInterruptible =
                  convPhase === CONV_PHASE.SPEAKING ||
                  convPhase === CONV_PHASE.GENERATING_AUDIO ||
                  convPhase === CONV_PHASE.THINKING;
                const orbClass = [
                  "live-call-orb",
                  convPhase === CONV_PHASE.LISTENING        ? "listening"
                  : convPhase === CONV_PHASE.SPEAKING || convPhase === CONV_PHASE.RECOVERING ? "speaking"
                  : convPhase === CONV_PHASE.ERROR          ? "error"
                  : "processing",
                  isInterruptible ? "interruptible" : "",
                ].filter(Boolean).join(" ");
                const orbEmoji =
                  convPhase === CONV_PHASE.LISTENING   ? "🎙"
                  : convPhase === CONV_PHASE.SPEAKING || convPhase === CONV_PHASE.RECOVERING ? "🔊"
                  : convPhase === CONV_PHASE.ERROR     ? "⚠"
                  : "⟳";
                return (
                  <div
                    className={orbClass}
                    role={isInterruptible ? "button" : undefined}
                    tabIndex={isInterruptible ? 0 : undefined}
                    title={isInterruptible ? "Tap to interrupt" : undefined}
                    onClick={isInterruptible ? interruptLiveCall : undefined}
                    onKeyDown={isInterruptible ? (e) => { if (e.key === "Enter" || e.key === " ") interruptLiveCall(); } : undefined}
                  >
                    {orbEmoji}
                  </div>
                );
              })()}
              <div className="live-call-phase-label">
                {convPhase === CONV_PHASE.LISTENING        ? "Listening…"
                 : convPhase === CONV_PHASE.TRANSCRIBING   ? "Understanding…"
                 : convPhase === CONV_PHASE.THINKING       ? "Thinking…"
                 : convPhase === CONV_PHASE.GENERATING_AUDIO ? "Preparing voice…"
                 : convPhase === CONV_PHASE.SPEAKING       ? "Speaking…"
                 : convPhase === CONV_PHASE.RECOVERING     ? ""
                 : convPhase === CONV_PHASE.ERROR          ? "Error — tap ✕ to exit"
                 : ""}
              </div>
              {convPhase === CONV_PHASE.LISTENING && (
                <div className="live-call-tap-hint">Speak, then press stop to send</div>
              )}
              {(convPhase === CONV_PHASE.SPEAKING ||
                convPhase === CONV_PHASE.GENERATING_AUDIO ||
                convPhase === CONV_PHASE.THINKING) && (
                <div className="live-call-interrupt-hint">tap orb to interrupt</div>
              )}
              {liveCallDebugMode && convEventLog.length > 0 && (
                <div className="live-call-debug-log">
                  {convEventLog.map((entry, i) => (
                    <div key={i}>{new Date(entry.ts).toISOString().slice(11, 23)} {entry.action}</div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  className="live-call-secondary-btn"
                  onClick={() => setShowLiveBrainWindow((prev) => !prev)}
                >
                  {showLiveBrainWindow ? "Hide Neural Core" : "Show Neural Core"}
                </button>
                {convPhase === CONV_PHASE.LISTENING && (
                  <button
                    type="button"
                    className="live-call-stop-btn"
                    title="Stop listening and send"
                    onClick={liveCallStopListening}
                  >
                    ⬛
                  </button>
                )}
                <button
                  type="button"
                  className="live-call-end-btn"
                  title="End call"
                  onClick={endLiveCall}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Neural Core Window (persists beyond live call) ──────────────── */}
      {showLiveBrainWindow && (
        <aside
          ref={liveBrainWindowRef}
          className={`live-call-brain-window${liveBrainViewMode === "compact" ? " compact" : ""}`}
          aria-label="Live neural core telemetry"
          style={{
            width: `${liveBrainWindow.width}px`,
            height: `${liveBrainWindow.height}px`,
            transform: `translate(${liveBrainWindow.x}px, ${liveBrainWindow.y}px)`,
            position: 'fixed',
            zIndex: 9999,
          }}
        >
          <div className="live-call-brain-head" onPointerDown={handleLiveBrainDragStart}>
            <span className="live-call-brain-title">
              Neural Core · {liveBrainSnapZone}
            </span>
            <div className="live-call-brain-controls">
              <button
                type="button"
                className="live-call-secondary-btn"
                onClick={() => setLiveBrainViewMode((prev) => (prev === "full" ? "compact" : "full"))}
              >
                {liveBrainViewMode === "full" ? "Compact" : "Full"}
              </button>
              <button
                type="button"
                className="live-call-secondary-btn"
                onClick={() => {
                  setLiveBrainWindow({ x: 0, y: 0, width: 720, height: 560 });
                  setLiveBrainSnapZone("center");
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="live-call-secondary-btn"
                onClick={() => setShowLiveBrainWindow(false)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="live-call-brain-body">
            {liveBrainViewMode === "compact" ? (
              <CompactLiveBrain
                brainEvents={Array.isArray(brainEvents) ? brainEvents : []}
                livePhase={convPhase}
              />
            ) : (
              <BrainTab
                brainEvents={Array.isArray(brainEvents) ? brainEvents : []}
                personality={personality}
                livePhase={convPhase}
              />
            )}
          </div>
        </aside>
      )}

      {performanceText && (
        <PerformancePlayer
          personalityId={personality.id}
          text={performanceText}
          voiceProfile={voiceProfile}
          onClose={() => setPerformanceText(null)}
        />
      )}
      <div className="chat-shell">
        <div className={`chat-card${!disableNeuronMap3d && neuralActivity > 0.4 ? " neural-active" : ""}`}>
          {/* Holographic shimmer overlay — static in chat mode */}
          <div
            className="holo-shimmer"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, rgba(78,255,200,0.06) 0%, rgba(130,80,255,0.04) 35%, transparent 60%)",
            }}
          />
          <NeuralCore
            personality={personality}
            mode={activeMode || "scientist"}
            latestDebug={displayDebug}
            livePhase={livePhase}
            liveSeq={liveSeq}
            performanceTier={performanceTier}
            voiceNarrationEnabled={Boolean(neuralProfile?.voiceNarrationEnabled)}
            allowThreeD={!disableNeuronMap3d}
            defaultLayoutView={disableNeuronMap3d}
            onActivityUpdate={handleBrainActivity}
            onUpdateMemory={handleNeuralMemoryUpdate}
            onOpenPersonaEditor={handleOpenEditorTarget}
          />
          <div className="chat-header">
            <div className="chat-header-top">
              <h3>
                <span className="header-avatar-wrap">
                  {personality.moodState && (
                    <span
                      className="mood-dot"
                      title={emotionSpectrum.displayLabel}
                      style={{
                        background: emotionSpectrum.zone.accent,
                        "--mood-dot-glow": emotionSpectrum.zone.glow,
                      }}
                    />
                  )}
                  <AvatarCore
                    size="compact"
                    valence={avatarMood.valence}
                    arousal={avatarMood.arousal}
                    phase={livePhase}
                    speaking={avatarSpeaking}
                    mode={activeMode || "scientist"}
                    personalitySeed={`${personality.id}:${personality.name}:${personality.creativeContext || "default"}`}
                    expressionProfile={personality.expressionProfile}
                    expressionPreset={personality.expressionProfile?.preset || "auto"}
                    neuralActivity={neuralActivity}
                    activitySpike={activitySpike}
                    preResponseState={preResponseState}
                    speechEnergy={speechEnergy}
                    imageUrl={personality?.avatarImageUrl || ""}
                  />
                  <span>{personality.name}</span>
                </span>
              </h3>
              <button type="button" className="debug-toggle" onClick={() => setDebugMode((value) => !value)}>
                {debugMode ? "Hide Debug" : "Show Debug"}
              </button>
              <button type="button" className="debug-toggle" onClick={() => setSysObserverOpen((v) => !v)} style={{ marginLeft: 6 }}>
                {sysObserverOpen ? "Hide System" : "⬡ System"}
              </button>
            </div>
            <p>{personality.description}</p>
            {personality.moodState && (
              <div className="mood-bar">
                <span
                  className="mood-zone-badge"
                  style={{
                    background: emotionSpectrum.zone.accent + "22",
                    color: emotionSpectrum.zone.accent,
                    border: `1px solid ${emotionSpectrum.zone.accent}55`,
                  }}
                >
                  {emotionSpectrum.zone.label}
                </span>
                <span className="mood-emotion-label">{emotionSpectrum.displayLabel}</span>
                <div className="mood-vad-pair">
                  <div className="mood-vad-stat">
                    <span className="mood-vad-label">V</span>
                    <span className="mood-vad-value">{(avatarMood.valence >= 0 ? "+" : "") + Number(avatarMood.valence || 0).toFixed(2)}</span>
                  </div>
                  <div className="mood-vad-stat">
                    <span className="mood-vad-label">A</span>
                    <span className="mood-vad-value">{(avatarMood.arousal >= 0 ? "+" : "") + Number(avatarMood.arousal || 0).toFixed(2)}</span>
                  </div>
                </div>
                {emotionDriftPath && (
                  <svg className="mood-drift-svg" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
                    <line x1="0" y1="12" x2="100" y2="12" stroke="rgba(0,180,255,0.18)" strokeWidth="1" strokeDasharray="2 2" />
                    <polyline
                      points={emotionDriftPath}
                      fill="none"
                      stroke={emotionSpectrum.zone.accent}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>

          <div className="voice-panel">
            <div className="voice-panel-header">
              <div className="voice-panel-label">
          {sysObserverOpen && (
            <div className="sys-observer">
              <div className="sys-observer-inner">
                <div className="sys-observer-grid">

                  {/* LLM */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">LLM</div>
                    <div className="sys-observer-row">
              <div className="voice-telemetry" style={{ marginTop: 6, marginBottom: 6 }}>
                Current TTS Engine: <strong>{currentTtsEngine}</strong>
                {voiceTelemetry?.fallbackUsed ? (
                  <span style={{ marginLeft: 6 }}>
                    (fallback from {String(voiceTelemetry?.fallbackFrom || "primary")})
                  </span>
                ) : null}
              </div>
                      <span className="sys-observer-label">model</span>
                      <span className="sys-observer-value" title={activeUsage?.model || "unknown"}>
                        {activeUsage?.model ? activeUsage.model.split("/").pop() : "—"}
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">tokens in</span>
                      <span className="sys-observer-value">{activeUsage ? Number(activeUsage.inputTokens || 0).toLocaleString() : "—"}</span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">tokens out</span>
                      <span className="sys-observer-value">{activeUsage ? Number(activeUsage.outputTokens || 0).toLocaleString() : "—"}</span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">source</span>
                      <span className="sys-observer-value">{activeUsage?.source === "provider" ? "provider" : "estimate"}</span>
                    </div>
                  </div>

                  {/* Prompt Budget */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">Prompt Budget</div>
                    {(() => {
                      const budget = displayDebug?.prompt?.promptBudget;
                      const util = budget ? Math.round((budget.utilization || 0) * 100) : null;
                      const fillColor = util == null ? "#4ade80" : util >= 90 ? "#fb7185" : util >= 75 ? "#fbbf24" : "#4ade80";
                      return budget ? (
                        <>
                          <div className="sys-observer-row">
                            <span className="sys-observer-label">chars used</span>
                            <span className="sys-observer-value">{Number(budget.charCount || 0).toLocaleString()} / {Number(budget.charBudget || 0).toLocaleString()}</span>
                          </div>
                          <div className="sys-observer-row">
                            <span className="sys-observer-label">~tokens</span>
                            <span className="sys-observer-value">{Number(budget.approxTokens || 0).toLocaleString()}</span>
                          </div>
                          <div className="sys-observer-bar-wrap">
                            <div className="sys-observer-bar-track">
                              <div className="sys-observer-bar-fill" style={{ width: `${util}%`, background: fillColor }} />
                            </div>
                            <div className="sys-observer-bar-label">{util}% utilized</div>
                          </div>
                        </>
                      ) : <span className="sys-observer-label">No prompt data yet</span>;
                    })()}
                  </div>

                  {/* Memory */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">Memory</div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">embeddings</span>
                      {displayDebug?.flags?.embeddingsConfigured === false ? (
                        <span className="sys-observer-status warn">disabled</span>
                      ) : displayDebug?.flags?.embeddingsConfigured === true ? (
                        <span className="sys-observer-status ok">active</span>
                      ) : (
                        <span className="sys-observer-status off">unknown</span>
                      )}
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">injected</span>
                      <span className="sys-observer-value">{displayDebug?.memoryInjected ? displayDebug.memoryInjected.length : "—"}</span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">user memories</span>
                      <span className="sys-observer-value">{displayDebug?.userMemoryRetrieved ? displayDebug.userMemoryRetrieved.length : "—"}</span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">conflicts</span>
                      <span className="sys-observer-value">{displayDebug?.memoryConflicts ? displayDebug.memoryConflicts.length : "—"}</span>
                    </div>
                  </div>

                  {/* Mood Adjudication */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">Mood Adjudication</div>
                    {(() => {
                      const adj = displayDebug?.mood?.adjudication;
                      const runtime = displayDebug?.mood?.runtime;
                      return adj ? (
                        <>
                          <div className="sys-observer-row">
                            <span className="sys-observer-label">method</span>
                            <span className="sys-observer-value">{String(adj.method || adj.source || "vad-decay")}</span>
                          </div>
                          <div className="sys-observer-row">
                            <span className="sys-observer-label">Δ valence</span>
                            <span className="sys-observer-value">
                              {Number.isFinite(adj.delta?.valence) ? (adj.delta.valence >= 0 ? "+" : "") + adj.delta.valence.toFixed(3) : "—"}
                            </span>
                          </div>
                          <div className="sys-observer-row">
                            <span className="sys-observer-label">Δ arousal</span>
                            <span className="sys-observer-value">
                              {Number.isFinite(adj.delta?.arousal) ? (adj.delta.arousal >= 0 ? "+" : "") + adj.delta.arousal.toFixed(3) : "—"}
                            </span>
                          </div>
                          {runtime != null && (
                            <div className="sys-observer-row">
                              <span className="sys-observer-label">runtime</span>
                              <span className="sys-observer-value">{String(runtime)}</span>
                            </div>
                          )}
                        </>
                      ) : <span className="sys-observer-label">No adjudication data yet</span>;
                    })()}
                  </div>

                  {/* Request Rates */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">Requests (60s)</div>
                    {requestMetrics?.alerts?.highRequestRate ? (
                      <div className="sys-observer-row" style={{ marginBottom: 6 }}>
                        <span className="sys-observer-status warn">high activity</span>
                        <span className="sys-observer-value">{requestMetrics.alerts.message}</span>
                      </div>
                    ) : null}
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">total</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.all?.perMin || 0).toLocaleString()} req/min
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">cartesia</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.cartesia?.perMin || 0).toLocaleString()} req/min
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">tts</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.tts?.perMin || 0).toLocaleString()} req/min
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">stt</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.stt?.perMin || 0).toLocaleString()} req/min
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">llm</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.llm?.perMin || 0).toLocaleString()} req/min
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">settings</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.settings?.perMin || 0).toLocaleString()} req/min
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">lifetime total</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.categories?.all?.total || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">websockets active</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.transport?.websocketsActive || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">event sources active</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.transport?.eventSourcesActive || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">streams active</span>
                      <span className="sys-observer-value">
                        {Number(requestMetrics?.transport?.streamsActive || 0).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                      <div className="sys-observer-label" style={{ marginBottom: 6 }}>Top Talkers</div>
                      {Array.isArray(requestMetrics?.topTalkers) && requestMetrics.topTalkers.length > 0 ? (
                        <div style={{ display: "grid", gap: 4 }}>
                          {requestMetrics.topTalkers.map((item) => {
                            const bins = Array.isArray(item.sparkBins) ? item.sparkBins : [];
                            const maxBin = Math.max(1, ...bins);
                            const severity = String(item.severity || "normal");
                            const sparkColor =
                              severity === "hot"
                                ? "#fb7185"
                                : severity === "warn"
                                  ? "#fbbf24"
                                  : "rgba(78,255,216,0.9)";
                            const badgeStyle =
                              severity === "hot"
                                ? { background: "rgba(251,113,133,0.22)", color: "#fb7185", border: "1px solid rgba(251,113,133,0.45)" }
                                : severity === "warn"
                                  ? { background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.45)" }
                                  : { background: "rgba(78,255,216,0.14)", color: "#4effd8", border: "1px solid rgba(78,255,216,0.35)" };
                            const points = bins.length > 1
                              ? bins
                                .map((value, index) => {
                                  const x = (index / (bins.length - 1)) * 56;
                                  const y = 16 - (Number(value || 0) / maxBin) * 14;
                                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                                })
                                .join(" ")
                              : "0,16 56,16";

                            return (
                              <div className="sys-observer-row" key={item.endpoint}>
                                <span className="sys-observer-label" title={item.endpoint} style={{ maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.endpoint}
                                </span>
                                <svg width="56" height="16" viewBox="0 0 56 16" aria-hidden="true" style={{ opacity: 0.85, marginLeft: 6, marginRight: 6 }}>
                                  <polyline points={points} fill="none" stroke={sparkColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span style={{ ...badgeStyle, borderRadius: 999, padding: "0 6px", fontSize: "0.63rem", lineHeight: "1.1rem", marginRight: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {severity}
                                </span>
                                <span className="sys-observer-value">{Number(item.perMin || 0).toLocaleString()} req/min</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="sys-observer-label">No active endpoints in the last minute.</span>
                      )}
                    </div>

                    <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                      <div className="sys-observer-label" style={{ marginBottom: 6 }}>Recent Lineage</div>
                      {Array.isArray(requestMetrics?.recentRequests) && requestMetrics.recentRequests.length > 0 ? (
                        <div style={{ display: "grid", gap: 4 }}>
                          {requestMetrics.recentRequests.slice(-5).reverse().map((item, index) => (
                            <div className="sys-observer-row" key={`${item.at}-${index}`}>
                              <span className="sys-observer-label" title={`${item.cause || "unknown-cause"} -> ${item.endpoint}`} style={{ maxWidth: "74%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.cause || "unknown-cause"}{" -> "}{item.endpoint}
                              </span>
                              <span className="sys-observer-value">{item.method}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="sys-observer-label">No recent lineage data.</span>
                      )}
                    </div>
                  </div>

                  {/* Persona State Monitor */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">Live State Monitor</div>
                    {(() => {
                      const runtime = displayDebug?.stateRuntime;
                      const snapshot = runtime?.snapshot;
                      const directives = runtime?.directives;
                      const stability = Number(runtime?.stabilityIndex);
                      const channels = [
                        { key: "intoxication", label: "intoxication", value: Number(snapshot?.intoxication || 0), hue: "#ff9f43" },
                        { key: "fatigue", label: "fatigue", value: Number(snapshot?.fatigue || 0), hue: "#feca57" },
                        { key: "agitation", label: "agitation", value: Number(snapshot?.agitation || 0), hue: "#ff6b6b" },
                        { key: "focus", label: "focus", value: Number(snapshot?.focus || 0), hue: "#2ed573" },
                      ];

                      function Sparkline({ dataKey, hue }) {
                        const pts = stateDriftHistory.map((e) => e[dataKey] ?? 0);
                        if (pts.length < 2) return null;
                        const w = 60, h = 14, pad = 1;
                        const xs = pts.map((_, i) => pad + (i / (pts.length - 1)) * (w - pad * 2));
                        const ys = pts.map((v) => pad + (1 - Math.max(0, Math.min(1, v))) * (h - pad * 2));
                        const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
                        return (
                          <svg width={w} height={h} style={{ display: "block", flexShrink: 0, opacity: 0.85 }}>
                            <polyline points={pts.map((v, i) => `${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ")} fill="none" stroke={hue} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        );
                      }

                      if (!snapshot) {
                        return <span className="sys-observer-label">No state runtime data yet. Enable a channel and send a message.</span>;
                      }

                      return (
                        <>
                          {channels.map((item) => (
                            <div key={item.key} style={{ marginBottom: "6px" }}>
                              <div className="sys-observer-row" style={{ marginBottom: "2px" }}>
                                <span className="sys-observer-label">{item.label}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Sparkline dataKey={item.key} hue={item.hue} />
                                  <span className="sys-observer-value">{Math.round(Math.max(0, Math.min(1, item.value)) * 100)}%</span>
                                </div>
                              </div>
                              <div className="sys-observer-bar-track">
                                <div
                                  className="sys-observer-bar-fill"
                                  style={{
                                    width: `${Math.round(Math.max(0, Math.min(1, item.value)) * 100)}%`,
                                    background: item.hue,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px" }}>
                            <div className="sys-observer-row">
                              <span className="sys-observer-label">stability index</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Sparkline dataKey="stabilityIndex" hue="#a29bfe" />
                                <span className="sys-observer-value">{Number.isFinite(stability) ? `${Math.round(Math.max(0, Math.min(1, stability)) * 100)}%` : "—"}</span>
                              </div>
                            </div>
                            {[
                              { k: "coherencePenalty", label: "coherence penalty" },
                              { k: "fragmentation", label: "fragmentation" },
                              { k: "interruptions", label: "interruptions" },
                              { k: "tangentChance", label: "tangent chance" },
                              { k: "fillerRate", label: "filler rate" },
                              { k: "impulseBurpChance", label: "burp impulse" },
                            ].map(({ k, label }) => {
                              const val = Number(directives?.[k]);
                              return (
                                <div className="sys-observer-row" key={k}>
                                  <span className="sys-observer-label">{label}</span>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Sparkline dataKey={k} hue="#74b9ff" />
                                    <span className="sys-observer-value">{Number.isFinite(val) ? `${Math.round(Math.max(0, Math.min(1, val)) * 100)}%` : "—"}</span>
                                  </div>
                                </div>
                              );
                            })}
                            {stateDriftHistory.length > 0 && (
                              <div className="sys-observer-row" style={{ marginTop: "4px" }}>
                                <span className="sys-observer-label" style={{ opacity: 0.5 }}>turns tracked</span>
                                <span className="sys-observer-value" style={{ opacity: 0.5 }}>{stateDriftHistory.length}</span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* TTS */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">TTS</div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">engine</span>
                      <span className="sys-observer-value">{voiceTelemetry ? String(voiceTelemetry.chosenEngine || "—") : "—"}</span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">requested</span>
                      <span className="sys-observer-value">{voiceTelemetry ? String(voiceTelemetry.requestedRaw || voiceTelemetry.requested || "auto") : "—"}</span>
                    </div>
                    <div className="sys-observer-row">
                      <span className="sys-observer-label">fallback</span>
                      {voiceTelemetry ? (
                        voiceTelemetry.fallbackUsed ? (
                          <span className="sys-observer-status warn">from {String(voiceTelemetry.fallbackFrom || "primary")}</span>
                        ) : (
                          <span className="sys-observer-status ok">none</span>
                        )
                      ) : <span className="sys-observer-value">—</span>}
                    </div>
                    {voiceTelemetry?.fallbackUsed && voiceTelemetry.fallbackReason ? (
                      <div className="sys-observer-row">
                        <span className="sys-observer-label">reason</span>
                        <span className="sys-observer-value" title={String(voiceTelemetry.fallbackReason)}>
                          {String(voiceTelemetry.fallbackReason).slice(0, 24)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Rate Limit */}
                  <div className="sys-observer-card">
                    <div className="sys-observer-card-title">Rate Limit</div>
                    {(() => {
                      const rl = displayDebug?.rateLimit;
                      return rl ? (
                        <>
                          <div className="sys-observer-row">
                            <span className="sys-observer-label">hit</span>
                            {rl.hit ? <span className="sys-observer-status warn">yes</span> : <span className="sys-observer-status ok">no</span>}
                          </div>
                          {rl.retryAttempted ? (
                            <div className="sys-observer-row">
                              <span className="sys-observer-label">retry</span>
                              {rl.retrySucceeded ? <span className="sys-observer-status ok">ok</span> : <span className="sys-observer-status warn">failed</span>}
                            </div>
                          ) : null}
                          {rl.fallbackDelivered ? (
                            <div className="sys-observer-row">
                              <span className="sys-observer-label">fallback</span>
                              <span className="sys-observer-status warn">delivered</span>
                            </div>
                          ) : null}
                        </>
                      ) : <span className="sys-observer-label">No rate limit events</span>;
                    })()}
                  </div>

                </div>
              </div>
            </div>
          )}
                <span className="voice-panel-dot" />
                QUICK VOICE
              </div>
              <span className={`voice-provider-badge ${providerBadge.tone}`.trim()}>{providerBadge.label}</span>
              <button type="button" className="voice-open-lab" onClick={onOpenVoiceLab}>
                ⚗ Full Voice Lab
              </button>
            </div>

            {/* ── Voice Stack quick row ──────────────────────────────── */}
            {(() => {
              const engine = String(voiceProfile.engine || "auto").trim().toLowerCase();
              const voiceName = (() => {
                if (engine === "kokoro") return String(voiceProfile.kokoroVoice || "af_heart").trim();
                if (engine === "cartesia" || (TTS_DEBUG_PROVIDER_LOCK && engine === "auto")) {
                  const id = String(voiceProfile.cartesiaVoiceId || "").trim();
                  if (!id) return "— none —";
                  const found = cartesiaVoiceOptions.find((v) => v.id === id);
                  return found ? found.label : id.slice(0, 16) + (id.length > 16 ? "…" : "");
                }
                return String(voiceProfile.providerVoice || "alloy").trim();
              })();
              const voiceId = engine === "kokoro"
                ? String(voiceProfile.kokoroVoice || "af_heart").trim()
                : engine === "cartesia" || (TTS_DEBUG_PROVIDER_LOCK && engine === "auto")
                  ? String(voiceProfile.cartesiaVoiceId || "").trim()
                  : String(voiceProfile.providerVoice || "").trim();
              const isFav = engine === "kokoro"
                ? favoriteKokoroVoiceIds.has(voiceId)
                : favoriteCartesiaVoiceIds.has(voiceId);
              const suggested = recommendedCartesiaVoice;
              const showSuggested = suggested && suggested.id !== String(voiceProfile.cartesiaVoiceId || "").trim() && (engine === "cartesia" || (TTS_DEBUG_PROVIDER_LOCK && engine === "auto"));
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "4px 0 6px", borderBottom: "1px solid rgba(0,234,255,0.08)", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{engine}</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.9, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{voiceName}</span>
                  {voiceId ? (
                    <button
                      type="button"
                      title={isFav ? "Unfavorite" : "Favorite this voice"}
                      onClick={() => {
                        const voiceObj = { id: voiceId, label: voiceName };
                        const eng = (engine === "cartesia" || (TTS_DEBUG_PROVIDER_LOCK && engine === "auto")) ? "cartesia" : "kokoro";
                        toggleQuickVoiceFavorite(eng, voiceObj);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: isFav ? "#ffd700" : "rgba(255,255,255,0.45)", padding: "0 2px" }}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  ) : null}
                  {showSuggested ? (
                    <button
                      type="button"
                      title={`Suggested: ${suggested.label}`}
                      onClick={() => handleQuickCartesiaVoiceChange(suggested.id)}
                      style={{ background: "none", border: "1px solid rgba(0,234,255,0.35)", borderRadius: 10, cursor: "pointer", fontSize: "0.7rem", color: "#00eaff", padding: "1px 7px", whiteSpace: "nowrap" }}
                    >
                      💡 {suggested.label.split(" ")[0]}
                    </button>
                  ) : null}
                </div>
              );
            })()}

            <div className="voice-toggles">
              <label className="voice-toggle">
                <input
                  type="checkbox"
                  checked={voiceProfile.enabled}
                  onChange={(event) => updateVoiceField("enabled", event.target.checked)}
                />
                <span className="voice-toggle-track" />
                <span className="voice-toggle-label">Voice playback</span>
              </label>
              <label className="voice-toggle">
                <input
                  type="checkbox"
                  checked={voiceProfile.autoplay}
                  onChange={(event) => updateVoiceField("autoplay", event.target.checked)}
                />
                <span className="voice-toggle-track" />
                <span className="voice-toggle-label">Auto-play replies</span>
              </label>
            </div>

            <div className="voice-selector">
              <label htmlFor="voice-engine-select">Engine:</label>
              <select
                id="voice-engine-select"
                value={voiceProfile.engine || "auto"}
                onChange={(event) => updateVoiceField("engine", normalizeVoiceEngineForDebug(event.target.value))}
                style={{ marginBottom: 6 }}
              >
                {TTS_DEBUG_PROVIDER_LOCK ? (
                  <>
                    <option value="auto">{TTS_DISABLE_KOKORO ? "Auto (cartesia only)" : "Auto (cartesia → kokoro)"}</option>
                    {TTS_DISABLE_KOKORO ? null : <option value="kokoro">Kokoro (local, free)</option>}
                    <option value="cartesia">Cartesia</option>
                  </>
                ) : (
                  <>
                    <option value="auto">Auto (server default)</option>
                    <option value="cloud">Cloud (OpenAI)</option>
                    <option value="kokoro">Kokoro (local, free)</option>
                    <option value="piper">Piper (local)</option>
                    <option value="elevenlabs">ElevenLabs</option>
                    <option value="cartesia">Cartesia</option>
                  </>
                )}
              </select>
              <label htmlFor="voice-quick-select">Voice:</label>
              {voiceProfile.engine === "kokoro" ? (
                <>
                  <select
                    id="voice-quick-select"
                    value={voiceProfile.kokoroVoice || "af_heart"}
                    onChange={(event) => handleQuickKokoroVoiceChange(event.target.value)}
                  >
                    <option value="af_heart">af_heart — warm female</option>
                    <option value="af_nova">af_nova — energetic female</option>
                    <option value="af_sarah">af_sarah — casual female</option>
                    <option value="af_sky">af_sky — light female</option>
                    <option value="am_adam">am_adam — warm male</option>
                    <option value="am_onyx">am_onyx — deep male</option>
                    <option value="am_michael">am_michael — mid male</option>
                    <option value="bf_alice">bf_alice — British female</option>
                    <option value="bf_emma">bf_emma — expressive British female</option>
                    <option value="bm_george">bm_george — engaging British male</option>
                    <option value="bm_lewis">bm_lewis — calm British male</option>
                  </select>
                  <div className="voice-telemetry" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="voice-open-lab"
                      style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                      onClick={() =>
                        toggleQuickVoiceFavorite("kokoro", {
                          id: String(voiceProfile.kokoroVoice || "").trim(),
                          label: String(voiceProfile.kokoroVoice || "kokoro").trim(),
                        })
                      }
                    >
                      {favoriteKokoroVoiceIds.has(String(voiceProfile.kokoroVoice || "").trim()) ? "★ Unfavorite" : "☆ Favorite"}
                    </button>
                    <span style={{ marginLeft: 8, opacity: 0.85 }}>Switching voice re-renders latest reply audio.</span>
                  </div>
                </>
              ) : voiceProfile.engine === "cartesia" || (TTS_DEBUG_PROVIDER_LOCK && voiceProfile.engine === "auto") ? (
                <>
                  <select
                    id="voice-quick-select"
                    value={selectedCartesiaVoiceOption}
                    onChange={(event) => {
                      const nextValue = String(event.target.value || "");
                      if (nextValue === CUSTOM_CARTESIA_VOICE_OPTION) {
                        if (!String(voiceProfile.cartesiaVoiceId || "").trim()) {
                          updateVoiceField("cartesiaVoiceId", "");
                        }
                        return;
                      }
                      handleQuickCartesiaVoiceChange(nextValue);
                    }}
                  >
                    {cartesiaFavoriteOptions.length > 0 ? (
                      <>
                        <option value="" disabled>Favorites</option>
                        {cartesiaFavoriteOptions.map((voice) => (
                          <option key={`fav-${voice.id}`} value={voice.id}>★ {voice.label}</option>
                        ))}
                      </>
                    ) : null}
                    {cartesiaVoiceOptions.map((voice) => (
                      <option key={voice.id} value={voice.id}>{voice.label}</option>
                    ))}
                    {/* If the saved voice is not in the fetched list, show it explicitly */}
                    {voiceProfile.cartesiaVoiceId &&
                      !cartesiaVoiceOptions.some((v) => v.id === voiceProfile.cartesiaVoiceId) ? (
                      <option value={voiceProfile.cartesiaVoiceId}>
                        {voiceProfile.cartesiaVoiceId} (saved)
                      </option>
                    ) : null}
                    <option value={CUSTOM_CARTESIA_VOICE_OPTION}>Custom voice ID...</option>
                  </select>
                  {selectedCartesiaVoiceOption === CUSTOM_CARTESIA_VOICE_OPTION ? (
                    <input
                      type="text"
                      placeholder="Cartesia voice ID (UUID)"
                      value={voiceProfile.cartesiaVoiceId || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateVoiceField("cartesiaVoiceId", value);
                        updateVoiceField("providerVoice", value);
                        updateVoiceField("preferredVoice", value);
                      }}
                      style={{ marginTop: 8, fontFamily: "monospace", fontSize: "0.78rem", padding: "4px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,234,255,0.2)", color: "#88ecff", width: "100%", boxSizing: "border-box" }}
                    />
                  ) : null}
                  <div className="voice-telemetry" style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="voice-open-lab"
                      style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                      disabled={isLoadingCartesiaVoices}
                      onClick={() => void loadCartesiaVoiceOptions({ force: true })}
                    >
                      {isLoadingCartesiaVoices ? "Refreshing..." : `Refresh list (${cartesiaVoiceOptions.length})`}
                    </button>
                    <button
                      type="button"
                      className="voice-open-lab"
                      style={{ padding: "2px 8px", fontSize: "0.68rem", marginLeft: 8 }}
                      onClick={() => {
                        const selectedVoice = cartesiaVoiceOptions.find((voice) => voice.id === String(voiceProfile.cartesiaVoiceId || "").trim());
                        if (!selectedVoice) {
                          return;
                        }
                        toggleQuickVoiceFavorite("cartesia", selectedVoice);
                      }}
                    >
                      {favoriteCartesiaVoiceIds.has(String(voiceProfile.cartesiaVoiceId || "").trim()) ? "★ Unfavorite" : "☆ Favorite"}
                    </button>
                  </div>
                  {recommendedCartesiaVoice && String(voiceProfile.cartesiaVoiceId || "").trim() !== String(recommendedCartesiaVoice.id || "").trim() ? (
                    <div className="voice-telemetry" style={{ marginTop: 4 }}>
                      Suggested for this persona: {recommendedCartesiaVoice.label}
                      <button
                        type="button"
                        className="voice-open-lab"
                        style={{ padding: "2px 8px", fontSize: "0.68rem", marginLeft: 8 }}
                        onClick={() => handleQuickCartesiaVoiceChange(recommendedCartesiaVoice.id)}
                      >
                        Use Suggested
                      </button>
                    </div>
                  ) : null}
                  {cartesiaVoiceLoadError ? (
                    <div className="voice-telemetry" style={{ marginTop: 4, color: "#ff9b9b" }}>
                      {cartesiaVoiceLoadError}
                    </div>
                  ) : null}
                </>
              ) : (
                <select
                  id="voice-quick-select"
                  value={voiceProfile.providerVoice || "alloy"}
                  onChange={(event) => updateVoiceField("providerVoice", event.target.value)}
                >
                  <option value="alloy">Alloy — neutral, balanced</option>
                  <option value="echo">Echo — steady, expressive</option>
                  <option value="fable">Fable — warm, engaging</option>
                  <option value="onyx">Onyx — deep, authoritative</option>
                  <option value="nova">Nova — bright, dynamic</option>
                  <option value="shimmer">Shimmer — crisp, energetic</option>
                  <option value="ash">Ash — measured</option>
                  <option value="sage">Sage — calm female</option>
                </select>
              )}
            </div>

            <div className="voice-quick-controls">
              <div className="voice-control-row">
                <div className="voice-control-header">
                  <span className="voice-control-label">Pitch</span>
                  <span className="voice-control-value">{(voiceProfile.pitch || 0).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  className="voice-slider"
                  min="-20"
                  max="20"
                  step="0.1"
                  value={voiceProfile.pitch || 0}
                  onChange={(e) => updateVoiceField("pitch", parseFloat(e.target.value))}
                />
              </div>
              <div className="voice-control-row">
                <div className="voice-control-header">
                  <span className="voice-control-label">Rate</span>
                  <span className="voice-control-value">{(voiceProfile.rate || 1).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  className="voice-slider"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={voiceProfile.rate || 1}
                  onChange={(e) => updateVoiceField("rate", parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="voice-actions">
              <button
                type="button"
                className="voice-icon-btn primary"
                data-tip={isGeneratingAudio ? "Generating…" : "Play Latest Reply"}
                onClick={() => void generateAudio(latestAssistantSpeechText)}
                disabled={isGeneratingAudio || !latestAssistantMessage}
                aria-label="Play Latest Reply"
              >
                {isGeneratingAudio ? "⟳" : "▶"}
              </button>
              <button
                type="button"
                className="voice-icon-btn"
                data-tip="Stop Playback"
                onClick={stopSpeaking}
                aria-label="Stop Playback"
              >
                ■
              </button>
              <button
                type="button"
                className="voice-icon-btn"
                data-tip={isSavingVoice ? "Saving…" : "Save Quick Voice"}
                onClick={handleSaveVoiceProfile}
                disabled={isSavingVoice}
                aria-label="Save Quick Voice"
              >
                {isSavingVoice ? "⟳" : "💾"}
              </button>
            </div>

            {voiceTelemetry?.emotionFrame ? (
              <div className="voice-telemetry">
                Voice emotion: {String(voiceTelemetry.emotionFrame.displayLabel || "Neutral")} | Zone:
                {` ${String(voiceTelemetry.emotionFrame.zone?.label || "Green Zone")}`} | Intensity:
                {` ${Math.round(Number(voiceTelemetry.emotionFrame.intensity || 0) * 100)}%`}
              </div>
            ) : null}

            {voiceTelemetry ? (
              <div className="voice-telemetry">
                TTS engine: {String(voiceTelemetry.requestedRaw || voiceTelemetry.requested || "auto")}
                {voiceTelemetry.requestedCoerced ? ` -> ${String(voiceTelemetry.requested || "auto")}` : ""}
                {` -> ${String(voiceTelemetry.chosenEngine || "unknown")}`}
                {voiceTelemetry.fallbackUsed
                  ? ` (fallback from ${String(voiceTelemetry.fallbackFrom || "primary")})`
                  : ""}
                {voiceTelemetry.fallbackUsed && voiceTelemetry.fallbackReason
                  ? ` | reason: ${String(voiceTelemetry.fallbackReason)}`
                  : ""}
                {Array.isArray(voiceTelemetry.attemptedEngines) && voiceTelemetry.attemptedEngines.length > 0
                  ? ` | attempts: ${voiceTelemetry.attemptedEngines.map((item) => String(item || "").trim()).filter(Boolean).join(" -> ")}`
                  : ""}
              </div>
            ) : null}

            {voiceTelemetry?.expressiveText ? (
              <div className="expressive-speech">
                <span className="expressive-speech-label">voice rendering</span>
                {String(voiceTelemetry.expressiveText)}
              </div>
            ) : null}

            {activePersonalityEvents.length > 0 ? (
              <div className="personality-events" role="status" aria-live="polite">
                {activePersonalityEvents.map((event) => {
                  const eventTypeClass = event.type === "voice-tag" ? "voice-tag" : "catchphrase";
                  const label = event.type === "voice-tag"
                    ? "voice tag"
                    : event.spoken
                      ? "spoken phrase"
                      : "overlay phrase";
                  const text = event.text || event.tag;

                  return (
                    <div key={event.key} className={`personality-event-chip ${eventTypeClass}`}>
                      <span className="personality-event-label">{label}</span>
                      <span className="personality-event-text">&ldquo;{text}&rdquo;</span>
                      {Number(event.count || 1) > 1 ? (
                        <span className="personality-event-count">x{Number(event.count)}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {audioUrl ? (
              <audio
                id="voxis-audio-player"
                ref={audioRef}
                className="audio-player"
                controls
                src={audioUrl}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={handleAudioEnded}
              />
            ) : null}

            {audioUrl ? (
              <div className="speed-control">
                <span className="speed-control-label">speed</span>
                {[0.75, 1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`speed-btn${speechPlaybackRate === rate ? " active" : ""}`}
                    onClick={() => handlePlaybackRateChange(rate)}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Ambient Avatar Panel ──────────────────────────────── */}
          <div className="avatar-panel">
            <div className={`avatar-panel-orb${neuralActivity > 0.45 ? " thinking-tilt" : ""}`}>
              <AvatarCore
                size="large"
                valence={avatarMood.valence}
                arousal={avatarMood.arousal}
                phase={livePhase}
                speaking={avatarSpeaking}
                mode={activeMode || "scientist"}
                personalitySeed={`${personality.id}:${personality.name}:${personality.creativeContext || "default"}`}
                expressionProfile={personality.expressionProfile}
                expressionPreset={personality.expressionProfile?.preset || "auto"}
                neuralActivity={neuralActivity}
                activitySpike={activitySpike}
                preResponseState={preResponseState}
                speechEnergy={speechEnergy}
                imageUrl={personality?.avatarImageUrl || ""}
              />
            </div>
            <div className="avatar-panel-name">{personality.name}</div>
            <MiniBrain brainEvents={brainEvents} />
            <div className="avatar-panel-mood">
              <span
                className={`avatar-panel-zone-pill${zoneShiftActive ? " zone-shift" : ""}`}
                style={{
                  "--zone-border": emotionSpectrum.zone.border,
                  "--zone-text": emotionSpectrum.zone.text,
                  "--zone-glow": emotionSpectrum.zone.glow,
                  "--zone-surface": emotionSpectrum.zone.surface,
                }}
              >
                {emotionSpectrum.zone.label}
              </span>
              <span className="avatar-panel-emotion">{emotionSpectrum.displayLabel}</span>
              <div className="avatar-panel-spectrum">
                <div className="avatar-panel-spectrum-track">
                  <span
                    className={`avatar-panel-spectrum-marker${zoneShiftActive ? " zone-shift" : ""}`}
                    style={{
                      left: `${Math.round(((emotionSpectrum.normalized.valence + 1) / 2) * 100)}%`,
                      "--zone-accent": emotionSpectrum.zone.accent,
                      "--zone-glow": emotionSpectrum.zone.glow,
                    }}
                  />
                </div>
                <div className="avatar-panel-intensity">
                  Intensity {Math.round(emotionSpectrum.intensity * 100)}%
                </div>
                <div className="avatar-panel-drift">
                  <div className="avatar-panel-drift-label">Emotional Drift</div>
                  <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
                    <line className="avatar-panel-drift-axis" x1="0" y1="12" x2="100" y2="12" />
                    {emotionDriftPath ? <polyline className="avatar-panel-drift-line" points={emotionDriftPath} /> : null}
                  </svg>
                </div>
              </div>
            </div>
            <div className="avatar-panel-divider" />
            <div className="avatar-panel-stats">
              <div className="avatar-panel-stat">
                <div className="avatar-panel-stat-label">Valence</div>
                <div className="avatar-panel-bar-track">
                  <div
                    className="avatar-panel-bar-fill"
                    style={{
                      width: `${Math.round((Number(avatarMood.valence || 0) + 1) / 2 * 100)}%`,
                      background: "linear-gradient(90deg, #00d4ff, #4ade80)",
                    }}
                  />
                </div>
              </div>
              <div className="avatar-panel-stat">
                <div className="avatar-panel-stat-label">Arousal</div>
                <div className="avatar-panel-bar-track">
                  <div
                    className="avatar-panel-bar-fill"
                    style={{
                      width: `${Math.round(Math.abs(Number(avatarMood.arousal || 0)) * 100)}%`,
                      background: "linear-gradient(90deg, #9b59ff, #ff2d78)",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="avatar-panel-phase">
              <span className={`avatar-panel-phase-badge${livePhase ? " active" : ""}`}>
                {livePhase || "idle"}
              </span>
            </div>
          </div>

          <div className="message-list" ref={messageListRef} onScroll={handleMessageListScroll}>
            {performanceTier !== "light" ? (
              <svg className="chat-neural-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="48" y1="40" x2="24" y2="20" className={neuralSignal.memoryActive ? "active" : ""} />
                <line x1="48" y1="40" x2="78" y2="24" className={neuralSignal.intentActive ? "active" : ""} />
                <line x1="48" y1="40" x2="72" y2="72" className={neuralSignal.identityActive ? "active" : ""} />
                <line x1="48" y1="40" x2="22" y2="70" className={Math.abs(neuralSignal.valence) > 0.2 ? "active" : ""} />

                <circle cx="48" cy="40" r={2.4 + Math.abs(neuralSignal.arousal) * (performanceTier === "full" ? 2.2 : 1.5)} />
                <circle cx="24" cy="20" r="1.6" />
                <circle cx="78" cy="24" r="1.7" />
                <circle cx="72" cy="72" r="1.5" />
                <circle cx="22" cy="70" r="1.5" />
              </svg>
            ) : null}

            {isLoadingMessages ? (
              <div className="empty-chat">Loading persisted conversation history...</div>
            ) : renderedMessages.length ? (
              <>
                {renderedMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`message-bubble ${message.role}${message.live ? " live" : ""}`}>
                    <span className="message-role">
                      {message.role === "assistant" ? personality.name : "You"}
                    </span>
                    {message.live ? (
                      <>
                        <span className="live-phase">{message.phase || "processing"}</span>
                        {activeMode === "scientist"
                          ? message.content || "Thinking..."
                          : message.displayContent || message.content || "Thinking..."}
                      </>
                    ) : message.role === "assistant" ? (
                      (() => {
                        const formatted = getAssistantDisplayContent(message, activeMode);
                        const canPerform = !message.live && Boolean(message.isPerformanceOutput || isEPF(message.content));
                        return (
                          <>
                            <div className="assistant-normal-main">{formatted.main}</div>
                            {formatted.nextQuestions ? (
                              <div className="assistant-next-questions">
                                <strong>Next Questions</strong>
                                {formatted.nextQuestions}
                              </div>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void generateAudio(getAssistantSpeechContent(message))}
                              disabled={isGeneratingAudio || !voiceProfile.enabled}
                              title="Replay this response"
                              style={{
                                marginTop: "6px",
                                padding: "2px 7px",
                                borderRadius: "999px",
                                border: "1px solid rgba(0,180,255,0.2)",
                                background: "rgba(0,180,255,0.06)",
                                color: "#8fdfff",
                                fontWeight: 700,
                                fontSize: "0.62rem",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                cursor: isGeneratingAudio || !voiceProfile.enabled ? "not-allowed" : "pointer",
                                opacity: isGeneratingAudio || !voiceProfile.enabled ? 0.5 : 1,
                              }}
                            >
                              Replay
                            </button>
                            {canPerform && (
                              <button
                                type="button"
                                style={{
                                  marginTop: "10px",
                                  padding: "6px 14px",
                                  borderRadius: "999px",
                                  border: "1px solid rgba(0,234,255,0.30)",
                                  background: "rgba(0,234,255,0.08)",
                                  color: "#00eaff",
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                }}
                                onClick={() => setPerformanceText(message.content)}
                              >
                                ▶ Perform
                              </button>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      message.content
                    )}
                    {debugMode && message.role === "assistant" && message.debug ? (
                      (() => {
                        const lensSummary = getResponseLensSummary(message.debug);
                        return (
                          <>
                            {lensSummary ? (
                              <div className="debug-summary">
                                <span className="debug-summary-title">{lensSummary.title}</span>
                                <p className="debug-summary-body">{lensSummary.body}</p>
                                <div className="debug-summary-meta">
                                  {lensSummary.chips.map((chip) => (
                                    <span key={chip} className="debug-summary-chip">{chip}</span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            <pre className="debug-panel">{JSON.stringify(message.debug, null, 2)}</pre>
                          </>
                        );
                      })()
                    ) : null}
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-chat">
                No conversation yet. Send the first message and Voxis will inject the stored
                system prompt plus the recent message history into the LLM request.
              </div>
            )}
          </div>

          {activeUsage ? (
            <div
              className={`context-meter${usagePercent >= 90 ? " danger" : usagePercent >= 75 ? " warn" : ""}`}
              title="Estimated context window usage for this chat turn."
            >
              <div className="context-meter-header">
                <span className="context-meter-label">Context Window</span>
                <span className="context-meter-actions">
                  <span className="context-meter-value">{usagePercent}%</span>
                  <button
                    type="button"
                    className="context-meter-info"
                    aria-label="Show context usage details"
                  >
                    i
                  </button>
                </span>
              </div>
              <div className="context-meter-track" aria-hidden="true">
                <div className="context-meter-fill" style={{ width: `${usagePercent}%` }} />
              </div>
              <div className="context-meter-meta">
                <span>{Number(activeUsage.totalTokens || 0).toLocaleString()} / {Number(activeUsage.maxTokens || 0).toLocaleString()} tokens</span>
                <span>{String(activeUsage.source || "estimate")}</span>
              </div>
              <div className="context-meter-details" role="tooltip">
                <div className="context-meter-details-title">Turn Usage Breakdown</div>
                <dl className="context-meter-details-grid">
                  <dt>Model</dt>
                  <dd>{usageModelLabel}</dd>
                  <dt>Input</dt>
                  <dd>{Number(activeUsage.inputTokens || 0).toLocaleString()} tokens</dd>
                  <dt>Output</dt>
                  <dd>{Number(activeUsage.outputTokens || 0).toLocaleString()} tokens</dd>
                  <dt>Total</dt>
                  <dd>{Number(activeUsage.totalTokens || 0).toLocaleString()} tokens</dd>
                  <dt>Source</dt>
                  <dd>{usageSourceLabel}</dd>
                </dl>
              </div>
            </div>
          ) : null}

          <form 
            className={`composer ${isDragging ? "dragging" : ""}`}
            onSubmit={handleSubmit}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="composer-input-wrap">
              <textarea
                placeholder={`Message ${personality.name}...`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="composer-actions">
                <button
                  type="button"
                  className={`composer-icon-btn ${isRecording ? "recording" : ""}`}
                  onClick={toggleRecording}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className={`composer-icon-btn${isLiveCallActive ? " live-call-active" : ""}`}
                  onClick={isLiveCallActive ? endLiveCall : startLiveCall}
                  title={isLiveCallActive ? "End live call" : "Start live call (voice conversation)"}
                >
                  {isLiveCallActive ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1a9 9 0 0 1-9-9V2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.38 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="composer-icon-btn"
                  onClick={handleFileButtonClick}
                  title="Attach file"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              </div>
              {attachedFile && (
                <div className="composer-file-preview">
                  <span className="composer-file-preview-name">{attachedFile.name}</span>
                  <button
                    type="button"
                    className="composer-file-preview-remove"
                    onClick={handleRemoveFile}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <button type="submit" disabled={isSending || !draft.trim()}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
