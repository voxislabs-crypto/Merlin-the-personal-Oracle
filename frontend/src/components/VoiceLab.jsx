import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { getApiErrorMessage, readApiResponsePayload } from "../lib/apiResponse.js";
import { buildTtsCacheKey, getTtsCache, setTtsCache } from "../utils/ttsCache.js";
import { interpretEmotionSpectrum } from "../lib/emotionSpectrum.js";
import VoiceSampleSelector from "./VoiceSampleSelector.jsx";
import VoiceCloneTab from "./VoiceCloneTab.jsx";

const voiceLabStyles = `
  @keyframes vlab-scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  @keyframes vlab-glitch {
    0%,89%,100% { opacity: 1; transform: none; filter: none; }
    90%  { opacity: 0.7; transform: translateX(3px); filter: hue-rotate(40deg); }
    92%  { opacity: 1;   transform: translateX(0); filter: none; }
    96%  { opacity: 0.85; filter: hue-rotate(-20deg); }
    97%  { opacity: 1;   filter: none; }
  }

  @keyframes vlab-blink {
    0%,100% { opacity: 1; }
    50%     { opacity: 0.25; }
  }

  @keyframes vlab-slide-in {
    0%   { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes vlab-pulse-ring {
    0%,100% { box-shadow: 0 0 0   rgba(0, 245, 255, 0.0); }
    50%     { box-shadow: 0 0 10px rgba(0, 245, 255, 0.5); }
  }

  /* ── Shell ────────────────────────────────────────────────── */
  .vlab-shell {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 32px;
    background: linear-gradient(170deg, rgba(0, 4, 14, 0.95), rgba(2, 5, 18, 0.92));
    overflow: hidden;
    box-shadow:
      0 0 80px -20px rgba(78, 255, 200, 0.15),
      0 32px 100px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    animation: vlab-slide-in 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
  }

  .vlab-shell::before,
  .vlab-shell::after { display: none; }

  /* ── Tabs ─────────────────────────────────────────────────── */
  .vlab-tab-bar {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 4, 12, 0.4);
    position: relative;
    z-index: 11;
  }

  .vlab-tab-btn {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 14px;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 300;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(230, 255, 248, 0.4);
    transition: all 0.3s ease;
  }

  .vlab-tab-btn:hover {
    color: rgba(230, 255, 248, 0.8);
    background: rgba(255, 255, 255, 0.04);
  }

  .vlab-tab-btn.active {
    color: #4effd8;
    background: rgba(78, 255, 200, 0.08);
    border-color: rgba(78, 255, 200, 0.2);
    box-shadow: 0 0 20px rgba(78, 255, 200, 0.1);
  }

  /* ── Header ───────────────────────────────────────────────── */
  .vlab-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: radial-gradient(circle at top left, rgba(78, 255, 200, 0.05), transparent 70%);
    position: relative;
    z-index: 11;
  }

  .vlab-eyebrow {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(78, 255, 200, 0.7);
    font-family: "JetBrains Mono", monospace;
  }

  .vlab-eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4effd8;
    box-shadow: 0 0 12px #4effd8;
    animation: vlab-blink 2s infinite;
  }

  .vlab-title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 300;
    color: rgba(230, 255, 248, 0.95);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .vlab-header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .vlab-meta-pill {
    padding: 4px 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 245, 255, 0.18);
    background: rgba(0, 245, 255, 0.05);
    color: #87a8b9;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    font-family: "JetBrains Mono", monospace;
  }

  .vlab-meta-pill.on {
    color: #00ff9d;
    border-color: rgba(0, 255, 157, 0.3);
    background: rgba(0, 255, 157, 0.06);
  }

  /* ── Body ─────────────────────────────────────────────────── */
  .vlab-body {
    padding: 28px;
    display: grid;
    gap: 32px;
    position: relative;
    z-index: 11;
  }

  .vlab-section {
    display: grid;
    gap: 16px;
  }

  .vlab-section-label {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(136, 102, 255, 0.08);
    color: rgba(160, 255, 225, 0.7);
    font-size: 0.62rem;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family: "JetBrains Mono", monospace;
    margin-bottom: 6px;
    backdrop-filter: blur(10px);
  }

  .vlab-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .vlab-field {
    display: grid;
    gap: 10px;
  }

  .vlab-field label {
    color: rgba(135, 168, 185, 0.8);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .vlab-input,
  .vlab-select,
  .vlab-textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    background: rgba(0, 4, 12, 0.6);
    color: rgba(230, 255, 248, 0.9);
    font-size: 0.92rem;
    transition: all 0.3s ease;
    font-family: inherit;
    backdrop-filter: blur(10px);
  }

  .vlab-input:focus,
  .vlab-select:focus,
  .vlab-textarea:focus {
    outline: none;
    border-color: rgba(78, 255, 200, 0.3);
    box-shadow: 0 0 20px rgba(78, 255, 200, 0.15);
    background: rgba(0, 4, 12, 0.8);
  }

  .vlab-btn {
    padding: 14px 28px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(78, 255, 200, 0.15), rgba(136, 102, 255, 0.2));
    color: #4effd8;
    font-weight: 300;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    border: 1px solid rgba(78, 255, 200, 0.25);
    cursor: pointer;
    box-shadow: 0 0 30px rgba(78, 255, 200, 0.15);
    transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    backdrop-filter: blur(10px);
  }

  .vlab-btn:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    background: linear-gradient(135deg, rgba(78, 255, 200, 0.25), rgba(136, 102, 255, 0.3));
    box-shadow: 0 0 45px rgba(78, 255, 200, 0.35);
    border-color: rgba(78, 255, 200, 0.4);
  }

  .vlab-btn.secondary {
    background: rgba(136, 102, 255, 0.06);
    border: 1px solid rgba(136, 102, 255, 0.25);
    color: rgba(160, 255, 225, 0.7);
    box-shadow: none;
  }

  .vlab-btn.secondary:hover {
    background: rgba(136, 102, 255, 0.12);
    color: #4effd8;
    border-color: rgba(136, 102, 255, 0.4);
  }

  .vlab-slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .vlab-slider {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    outline: none;
  }

  .vlab-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4effd8;
    box-shadow: 0 0 15px rgba(78, 255, 200, 0.4);
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .vlab-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .vlab-slider-readout {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.82rem;
    font-weight: 300;
    color: #4effd8;
    min-width: 45px;
    text-align: right;
  }

  .vlab-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    background: rgba(136, 102, 255, 0.04);
    backdrop-filter: blur(10px);
  }

  .vlab-toggle-copy strong {
    display: block;
    color: #dcf7ff;
    font-size: 0.95rem;
    margin-bottom: 4px;
  }

  .vlab-toggle-copy span {
    color: #87a8b9;
    font-size: 0.82rem;
  }

  .vlab-waveform-wrap {
    position: relative;
    border-radius: 18px;
    border: 1px solid rgba(0, 245, 255, 0.15);
    background: #01060e;
    overflow: hidden;
  }

  .vlab-waveform-tag {
    position: absolute;
    top: 10px;
    left: 14px;
    font-size: 0.6rem;
    font-weight: 800;
    color: rgba(0, 245, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .vlab-audio-player {
    width: 100%;
    margin-top: 12px;
    accent-color: #00f5ff;
  }

  .vlab-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 14, 0.85);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .vlab-modal {
    width: min(900px, 100%);
    max-height: 90vh;
    background: rgba(0, 4, 14, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 36px;
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
    padding: 40px;
    overflow-y: auto;
    backdrop-filter: blur(50px);
  }


  .vlab-progress-step {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 0.78rem;
    letter-spacing: 0.03em;
  }

  .vlab-progress-step.active {
    color: #9fe7ff;
    font-weight: 700;
  }

  .vlab-progress-step.done {
    color: #7fe7b1;
  }

  .vlab-progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid rgba(0, 180, 255, 0.40);
    background: transparent;
  }

  .vlab-progress-step.active .vlab-progress-dot {
    background: var(--accent);
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.65);
  }

  .vlab-progress-step.done .vlab-progress-dot {
    background: #4ade80;
    border-color: #4ade80;
  }

  /* ── Responsive ───────────────────────────────────────────── */
  @media (max-width: 720px) {
    .vlab-grid {
      grid-template-columns: 1fr;
    }

    .vlab-toggle-row {
      flex-direction: column;
      gap: 14px;
    }
  }

  /* Cyberpunk control deck overrides */
  .voice-lab-shell {
    border-radius: 24px;
    border: 1px solid rgba(0, 234, 255, 0.16);
    background: linear-gradient(180deg, rgba(3, 10, 22, 0.96), rgba(4, 8, 18, 0.92));
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45), 0 0 18px rgba(0, 234, 255, 0.05);
  }

  .voice-lab-header {
    padding: 16px 18px;
    background: linear-gradient(180deg, rgba(0, 234, 255, 0.04), rgba(255, 62, 207, 0.02));
    border-bottom: 1px solid rgba(0, 234, 255, 0.08);
  }

  .voice-lab-header h3 {
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .voice-lab-header p {
    color: #90a8c8;
  }

  .voice-lab-body {
    padding: 16px 18px 18px;
    gap: 16px;
  }

  .voice-lab-grid {
    gap: 14px;
  }

  .voice-lab-field label {
    color: #8fe9ff;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .voice-lab-field input,
  .voice-lab-field select,
  .voice-lab-field textarea {
    border-radius: 12px;
    border-color: rgba(0, 234, 255, 0.14);
    background: rgba(2, 10, 24, 0.95);
    box-shadow: inset 0 0 14px rgba(0, 234, 255, 0.04);
  }

  .voice-lab-field textarea {
    min-height: 132px;
  }

  .voice-lab-field small {
    color: #8ea7c8;
    line-height: 1.5;
  }

  .voice-lab-check {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 234, 255, 0.10);
    background: rgba(0, 234, 255, 0.04);
    color: #9fc5df;
  }

  .voice-lab-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }

  .voice-lab-actions button {
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 8px 20px rgba(0, 160, 255, 0.18);
  }

  .voice-lab-actions button.secondary {
    background: rgba(0, 234, 255, 0.06);
    border-color: rgba(0, 234, 255, 0.16);
    color: #8eecff;
  }

  .voice-lab-player {
    width: 100%;
    border-radius: 12px;
    opacity: 0.95;
  }

  .voice-lab-empty {
    border-radius: 24px;
    border-color: rgba(0, 234, 255, 0.16);
    background: linear-gradient(180deg, rgba(3, 10, 22, 0.95), rgba(4, 8, 18, 0.92));
  }
`;

const ELEVENLABS_VOICE_PRESETS = [
  { id: "", label: "Custom voice id" },
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (default)" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni" },
];

const CARTESIA_VOICE_PRESETS = [
  { id: "", label: "Custom voice id" },
  { id: "a0e99841-438c-4a64-b679-ae501e7d6091", label: "Sonic default" },
  { id: "694f9389-aac1-45b6-b726-9d9369183238", label: "Warm Narrator" },
  { id: "2ee87190-8f84-4925-97da-e52547f9462c", label: "Balanced Voice" },
];

const ELEVENLABS_MODEL_PRESETS = [
  { id: "eleven_multilingual_v2", label: "eleven_multilingual_v2" },
  { id: "eleven_turbo_v2_5", label: "eleven_turbo_v2_5" },
  { id: "eleven_flash_v2_5", label: "eleven_flash_v2_5" },
];

const CARTESIA_MODEL_PRESETS = [
  { id: "sonic-3", label: "sonic-3" },
  { id: "sonic-3-latest", label: "sonic-3-latest" },
  { id: "sonic-2", label: "sonic-2" },
  { id: "sonic-turbo", label: "sonic-turbo" },
];

const CARTESIA_MODEL_QUICK_PICKS = ["sonic-3", "sonic-3-latest", "sonic-turbo"];

const CLOUD_MODEL_PRESETS = [
  { id: "gpt-4o-mini-tts", label: "gpt-4o-mini-tts" },
];

const CLOUD_VOICE_PRESETS = [
  { id: "alloy", label: "Alloy" },
  { id: "ash", label: "Ash" },
  { id: "ballad", label: "Ballad" },
  { id: "coral", label: "Coral" },
  { id: "echo", label: "Echo" },
  { id: "fable", label: "Fable" },
  { id: "nova", label: "Nova" },
  { id: "onyx", label: "Onyx" },
  { id: "sage", label: "Sage" },
  { id: "shimmer", label: "Shimmer" },
  { id: "__custom__", label: "Custom voice id" },
];

const REALISM_PRESETS = [
  {
    id: "conversational",
    label: "Conversational",
    description: "Balanced cleanup for everyday dialogue.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Polished body with a tiny room tail.",
  },
  {
    id: "intimate",
    label: "Intimate",
    description: "Soft de-essing and close-mic presence.",
  },
  {
    id: "energetic",
    label: "Energetic",
    description: "Punchier compression with brighter edge.",
  },
];

const CUSTOM_OPTION = "__custom__";
const QUICK_VOICE_FAVORITES_KEY = "voxis.quickVoiceFavorites.v1";
const TTS_DEBUG_PROVIDER_LOCK = String(import.meta.env.VITE_TTS_DEBUG_PROVIDER_LOCK ?? "true").trim().toLowerCase() !== "false";
const PROSODY_PROGRESS_STEPS = [
  "Scraping source audio",
  "Analyzing cadence and rhythm",
  "Detecting representative voices",
  "Preparing voice previews",
];

function normalizeVoiceEngineForDebug(engine) {
  const normalized = String(engine || "auto").trim().toLowerCase();
  if (!TTS_DEBUG_PROVIDER_LOCK) {
    return normalized || "auto";
  }
  return ["auto", "kokoro", "openvoice", "kokoro-rvc", "cartesia"].includes(normalized) ? normalized : "auto";
}

function getProviderCatalogMeta(options) {
  return options?.catalog && typeof options.catalog === "object"
    ? options.catalog
    : { voices: { source: "unavailable", count: 0 }, models: { source: "unavailable", count: 0 } };
}

function getProviderVoiceHelpText(providerId, options) {
  if (providerId === "cartesia") {
    const catalog = getProviderCatalogMeta(options);
    if (options?.error) {
      return options.error;
    }
    if (catalog.voices?.source === "api") {
      return `Loaded ${catalog.voices.count || 0} Cartesia voices from your API key.`;
    }
    return "Cartesia voice discovery is unavailable right now. Use a saved voice, or switch to Custom voice id.";
  }

  return options?.error || "Auto-loaded from your configured ElevenLabs API key.";
}

function getProviderModelHelpText(providerId, options) {
  if (providerId === "cartesia") {
    const catalog = getProviderCatalogMeta(options);
    if (options?.error) {
      return options.error;
    }
    if (catalog.models?.source === "api") {
      return `Loaded ${catalog.models.count || 0} Cartesia models from live discovery.`;
    }
    return "Showing fallback Cartesia models because live discovery returned no model catalog. Use Custom model id for snapshots or newly released IDs.";
  }

  return options?.error || "Auto-loaded from your configured provider API key.";
}

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

  return new Set(
    sourceText
      .split(/[^a-z0-9]+/g)
      .map((item) => item.trim())
      .filter((item) => item.length >= 3),
  );
}

export default function VoiceLab({
  personality,
  messages,
  onSaveVoiceProfile,
  onStatus,
  onJumpToBuilder,
  onOpenSettings,
  onPersonalityUpdated,
}) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const authFetch = useAuthFetch();

  const [voiceProfile, setVoiceProfile] = useState({
    enabled: true,
    autoplay: false,
    engine: "auto",
    pitch: 1,
    rate: 1,
    preferredVoice: "alloy",
    providerVoice: "alloy",
    providerModel: "gpt-4o-mini-tts",
    piperModelPath: "",
    piperSpeaker: "",
    kokoroVoice: "af_heart",
    elevenLabsVoiceId: "",
    elevenLabsModel: "eleven_multilingual_v2",
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.5,
    cartesiaVoiceId: "",
    cartesiaModel: "sonic-3",
    realismEnabled: false,
    realismPreset: "conversational",
  });
  const [vlabTab, setVlabTab] = useState("config"); // "config" | "clone"
  const [sampleText, setSampleText] = useState("");
  const [prosodyUrl, setProsodyUrl] = useState("");
  const [prosodyFile, setProsodyFile] = useState(null);
  const [isExtractingProsody, setIsExtractingProsody] = useState(false);
  const [voiceSamples, setVoiceSamples] = useState(null);
  const [isProsodyModalOpen, setIsProsodyModalOpen] = useState(false);
  const [prosodyProgressIndex, setProsodyProgressIndex] = useState(0);
  const [prosodyModalError, setProsodyModalError] = useState("");
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [directedPreview, setDirectedPreview] = useState("");
  const [previewTelemetry, setPreviewTelemetry] = useState(null);
  const [cartesiaPreviewPlaying, setCartesiaPreviewPlaying] = useState(false);
  const [piperVoices, setPiperVoices] = useState([]);
  const [isLoadingPiperVoices, setIsLoadingPiperVoices] = useState(false);
  const [piperVoiceError, setPiperVoiceError] = useState("");
  const [kokoroVoices, setKokoroVoices] = useState([]);
  const [isLoadingKokoroVoices, setIsLoadingKokoroVoices] = useState(false);
  const [kokoroVoiceError, setKokoroVoiceError] = useState("");
  const [providerOptions, setProviderOptions] = useState({
    elevenlabs: {
      voices: ELEVENLABS_VOICE_PRESETS.filter((voice) => voice.id),
      builtinVoices: ELEVENLABS_VOICE_PRESETS.filter((voice) => voice.id),
      customVoices: [],
      models: ELEVENLABS_MODEL_PRESETS,
      error: "",
    },
    cartesia: {
      voices: CARTESIA_VOICE_PRESETS.filter((voice) => voice.id),
      builtinVoices: CARTESIA_VOICE_PRESETS.filter((voice) => voice.id),
      customVoices: [],
      models: CARTESIA_MODEL_PRESETS,
      catalog: {
        voices: { source: "fallback", count: CARTESIA_VOICE_PRESETS.filter((voice) => voice.id).length },
        models: { source: "fallback", count: CARTESIA_MODEL_PRESETS.length },
      },
      error: "",
    },
  });
  const [isLoadingProviderOptions, setIsLoadingProviderOptions] = useState(false);
  const [providerOptionsReloadToken, setProviderOptionsReloadToken] = useState(0);
  const [providerLastUpdatedAt, setProviderLastUpdatedAt] = useState({ elevenlabs: 0, cartesia: 0 });
  const [cloudModels, setCloudModels] = useState(CLOUD_MODEL_PRESETS);
  const [isLoadingCloudModels, setIsLoadingCloudModels] = useState(false);
  const [cloudModelError, setCloudModelError] = useState("");
  const [cloudModelsReloadToken, setCloudModelsReloadToken] = useState(0);
  const [cloudLastUpdatedAt, setCloudLastUpdatedAt] = useState(0);
  // Provider ID of the currently-connected LLM (e.g. "openrouter", "openai").  
  // Used to warn the user when their LLM provider can't handle TTS audio requests.
  const [llmProvider, setLlmProvider] = useState("");
  const [savedVoiceMaps, setSavedVoiceMaps] = useState([]);
  const [selectedVoiceMapId, setSelectedVoiceMapId] = useState("");
  const [voiceMapName, setVoiceMapName] = useState("");
  const [isLoadingVoiceMaps, setIsLoadingVoiceMaps] = useState(false);
  const [isSavingVoiceMap, setIsSavingVoiceMap] = useState(false);
  const [isDeletingVoiceMap, setIsDeletingVoiceMap] = useState(false);
  const [syncMapOnProfileSave, setSyncMapOnProfileSave] = useState(true);
  const [voiceFavorites, setVoiceFavorites] = useState(() => readQuickVoiceFavorites());

  // Load voice favorites from server on mount
  useEffect(() => {
    authFetch("/settings/voice-favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.favorites) {
          setVoiceFavorites(data.favorites);
          try { window.localStorage.setItem(QUICK_VOICE_FAVORITES_KEY, JSON.stringify(data.favorites)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* keep local */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refs
  const audioRef = useRef(null);
  const voiceSampleAudioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animFrameRef = useRef(null);
  const isGeneratingRef = useRef(false);

  // ── Derived ──────────────────────────────────────────────────────
  const latestAssistantMessage = useMemo(
    () => [...(messages || [])].reverse().find((m) => m.role === "assistant") || null,
    [messages],
  );

  const selectedPiperVoice = useMemo(
    () =>
      piperVoices.find(
        (v) =>
          v.path === voiceProfile.piperModelPath ||
          v.id === voiceProfile.providerVoice ||
          v.id === voiceProfile.preferredVoice,
      ) || null,
    [piperVoices, voiceProfile.piperModelPath, voiceProfile.preferredVoice, voiceProfile.providerVoice],
  );

  const selectedProviderId = voiceProfile.engine === "elevenlabs" || voiceProfile.engine === "cartesia"
    ? voiceProfile.engine
    : "";

  const activeProviderOptions = selectedProviderId
    ? providerOptions[selectedProviderId] || { voices: [], builtinVoices: [], customVoices: [], models: [], catalog: {}, error: "" }
    : { voices: [], builtinVoices: [], customVoices: [], models: [], catalog: {}, error: "" };

  const activeBuiltinVoices = Array.isArray(activeProviderOptions.builtinVoices)
    ? activeProviderOptions.builtinVoices
    : [];
  const activeCustomVoices = Array.isArray(activeProviderOptions.customVoices)
    ? activeProviderOptions.customVoices
    : [];

  const activeVoiceValue = selectedProviderId === "elevenlabs"
    ? voiceProfile.elevenLabsVoiceId || voiceProfile.providerVoice || ""
    : selectedProviderId === "cartesia"
      ? voiceProfile.cartesiaVoiceId || voiceProfile.providerVoice || ""
      : "";

  const cartesiaVoicePreviewUrl = selectedProviderId === "cartesia" && activeVoiceValue
    ? (activeProviderOptions.voices.find((v) => v.id === activeVoiceValue)?.previewUrl || "")
    : "";

  const favoriteCartesiaVoiceIds = useMemo(
    () => new Set((Array.isArray(voiceFavorites?.cartesia) ? voiceFavorites.cartesia : []).map((item) => String(item?.id || "").trim()).filter(Boolean)),
    [voiceFavorites?.cartesia],
  );

  const recommendedCartesiaVoice = useMemo(() => {
    if (selectedProviderId !== "cartesia") {
      return null;
    }
    const keywords = buildPersonaKeywords(personality);
    const voices = Array.isArray(activeProviderOptions?.voices) ? activeProviderOptions.voices : [];
    if (!keywords.size || voices.length === 0) {
      return null;
    }

    let best = null;
    let bestScore = 0;
    for (const voice of voices) {
      const label = String(voice?.label || voice?.id || "").trim().toLowerCase();
      if (!label) {
        continue;
      }
      const tags = Array.isArray(voice?.tags)
        ? voice.tags.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
        : [];
      const terms = new Set(
        [label, ...tags]
          .join(" ")
          .split(/[^a-z0-9]+/g)
          .map((item) => item.trim())
          .filter((item) => item.length >= 3),
      );
      let score = 0;
      for (const term of terms) {
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
  }, [activeProviderOptions?.voices, personality, selectedProviderId]);

  const activeModelValue = selectedProviderId === "elevenlabs"
    ? voiceProfile.elevenLabsModel || ""
    : selectedProviderId === "cartesia"
      ? voiceProfile.cartesiaModel || ""
      : voiceProfile.providerModel || "";

  const selectedVoiceOption = activeProviderOptions.voices.some((voice) => voice.id === activeVoiceValue)
    ? activeVoiceValue
    : CUSTOM_OPTION;

  const selectedModelOption = activeProviderOptions.models.some((model) => model.id === activeModelValue)
    ? activeModelValue
    : CUSTOM_OPTION;
  const activeVoiceFieldId = selectedVoiceOption === CUSTOM_OPTION ? "vlab-voice-custom" : "vlab-voice";
  const activeModelFieldId = selectedModelOption === CUSTOM_OPTION ? "vlab-model-custom" : "vlab-model";

  const activeProviderUpdatedAt = selectedProviderId ? Number(providerLastUpdatedAt[selectedProviderId] || 0) : 0;
  const showProviderUpdated = !isLoadingProviderOptions && activeProviderUpdatedAt > 0;
  const showCloudUpdated = !isLoadingCloudModels && cloudLastUpdatedAt > 0;

  const supportsCloudModelCatalog = !selectedProviderId;
  const selectedCloudModelOption = cloudModels.some((model) => model.id === voiceProfile.providerModel)
    ? voiceProfile.providerModel
    : CUSTOM_OPTION;
  const selectedCloudVoiceOption = CLOUD_VOICE_PRESETS.some((voice) => voice.id === (voiceProfile.providerVoice || voiceProfile.preferredVoice || ""))
    ? (voiceProfile.providerVoice || voiceProfile.preferredVoice || "")
    : CUSTOM_OPTION;
  const modelFieldLabel = selectedProviderId
    ? "TTS Model"
    : voiceProfile.engine === "kokoro" || voiceProfile.engine === "piper"
      ? "Cloud Fallback Model"
      : "TTS Model";
  const voiceFieldLabel = voiceProfile.engine === "piper"
    ? "Piper Voice"
    : voiceProfile.engine === "kokoro"
      ? "Kokoro Voice"
      : voiceProfile.engine === "elevenlabs"
        ? "ElevenLabs Voice"
        : voiceProfile.engine === "cartesia"
          ? "Cartesia Voice"
          : voiceProfile.engine === "cloud"
            ? "Cloud Voice"
            : "Cloud/Fallback Voice";
  const hasProsodyFile = Boolean(prosodyFile && typeof prosodyFile.name === "string" && prosodyFile.name.trim());

  const recommendedVoiceMapId = useMemo(() => {
    if (!savedVoiceMaps.length) {
      return "";
    }

    // Normalize engine consistently — maps saved as "auto" should match the
    // current profile even when TTS debug lock coerces "auto" → "cartesia".
    // Also treat an empty/missing engine as "auto" on both sides.
    const currentEngine = normalizeVoiceEngineForDebug(String(voiceProfile.engine || "auto").trim().toLowerCase());
    const currentModel = currentEngine === "elevenlabs"
      ? String(voiceProfile.elevenLabsModel || "").trim().toLowerCase()
      : currentEngine === "cartesia"
        ? String(voiceProfile.cartesiaModel || "").trim().toLowerCase()
        : String(voiceProfile.providerModel || "").trim().toLowerCase();

    const currentVoiceKey = currentEngine === "elevenlabs"
      ? String(voiceProfile.elevenLabsVoiceId || voiceProfile.providerVoice || "").trim().toLowerCase()
      : currentEngine === "cartesia"
        ? String(voiceProfile.cartesiaVoiceId || voiceProfile.providerVoice || "").trim().toLowerCase()
        : currentEngine === "kokoro"
          ? String(voiceProfile.kokoroVoice || voiceProfile.providerVoice || "").trim().toLowerCase()
          : currentEngine === "piper"
            ? String(voiceProfile.piperModelPath || voiceProfile.providerVoice || "").trim().toLowerCase()
            : String(voiceProfile.providerVoice || voiceProfile.preferredVoice || "").trim().toLowerCase();

    let bestId = "";
    let bestScore = -1;

    for (const map of savedVoiceMaps) {
      const profile = map?.voiceProfile && typeof map.voiceProfile === "object" ? map.voiceProfile : {};
      const mapEngine = normalizeVoiceEngineForDebug(String(profile.engine || "auto").trim().toLowerCase());
      const mapModel = mapEngine === "elevenlabs"
        ? String(profile.elevenLabsModel || "").trim().toLowerCase()
        : mapEngine === "cartesia"
          ? String(profile.cartesiaModel || "").trim().toLowerCase()
          : String(profile.providerModel || "").trim().toLowerCase();
      const mapVoiceKey = mapEngine === "elevenlabs"
        ? String(profile.elevenLabsVoiceId || profile.providerVoice || "").trim().toLowerCase()
        : mapEngine === "cartesia"
          ? String(profile.cartesiaVoiceId || profile.providerVoice || "").trim().toLowerCase()
          : mapEngine === "kokoro"
            ? String(profile.kokoroVoice || profile.providerVoice || "").trim().toLowerCase()
            : mapEngine === "piper"
              ? String(profile.piperModelPath || profile.providerVoice || "").trim().toLowerCase()
              : String(profile.providerVoice || profile.preferredVoice || "").trim().toLowerCase();

      let score = 0;
      if (Number(map.linkedPersonalityId) === Number(personality?.id)) {
        score += 100;
      }
      if (mapEngine && currentEngine && mapEngine === currentEngine) {
        score += 10;
      }
      if (mapVoiceKey && currentVoiceKey && mapVoiceKey === currentVoiceKey) {
        score += 12;
      }
      if (mapModel && currentModel && mapModel === currentModel) {
        score += 4;
      }

      if (score > bestScore) {
        bestScore = score;
        bestId = String(map.id || "");
      }
    }

    return bestScore > 0 ? bestId : "";
  }, [personality?.id, savedVoiceMaps, voiceProfile]);

  // ── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!personality) return;
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
      providerModel: personality.voiceProfile?.providerModel || "gpt-4o-mini-tts",
      piperModelPath: personality.voiceProfile?.piperModelPath || "",
      piperSpeaker:
        personality.voiceProfile?.piperSpeaker == null
          ? ""
          : String(personality.voiceProfile.piperSpeaker),
      kokoroVoice: personality.voiceProfile?.kokoroVoice || "af_heart",
      elevenLabsVoiceId: personality.voiceProfile?.elevenLabsVoiceId || "",
      elevenLabsModel: personality.voiceProfile?.elevenLabsModel || "eleven_multilingual_v2",
      stability: Number(personality.voiceProfile?.stability ?? 0.5),
      similarityBoost: Number(personality.voiceProfile?.similarityBoost ?? 0.75),
      style: Number(personality.voiceProfile?.style ?? 0.5),
      cartesiaVoiceId: personality.voiceProfile?.cartesiaVoiceId || "",
      cartesiaModel: personality.voiceProfile?.cartesiaModel || "sonic-3",
      realismEnabled: Boolean(personality.voiceProfile?.realismEnabled),
      realismPreset: String(personality.voiceProfile?.realismPreset || "conversational"),
    });
    setProsodyUrl(personality.prosodySourceUrl || "");
    setVoiceSamples(personality.voiceSampleAnalysis || null);
    setVoiceMapName((current) => current || `${personality.name} Voice`);
  }, [personality?.id]);

  useEffect(() => {
    let ignore = false;

    async function loadVoiceMaps() {
      setIsLoadingVoiceMaps(true);
      try {
        const response = await authFetch("/settings/voice-maps");
        const payload = await readApiResponsePayload(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(response, payload, "Failed to load saved voice maps."));
        }

        if (ignore) return;
        setSavedVoiceMaps(Array.isArray(payload?.maps) ? payload.maps : []);
      } catch (error) {
        if (!ignore) {
          setSavedVoiceMaps([]);
          onStatus?.({ type: "error", message: error.message || "Failed to load saved voice maps." });
        }
      } finally {
        if (!ignore) setIsLoadingVoiceMaps(false);
      }
    }

    void loadVoiceMaps();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch, personality?.id]);
  // Note: onStatus intentionally excluded to prevent render loops

  useEffect(() => {
    setDirectedPreview("");
    setPreviewTelemetry(null);
  }, [sampleText, personality?.id]);

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
    }).catch(() => { /* ignore */ });
  }, [voiceFavorites]);

  useEffect(() => {
    if (!personality || voiceProfile.engine !== "piper") return;

    let ignore = false;

    async function loadPiperVoices() {
      setIsLoadingPiperVoices(true);
      setPiperVoiceError("");
      try {
        const response = await authFetch("/tts/piper-voices");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load Piper voices.");
        if (ignore) return;

        const voices = Array.isArray(data.voices) ? data.voices : [];
        setPiperVoices(voices);

        setVoiceProfile((cur) => {
          const match = voices.find((v) => v.path === cur.piperModelPath);
          if (match) return { ...cur, providerVoice: match.id, preferredVoice: match.id };
          const def = voices.find((v) => v.isDefault) || voices[0];
          if (!def || cur.piperModelPath) return cur;
          return { ...cur, piperModelPath: def.path, providerVoice: def.id, preferredVoice: def.id };
        });
      } catch (error) {
        if (!ignore) {
          setPiperVoices([]);
          setPiperVoiceError(error.message || "Failed to load Piper voices.");
        }
      } finally {
        if (!ignore) setIsLoadingPiperVoices(false);
      }
    }

    void loadPiperVoices();
    return () => { ignore = true; };
  }, [authFetch, personality?.id, voiceProfile.engine]);

  useEffect(() => {
    if (!personality || voiceProfile.engine !== "kokoro") return;

    let ignore = false;

    async function loadKokoroVoices() {
      setIsLoadingKokoroVoices(true);
      setKokoroVoiceError("");
      try {
        const response = await authFetch("/tts/kokoro-voices");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load Kokoro voices.");
        if (ignore) return;

        const groups = data.voices && typeof data.voices === "object" ? data.voices : {};
        const flattened = Object.entries(groups).flatMap(([group, items]) =>
          (Array.isArray(items) ? items : []).map((voice) => ({
            id: voice.id,
            label: `${voice.label} (${group.replace(/_/g, " ")})`,
          })),
        );

        setKokoroVoices(flattened);
        setVoiceProfile((cur) => {
          if (flattened.some((v) => v.id === cur.kokoroVoice)) {
            return cur;
          }
          const first = flattened[0];
          return first ? { ...cur, kokoroVoice: first.id, providerVoice: first.id, preferredVoice: first.id } : cur;
        });
      } catch (error) {
        if (!ignore) {
          setKokoroVoices([]);
          setKokoroVoiceError(error.message || "Failed to load Kokoro voices.");
        }
      } finally {
        if (!ignore) setIsLoadingKokoroVoices(false);
      }
    }

    void loadKokoroVoices();
    return () => { ignore = true; };
  }, [authFetch, personality?.id, voiceProfile.engine]);

  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    if (!personality || !selectedProviderId) return;

    let ignore = false;

    async function loadProviderOptions() {
      setIsLoadingProviderOptions(true);
      try {
        const response = await authFetch(`/tts/provider-options?provider=${encodeURIComponent(selectedProviderId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load provider options.");
        if (ignore) return;

        const fallbackVoices = selectedProviderId === "elevenlabs"
          ? ELEVENLABS_VOICE_PRESETS.filter((voice) => voice.id)
          : CARTESIA_VOICE_PRESETS.filter((voice) => voice.id);
        const fallbackModels = selectedProviderId === "elevenlabs"
          ? ELEVENLABS_MODEL_PRESETS
          : CARTESIA_MODEL_PRESETS;

        const voices = Array.isArray(data.voices) && data.voices.length
          ? data.voices
          : fallbackVoices;
        const models = Array.isArray(data.models) && data.models.length
          ? data.models
          : fallbackModels;

        setProviderOptions((cur) => ({
          ...cur,
          [selectedProviderId]: {
            voices,
            builtinVoices: Array.isArray(data.builtinVoices) && data.builtinVoices.length
              ? data.builtinVoices
              : selectedProviderId === "elevenlabs"
                ? voices
                : fallbackVoices,
            customVoices: Array.isArray(data.customVoices) ? data.customVoices : [],
            models,
            catalog: data.catalog && typeof data.catalog === "object"
              ? data.catalog
              : {
                  voices: { source: "fallback", count: voices.length },
                  models: { source: selectedProviderId === "cartesia" ? "fallback" : "unavailable", count: models.length },
                },
            error: String(data.error || "").trim(),
          },
        }));
        setProviderLastUpdatedAt((cur) => ({
          ...cur,
          [selectedProviderId]: Date.now(),
        }));

        setVoiceProfile((cur) => {
          if (selectedProviderId === "elevenlabs") {
            const nextVoice = cur.elevenLabsVoiceId || cur.providerVoice || data.defaults?.voiceId || voices[0]?.id || "";
            const nextModel = cur.elevenLabsModel || data.defaults?.model || models[0]?.id || "eleven_multilingual_v2";
            return {
              ...cur,
              elevenLabsVoiceId: nextVoice,
              elevenLabsModel: nextModel,
              providerVoice: nextVoice || cur.providerVoice,
              preferredVoice: nextVoice || cur.preferredVoice,
            };
          }

          const nextVoice = cur.cartesiaVoiceId || cur.providerVoice || data.defaults?.voiceId || voices[0]?.id || "";
          const nextModel = cur.cartesiaModel || data.defaults?.model || models[0]?.id || "sonic-3";
          return {
            ...cur,
            cartesiaVoiceId: nextVoice,
            cartesiaModel: nextModel,
            providerVoice: nextVoice || cur.providerVoice,
            preferredVoice: nextVoice || cur.preferredVoice,
          };
        });
      } catch (error) {
        if (ignore) return;

        const fallbackVoices = selectedProviderId === "elevenlabs"
          ? ELEVENLABS_VOICE_PRESETS.filter((voice) => voice.id)
          : CARTESIA_VOICE_PRESETS.filter((voice) => voice.id);
        const fallbackModels = selectedProviderId === "elevenlabs"
          ? ELEVENLABS_MODEL_PRESETS
          : CARTESIA_MODEL_PRESETS;

        setProviderOptions((cur) => ({
          ...cur,
          [selectedProviderId]: {
            ...(cur[selectedProviderId] || { voices: [], builtinVoices: [], customVoices: [], models: [] }),
            voices:
              Array.isArray(cur[selectedProviderId]?.voices) && cur[selectedProviderId].voices.length
                ? cur[selectedProviderId].voices
                : fallbackVoices,
            builtinVoices:
              Array.isArray(cur[selectedProviderId]?.builtinVoices) && cur[selectedProviderId].builtinVoices.length
                ? cur[selectedProviderId].builtinVoices
                : fallbackVoices,
            customVoices: Array.isArray(cur[selectedProviderId]?.customVoices)
              ? cur[selectedProviderId].customVoices
              : [],
            models:
              Array.isArray(cur[selectedProviderId]?.models) && cur[selectedProviderId].models.length
                ? cur[selectedProviderId].models
                : fallbackModels,
            catalog:
              cur[selectedProviderId]?.catalog && typeof cur[selectedProviderId].catalog === "object"
                ? cur[selectedProviderId].catalog
                : {
                    voices: { source: "fallback", count: fallbackVoices.length },
                    models: { source: selectedProviderId === "cartesia" ? "fallback" : "unavailable", count: fallbackModels.length },
                  },
            error: error.message || "Failed to load provider options.",
          },
        }));
      } finally {
        if (!ignore) setIsLoadingProviderOptions(false);
      }
    }

    void loadProviderOptions();
    return () => { ignore = true; };
  }, [authFetch, authLoaded, isSignedIn, personality?.id, selectedProviderId, providerOptionsReloadToken]);

  useEffect(() => {
    if (!personality || !supportsCloudModelCatalog) return;

    let ignore = false;

    async function loadCloudModels() {
      setIsLoadingCloudModels(true);
      setCloudModelError("");
      try {
        const response = await authFetch("/settings/llm");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load cloud models.");
        if (ignore) return;

        const models = (Array.isArray(data.models) ? data.models : [])
          .map((model) => ({
            id: String(model?.id || "").trim(),
            label: String(model?.name || model?.id || "").trim(),
          }))
          .filter((model) => model.id);

        const nextModels = models.length ? models : CLOUD_MODEL_PRESETS;
        setCloudModels(nextModels);
        setCloudLastUpdatedAt(Date.now());
        setLlmProvider(String(data.provider || "").toLowerCase());
        setVoiceProfile((cur) => {
          if (nextModels.some((model) => model.id === cur.providerModel) || cur.providerModel) {
            return cur;
          }
          return { ...cur, providerModel: nextModels[0]?.id || cur.providerModel || "gpt-4o-mini-tts" };
        });
      } catch (error) {
        if (ignore) return;
        setCloudModels(CLOUD_MODEL_PRESETS);
        setCloudModelError(error.message || "Failed to load cloud models.");
      } finally {
        if (!ignore) setIsLoadingCloudModels(false);
      }
    }

    void loadCloudModels();
    return () => { ignore = true; };
  }, [authFetch, personality?.id, supportsCloudModelCatalog, cloudModelsReloadToken]);

  useEffect(() => {
    if (!showProviderUpdated || !selectedProviderId) return;
    const timer = setTimeout(() => {
      setProviderLastUpdatedAt((cur) => ({ ...cur, [selectedProviderId]: 0 }));
    }, 7000);
    return () => clearTimeout(timer);
  }, [showProviderUpdated, selectedProviderId]);

  useEffect(() => {
    if (!showCloudUpdated) return;
    const timer = setTimeout(() => {
      setCloudLastUpdatedAt(0);
    }, 7000);
    return () => clearTimeout(timer);
  }, [showCloudUpdated]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  // Sync isGenerating to ref so canvas loop can read it without re-subscribing
  useEffect(() => { isGeneratingRef.current = isGeneratingAudio; }, [isGeneratingAudio]);

  // ── Waveform canvas ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 108;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    function draw(ts) {
      ctx.clearRect(0, 0, W, H);

      // Faint horizontal grid lines
      ctx.strokeStyle = "rgba(0, 180, 255, 0.045)";
      ctx.lineWidth = 1;
      for (const frac of [0.25, 0.5, 0.75]) {
        ctx.beginPath();
        ctx.moveTo(0, frac * H);
        ctx.lineTo(W, frac * H);
        ctx.stroke();
      }

      const analyser = analyserRef.current;
      const audio = audioRef.current;

      if (isGeneratingRef.current) {
        // SYNTHESIZING — fast stochastic bars
        const t = ts * 0.006;
        const count = 52;
        const bw = W / count;
        for (let i = 0; i < count; i++) {
          const v = (Math.sin(i * 0.65 + t) * 0.5 + 0.5) * (0.15 + Math.random() * 0.40);
          const bh = v * H * 0.82;
          const hue = 155 + i * 3.2;
          ctx.fillStyle = `hsla(${hue}, 100%, 62%, 0.75)`;
          ctx.fillRect(i * bw, H - bh, bw - 1, bh);
        }
      } else if (analyser && audio && !audio.paused) {
        // PLAYING — live FFT bars
        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);
        const bins = Math.floor(bufLen * 0.68);
        const bw = W / bins;

        for (let i = 0; i < bins; i++) {
          const v = data[i] / 255;
          const bh = v * H * 0.88;
          if (bh < 1) continue;

          const hue = 185 + v * 105;
          const grd = ctx.createLinearGradient(0, H - bh, 0, H);
          grd.addColorStop(0, `hsla(${hue}, 100%, 64%, 0.94)`);
          grd.addColorStop(1, `hsla(220, 80%, 28%, 0.12)`);
          ctx.fillStyle = grd;
          ctx.fillRect(i * bw, H - bh, bw - 1, bh);

          // Bright leading cap
          ctx.fillStyle = `hsla(${hue}, 100%, 86%, 0.88)`;
          ctx.fillRect(i * bw, H - bh - 2, bw - 1, 2);
        }
      } else {
        // IDLE — slow oscilloscope sine
        const phase = ts * 0.00055;
        const amp = 4 + Math.sin(ts * 0.0004) * 2.2;

        // Noise floor micro-bars
        ctx.fillStyle = "rgba(0, 180, 255, 0.06)";
        const nc = 62;
        for (let i = 0; i < nc; i++) {
          const nh = (Math.sin(i * 1.18 + phase * 0.9) * 0.5 + 0.5) * H * 0.09;
          ctx.fillRect(i * (W / nc), H - nh, W / nc - 1, nh);
        }

        // Center sine wave
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 200, 255, 0.28)";
        ctx.lineWidth = 1.5;
        for (let px = 0; px <= W; px += 2) {
          const y = H * 0.5 + Math.sin((px / W) * Math.PI * 6 + phase) * amp;
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ── Web Audio setup (lazy — called on first user-gesture generate) ──
  function setupAnalyser() {
    const audio = audioRef.current;
    if (!audio || sourceNodeRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch {
      // Web Audio unavailable — canvas stays in idle/generating mode
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────
  function updateVoiceField(name, value) {
    setVoiceProfile((cur) => ({ ...cur, [name]: value }));
  }

  function handlePiperVoiceChange(nextPath) {
    const nextVoice = piperVoices.find((v) => v.path === nextPath);
    if (!nextVoice) { updateVoiceField("piperModelPath", nextPath); return; }
    setVoiceProfile((cur) => ({
      ...cur,
      piperModelPath: nextVoice.path,
      providerVoice: nextVoice.id,
      preferredVoice: nextVoice.id,
      piperSpeaker:
        nextVoice.speakers?.length === 1 && (cur.piperSpeaker === "" || cur.piperSpeaker == null)
          ? String(nextVoice.speakers[0].id)
          : cur.piperSpeaker,
    }));
  }

  function stopSpeaking() {
    const audio = audioRef.current;
    if (audio instanceof HTMLAudioElement) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  async function generateAudio(text, voiceOverride = null, speechHint = "") {
    if (!voiceProfile.enabled || !text?.trim() || !personality) return;

    setupAnalyser(); // safe to call on user-gesture; noop after first setup
    setIsGeneratingAudio(true);

    const effectiveVoiceProfile = voiceOverride ? { ...voiceProfile, ...voiceOverride } : voiceProfile;
    const cacheKey = buildTtsCacheKey(personality.id, text, effectiveVoiceProfile);

    try {
      const cachedBlob = getTtsCache(cacheKey);
      if (cachedBlob) {
        const next = URL.createObjectURL(cachedBlob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(next);
        requestAnimationFrame(() => {
          const audio = audioRef.current;
          if (audio instanceof HTMLAudioElement) void audio.play().catch(() => {});
        });
        setIsGeneratingAudio(false);
        return;
      }

      const response = await authFetch(`/personality/${personality.id}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceProfile: effectiveVoiceProfile, speechHint }),
      });

      if (!response.ok) {
        const payload = await readApiResponsePayload(response);
        const msg = getApiErrorMessage(response, payload, "Failed to generate speech.");
        throw new Error(msg);
      }

      const directedHeader = response.headers.get("X-Voxis-Directed-Text");
      const synthesisHeader = response.headers.get("X-Voxis-Synthesis-Text");
      const engineHeader = response.headers.get("X-Voxis-Tts-Engine");
      const adjustedVoiceHeader = response.headers.get("X-Voxis-Adjusted-Voice");
      const prosodyHeader = response.headers.get("X-Voxis-Prosody");
      const telemetryHeader = response.headers.get("X-Voxis-Tts-Telemetry");
      const realismChainHeader = response.headers.get("X-Voxis-Tts-Realism-Chain");
      const realismHeader = response.headers.get("X-Voxis-Tts-Realism");
      const sfxHeader = response.headers.get("X-Voxis-Tts-Sfx");
      let adjustedVoice = null;
      let prosodyEnvelope = null;
      let ttsTelemetry = null;
      let realismTelemetry = null;
      let ttsSfx = [];

      if (adjustedVoiceHeader) {
        try {
          adjustedVoice = JSON.parse(decodeURIComponent(adjustedVoiceHeader));
        } catch {
          adjustedVoice = null;
        }
      }

      if (prosodyHeader) {
        try {
          prosodyEnvelope = JSON.parse(decodeURIComponent(prosodyHeader));
        } catch {
          prosodyEnvelope = null;
        }
      }

      if (telemetryHeader) {
        try {
          ttsTelemetry = JSON.parse(decodeURIComponent(telemetryHeader));
        } catch {
          ttsTelemetry = null;
        }
      }

      if (realismHeader) {
        try {
          realismTelemetry = JSON.parse(decodeURIComponent(realismHeader));
        } catch {
          realismTelemetry = null;
        }
      }

      if (sfxHeader) {
        try {
          ttsSfx = JSON.parse(decodeURIComponent(sfxHeader));
        } catch {
          ttsSfx = [];
        }
      }

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
      
      const fallbackMood = parsedPersonalityMood || personality?.moodBaseline || {};
      const emotionFrame = ttsTelemetry?.emotionFrame || interpretEmotionSpectrum(fallbackMood);

      setDirectedPreview(directedHeader ? decodeURIComponent(directedHeader) : text);
      setPreviewTelemetry({
        engine: engineHeader || voiceProfile.engine || "auto",
        synthesisText: synthesisHeader ? decodeURIComponent(synthesisHeader) : null,
        adjustedVoice,
        prosodyEnvelope,
        emotionFrame,
        ttsTelemetry,
        realismChain: realismChainHeader ? decodeURIComponent(realismChainHeader) : null,
        realismTelemetry: realismTelemetry || ttsTelemetry?.realism || null,
      });

      if (ttsTelemetry?.fallbackUsed) {
        const fallbackFrom = String(ttsTelemetry.fallbackFrom || "primary engine");
        const chosenEngine = String(ttsTelemetry.chosenEngine || "fallback engine");
        onStatus?.({
          type: "success",
          message: `TTS fallback active: ${fallbackFrom} failed, switched to ${chosenEngine}.`,
        });
      }

      if (Array.isArray(ttsSfx) && ttsSfx.length > 0) {
        onStatus?.({
          type: "info",
          message: `SFX included: ${ttsSfx.join(", ")}`,
        });
      }

      const blob = await response.blob();
      setTtsCache(cacheKey, blob);
      const next = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(next);

      requestAnimationFrame(() => {
        const audio = audioRef.current;
        if (audio instanceof HTMLAudioElement) void audio.play().catch(() => {});
      });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to generate speech." });
    } finally {
      setIsGeneratingAudio(false);
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
        providerModel: voiceProfile.providerModel,
        piperModelPath: voiceProfile.piperModelPath,
        piperSpeaker: voiceProfile.piperSpeaker === "" ? null : Number(voiceProfile.piperSpeaker),
        kokoroVoice: voiceProfile.kokoroVoice,
        elevenLabsVoiceId: voiceProfile.elevenLabsVoiceId,
        elevenLabsModel: voiceProfile.elevenLabsModel,
        stability: Number(voiceProfile.stability),
        similarityBoost: Number(voiceProfile.similarityBoost),
        style: Number(voiceProfile.style),
        cartesiaVoiceId: voiceProfile.cartesiaVoiceId,
        cartesiaModel: voiceProfile.cartesiaModel,
        realismEnabled: Boolean(voiceProfile.realismEnabled),
        realismPreset: String(voiceProfile.realismPreset || "conversational"),
      });

      if (syncMapOnProfileSave && selectedVoiceMapId) {
        const selectedMap = savedVoiceMaps.find((entry) => entry.id === selectedVoiceMapId) || null;
        const response = await authFetch("/settings/voice-maps", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedVoiceMapId,
            createdAt: selectedMap?.createdAt || undefined,
            voiceName: String(selectedMap?.voiceName || voiceMapName || "").trim() || `${personality?.name || "Voice"} Voice`,
            linkedPersonalityId: personality?.id || null,
            linkedPersonalityName: personality?.name || "",
            voiceProfile,
          }),
        });
        const payload = await readApiResponsePayload(response);
        if (response.ok) {
          setSavedVoiceMaps(Array.isArray(payload?.maps) ? payload.maps : []);
          onStatus?.({ type: "success", message: "Profile saved and selected voice map updated." });
        }
      }
    } finally {
      setIsSavingVoice(false);
    }
  }

  async function extractProsodyTemplate({ useFile = false } = {}) {
    if (!personality?.id) {
      return;
    }

    if (useFile) {
      if (!hasProsodyFile) {
        onStatus?.({ type: "error", message: "Select an audio file first." });
        return;
      }
      if (Number(prosodyFile?.size || 0) > 20 * 1024 * 1024) {
        onStatus?.({ type: "error", message: "Audio file too large (max 20MB)." });
        return;
      }
    } else if (!prosodyUrl.trim()) {
      return;
    }

    setIsProsodyModalOpen(true);
    setProsodyModalError("");
    setProsodyProgressIndex(0);
    setIsExtractingProsody(true);
    const progressTimer = setInterval(() => {
      setProsodyProgressIndex((current) => Math.min(current + 1, PROSODY_PROGRESS_STEPS.length - 1));
    }, 1600);

    try {
      let requestBody;
      if (useFile) {
        onStatus?.({ type: "info", message: `Extracting prosody from '${prosodyFile.name}'...` });
        const dataUrl = await fileToDataUrl(prosodyFile);
        requestBody = {
          audioBase64: dataUrl,
          fileName: prosodyFile.name || "uploaded-audio",
        };
      } else {
        requestBody = {
          url: prosodyUrl.trim(),
        };
      }

      const response = await authFetch(`/personality/${personality.id}/prosody-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const payload = await readApiResponsePayload(response);

      if (!response.ok) {
        const baseMsg = getApiErrorMessage(response, payload, "Failed to extract prosody template.");
        const msg = response.status === 413
          ? `${baseMsg} The file is too large for the server to accept. Add 'client_max_body_size 30m;' to your nginx config and reload nginx (sudo systemctl reload nginx).`
          : baseMsg;
        throw new Error(msg);
      }

      onPersonalityUpdated?.(payload.personality);
      setVoiceSamples(payload.voiceSamples || payload.personality?.voiceSampleAnalysis || null);
      setProsodyProgressIndex(PROSODY_PROGRESS_STEPS.length - 1);
      onStatus?.({
        type: "success",
        message: `Prosody template extracted for ${payload.personality?.name || personality.name}.`,
      });
    } catch (error) {
      setProsodyModalError(error.message || "Failed to extract prosody template.");
      onStatus?.({ type: "error", message: error.message || "Failed to extract prosody template." });
    } finally {
      clearInterval(progressTimer);
      setIsExtractingProsody(false);
    }
  }

  function sliderStyle(val, min, max) {
    const pct = ((val - min) / (max - min)) * 100;
    return { background: `linear-gradient(90deg, var(--accent) ${pct}%, rgba(0,180,255,0.14) ${pct}%)` };
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read selected audio file."));
      reader.readAsDataURL(file);
    });
  }

  async function saveVoiceMap() {
    const normalizedName = String(voiceMapName || "").trim();
    if (!normalizedName) {
      onStatus?.({ type: "error", message: "Voice map name is required." });
      return;
    }

    setIsSavingVoiceMap(true);
    try {
      const existing = savedVoiceMaps.find((entry) => entry.id === selectedVoiceMapId) || null;
      const response = await authFetch("/settings/voice-maps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing?.id || undefined,
          createdAt: existing?.createdAt || undefined,
          voiceName: normalizedName,
          linkedPersonalityId: personality?.id || null,
          linkedPersonalityName: personality?.name || "",
          voiceProfile,
        }),
      });
      const payload = await readApiResponsePayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, payload, "Failed to save voice map."));
      }

      const maps = Array.isArray(payload?.maps) ? payload.maps : [];
      setSavedVoiceMaps(maps);
      if (payload?.savedId) {
        setSelectedVoiceMapId(payload.savedId);
      }
      onStatus?.({ type: "success", message: `Saved voice map '${normalizedName}'.` });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to save voice map." });
    } finally {
      setIsSavingVoiceMap(false);
    }
  }

  function toggleVoiceFavorite(engine, voice) {
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

  function applyVoiceMap(id) {
    const map = savedVoiceMaps.find((entry) => entry.id === id);
    if (!map?.voiceProfile || typeof map.voiceProfile !== "object") {
      return;
    }

    const incoming = map.voiceProfile;
    setVoiceProfile((current) => ({
      ...current,
      ...incoming,
      engine: normalizeVoiceEngineForDebug(incoming.engine || current.engine || "auto"),
    }));
    setSelectedVoiceMapId(id);
    setVoiceMapName(String(map.voiceName || ""));
    onStatus?.({ type: "info", message: `Applied voice map '${map.voiceName}'.` });
  }

  async function deleteVoiceMap() {
    if (!selectedVoiceMapId) return;
    setIsDeletingVoiceMap(true);
    try {
      const response = await authFetch(`/settings/voice-maps/${encodeURIComponent(selectedVoiceMapId)}`, {
        method: "DELETE",
      });
      const payload = await readApiResponsePayload(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response, payload, "Failed to delete voice map."));
      }

      setSavedVoiceMaps(Array.isArray(payload?.maps) ? payload.maps : []);
      setSelectedVoiceMapId("");
      onStatus?.({ type: "success", message: "Deleted saved voice map." });
    } catch (error) {
      onStatus?.({ type: "error", message: error.message || "Failed to delete voice map." });
    } finally {
      setIsDeletingVoiceMap(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  if (!personality) {
    return (
      <>
        <style>{voiceLabStyles}</style>
        <div className="vlab-shell">
          <div className="vlab-empty">
            Select a saved personality or create a new one before opening Voice Lab.
            <div>
              <button type="button" className="vlab-empty-link" onClick={onJumpToBuilder}>
                → Go to Character Request
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{voiceLabStyles}</style>
      <div className="vlab-shell">

        {/* ── Header ── */}
        <div className="vlab-header">
          <div className="vlab-eyebrow">
            <span className="vlab-eyebrow-dot" />
            VOICE SYNTHESIS MODULE
          </div>
          <h3 className="vlab-title">{personality.name} // VOICE LAB</h3>
          <div className="vlab-header-meta">
            <span className={`vlab-meta-pill ${voiceProfile.enabled ? "on" : ""}`}>
              {voiceProfile.enabled ? "● VOICE ON" : "○ VOICE OFF"}
            </span>
            <span className="vlab-meta-pill">ENG:{voiceProfile.engine.toUpperCase()}</span>
            <span className="vlab-meta-pill">PITCH:{Number(voiceProfile.pitch).toFixed(2)}</span>
            <span className="vlab-meta-pill">RATE:{Number(voiceProfile.rate).toFixed(2)}</span>
            {voiceProfile.realismEnabled ? (
              <span className="vlab-meta-pill on">REALISM:{String(voiceProfile.realismPreset || "conversational").toUpperCase()}</span>
            ) : (
              <span className="vlab-meta-pill">REALISM:OFF</span>
            )}
            {voiceProfile.autoplay && <span className="vlab-meta-pill on">AUTOPLAY</span>}
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="vlab-tab-bar">
          <button
            type="button"
            className={`vlab-tab-btn ${vlabTab === "config" ? "active" : ""}`}
            onClick={() => setVlabTab("config")}
          >
            ◈ VOICE CONFIG
          </button>
          <button
            type="button"
            className={`vlab-tab-btn ${vlabTab === "clone" ? "active" : ""}`}
            onClick={() => setVlabTab("clone")}
          >
            ◈ VOICE CLONE
          </button>
        </div>

        {/* ── Voice Clone Tab ── */}
        {vlabTab === "clone" && (
          <VoiceCloneTab personality={personality} onStatus={onStatus} />
        )}

        {/* ── Voice Config Body (existing content) ── */}
        <div className="vlab-body" style={vlabTab !== "config" ? { display: "none" } : {}}>

          {/* ── Engine Config ── */}
          <div className="vlab-section">
            <div className="vlab-section-label">◈ ENGINE CONFIG</div>
            <div className="vlab-grid">

              <div className="vlab-field">
                <label htmlFor="vlab-engine">TTS Engine</label>
                <select
                  id="vlab-engine"
                  className="vlab-select"
                  value={voiceProfile.engine}
                  onChange={(e) => updateVoiceField("engine", normalizeVoiceEngineForDebug(e.target.value))}
                >
                  {TTS_DEBUG_PROVIDER_LOCK ? (
                    <>
                      <option value="auto">auto (cartesia -&gt; kokoro)</option>
                      <option value="kokoro">kokoro (free local)</option>
                      <option value="openvoice">openvoice (voice clone)</option>
                      <option value="kokoro-rvc">kokoro + rvc (voice pack)</option>
                      <option value="cartesia">cartesia (saved key)</option>
                    </>
                  ) : (
                    <>
                      <option value="auto">auto (elevenlabs -&gt; cartesia -&gt; cloud -&gt; piper -&gt; kokoro)</option>
                      <option value="cloud">cloud</option>
                      <option value="piper">piper</option>
                      <option value="kokoro">kokoro (free local)</option>
                      <option value="openvoice">openvoice (voice clone)</option>
                      <option value="kokoro-rvc">kokoro + rvc (voice pack)</option>
                      <option value="elevenlabs">elevenlabs (saved key)</option>
                      <option value="cartesia">cartesia (saved key)</option>
                    </>
                  )}
                </select>
                {voiceProfile.engine === "cartesia" ? (
                  <small className="vlab-small">
                    Note: Cartesia on this path does not expose native numeric pitch control. Pitch slider is kept for cross-engine consistency.
                  </small>
                ) : null}
              </div>

              {/* ── Warning: LLM provider doesn't support audio ── */}
              {(voiceProfile.engine === "auto" || voiceProfile.engine === "cloud") &&
               llmProvider && llmProvider !== "openai" ? (
                <div className="vlab-callout warn">
                  <div className="vlab-callout-head">
                    <div>
                      <p className="vlab-callout-title">⚠ TTS action required — {llmProvider} doesn&apos;t handle audio</p>
                      <p className="vlab-callout-copy">
                        Your LLM is connected via <strong>{llmProvider}</strong>, which routes text completions only — it has no audio/speech endpoint.
                        The <strong>cloud</strong> TTS path needs a direct <strong>OpenAI API key</strong>
                        {" "}(separate from your LLM key) to synthesise voice. Your options:
                      </p>
                      <ul style={{ margin: "8px 0 0 0", paddingLeft: 18, fontSize: "0.78rem", lineHeight: 1.65, color: "#87a8b9" }}>
                        <li><strong style={{ color: "#fcd34d" }}>Kokoro (recommended):</strong> Switch the engine to <em>kokoro</em> above — free, runs locally, no key needed.</li>
                        <li><strong style={{ color: "#fcd34d" }}>ElevenLabs / Cartesia:</strong> Switch to one of those engines and paste your API key below.</li>
                        <li><strong style={{ color: "#fcd34d" }}>OpenAI TTS key:</strong> Add <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 4px", borderRadius: 4 }}>TTS_API_KEY=sk-…</code> to <em>backend/.env</em> (requires server restart).</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Info: dedicated TTS providers are independent of LLM ── */}
              {(voiceProfile.engine === "elevenlabs" || voiceProfile.engine === "cartesia") ? (
                <div className="vlab-callout ok">
                  <div className="vlab-callout-head">
                    <div>
                      <p className="vlab-callout-title">✓ Fully independent of your LLM provider</p>
                      <p className="vlab-callout-copy">
                        <strong>{voiceProfile.engine === "elevenlabs" ? "ElevenLabs" : "Cartesia"}</strong> uses its own API key and speaks directly to the provider&apos;s audio endpoint.
                        Your LLM provider ({llmProvider || "current LLM"}) is never contacted for voice — the two services operate in separate lanes.
                        Manage your {voiceProfile.engine === "elevenlabs" ? "ElevenLabs" : "Cartesia"} key in <em>Settings</em>, not inside Voice Lab.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Info: Kokoro — free local, no key needed ── */}
              {voiceProfile.engine === "kokoro" ? (
                <div className="vlab-callout ok">
                  <div className="vlab-callout-head">
                    <div>
                      <p className="vlab-callout-title">✓ Free local engine — no provider billing key required</p>
                      <p className="vlab-callout-copy">
                        Kokoro runs the 82 M ONNX model on your server. It does not require a paid TTS provider key and works regardless of your LLM provider.
                        On restricted hosts, the model download from HuggingFace may require a token for first-time cache warmup.
                        {" "}If you have a local Kokoro model (e.g., at x:\\kokoro), configure the path in <strong>Settings → Kokoro Access</strong> to use it instead of downloading.
                      </p>
                    </div>
                    {onOpenSettings ? (
                      <button type="button" className="vlab-btn sec" onClick={onOpenSettings}>
                        Open Settings
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="vlab-callout">
                <div className="vlab-callout-head">
                  <div>
                    <p className="vlab-callout-title">Runtime Voice Options Moved</p>
                    <p className="vlab-callout-copy">
                      Global routing, provider API keys, and optional Kokoro access now live under <strong>Settings</strong> so Voice Lab stays focused on per-character tuning.
                    </p>
                  </div>
                  {onOpenSettings ? (
                    <button type="button" className="vlab-btn sec" onClick={onOpenSettings}>
                      Open Settings
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="vlab-field">
                <div className="vlab-label-row">
                  <label htmlFor={activeVoiceFieldId}>
                    {voiceFieldLabel}
                  </label>
                  {(voiceProfile.engine === "elevenlabs" || voiceProfile.engine === "cartesia") ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {showProviderUpdated ? <span className="vlab-reload-meta">Updated just now</span> : null}
                      <button
                        type="button"
                        className="vlab-reload-btn"
                        onClick={() => setProviderOptionsReloadToken((n) => n + 1)}
                        disabled={isLoadingProviderOptions}
                      >
                        {isLoadingProviderOptions ? "Loading..." : "Reload"}
                      </button>
                    </div>
                  ) : null}
                </div>
                {voiceProfile.engine === "piper" ? (
                  <>
                    <select
                      id="vlab-voice"
                      name="vlabPiperVoice"
                      className="vlab-select"
                      value={selectedPiperVoice?.path || voiceProfile.piperModelPath || ""}
                      onChange={(e) => handlePiperVoiceChange(e.target.value)}
                      disabled={isLoadingPiperVoices || piperVoices.length === 0}
                    >
                      <option value="">
                        {isLoadingPiperVoices
                          ? "SCANNING LOCAL VOICES..."
                          : piperVoices.length
                            ? "Select a Piper voice"
                            : "No Piper voices found"}
                      </option>
                      {piperVoices.map((v) => (
                        <option key={v.path} value={v.path}>
                          {v.label}{v.isDefault ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                    <small className="vlab-small">
                      {piperVoiceError
                        ? piperVoiceError
                        : piperVoices.length
                          ? `${piperVoices.length} voice${piperVoices.length === 1 ? "" : "s"} detected`
                          : "No local Piper models found. Run installer or set PIPER_MODEL_PATH."}
                    </small>
                  </>
                ) : voiceProfile.engine === "kokoro" ? (
                  <>
                    {isLoadingKokoroVoices ? (
                      <div className="vlab-small" style={{ padding: "8px 0" }}>LOADING KOKORO VOICES...</div>
                    ) : kokoroVoices.length === 0 ? (
                      <div className="vlab-small" style={{ padding: "8px 0" }}>
                        {kokoroVoiceError || "No Kokoro voices loaded"}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {kokoroVoices.map((voice) => {
                          const isSelected = (voiceProfile.kokoroVoice || "") === voice.id;
                          return (
                            <div
                              key={voice.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: isSelected
                                  ? "1px solid rgba(0,234,255,0.45)"
                                  : "1px solid rgba(0,180,255,0.12)",
                                background: isSelected
                                  ? "rgba(0,234,255,0.07)"
                                  : "rgba(6,14,28,0.5)",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                updateVoiceField("kokoroVoice", voice.id);
                                updateVoiceField("providerVoice", voice.id);
                                updateVoiceField("preferredVoice", voice.id);
                              }}
                            >
                              <span style={{ flex: 1, fontSize: "0.85rem", color: isSelected ? "#00eaff" : "#dcf7ff" }}>
                                {voice.label}
                              </span>
                              <button
                                type="button"
                                title={`Preview ${voice.label}`}
                                disabled={isGeneratingAudio}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateAudio(
                                    "Hello! This is a quick voice preview so you can hear how I sound.",
                                    { kokoroVoice: voice.id, providerVoice: voice.id, preferredVoice: voice.id },
                                    "voice preview",
                                  );
                                }}
                                style={{
                                  flexShrink: 0,
                                  padding: "3px 9px",
                                  borderRadius: "999px",
                                  border: "1px solid rgba(0,234,255,0.25)",
                                  background: "rgba(0,234,255,0.07)",
                                  color: "#00eaff",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  cursor: isGeneratingAudio ? "not-allowed" : "pointer",
                                  opacity: isGeneratingAudio ? 0.4 : 1,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                ▶
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <small className="vlab-small" style={{ marginTop: "4px", display: "block" }}>
                      {kokoroVoiceError || "Click a voice to select it. Press ▶ to hear a quick preview."}
                    </small>
                  </>
                ) : voiceProfile.engine === "elevenlabs" ? (
                  <>
                    <select
                      id="vlab-voice"
                      name="vlabElevenLabsVoice"
                      className="vlab-select"
                      value={selectedVoiceOption}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === CUSTOM_OPTION) {
                          updateVoiceField("elevenLabsVoiceId", "");
                          updateVoiceField("providerVoice", "");
                          updateVoiceField("preferredVoice", "");
                          return;
                        }
                        updateVoiceField("elevenLabsVoiceId", next);
                        updateVoiceField("providerVoice", next);
                        updateVoiceField("preferredVoice", next);
                      }}
                    >
                      <option value="" disabled>
                        {isLoadingProviderOptions ? "LOADING PROVIDER VOICES..." : "Select an ElevenLabs voice"}
                      </option>
                      {activeBuiltinVoices.map((voice) => (
                        <option key={voice.id} value={voice.id}>{voice.label}</option>
                      ))}
                      {activeCustomVoices.length ? (
                        <option value="__my_voices__" disabled>My Voices</option>
                      ) : null}
                      {activeCustomVoices.map((voice) => (
                        <option key={voice.id} value={voice.id}>{voice.label}</option>
                      ))}
                      <option value={CUSTOM_OPTION}>Custom voice id</option>
                    </select>
                    {selectedVoiceOption === CUSTOM_OPTION ? (
                      <input
                        id="vlab-voice-custom"
                        name="vlabElevenLabsVoiceCustom"
                        className="vlab-input"
                        value={voiceProfile.elevenLabsVoiceId || voiceProfile.providerVoice || ""}
                        onChange={(e) => {
                          updateVoiceField("providerVoice", e.target.value);
                          updateVoiceField("preferredVoice", e.target.value);
                          updateVoiceField("elevenLabsVoiceId", e.target.value);
                        }}
                        placeholder="Paste custom ElevenLabs voice id"
                      />
                    ) : null}
                    <small className="vlab-small">
                      {activeProviderOptions.error || "Auto-loaded from your configured ElevenLabs API key."}
                    </small>
                  </>
                ) : voiceProfile.engine === "cartesia" ? (
                  <>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <select
                        id="vlab-voice"
                        name="vlabCartesiaVoice"
                        className="vlab-select"
                        style={{ flex: 1 }}
                        value={selectedVoiceOption}
                        onChange={(e) => {
                          const next = e.target.value;
                          // Stop any playing sample when switching voices
                          if (voiceSampleAudioRef.current) {
                            voiceSampleAudioRef.current.pause();
                            voiceSampleAudioRef.current.currentTime = 0;
                          }
                          setCartesiaPreviewPlaying(false);
                          if (next === CUSTOM_OPTION) {
                            updateVoiceField("cartesiaVoiceId", "");
                            updateVoiceField("providerVoice", "");
                            updateVoiceField("preferredVoice", "");
                            return;
                          }
                          updateVoiceField("cartesiaVoiceId", next);
                          updateVoiceField("providerVoice", next);
                          updateVoiceField("preferredVoice", next);
                        }}
                      >
                        <option value="" disabled>
                          {isLoadingProviderOptions ? "LOADING PROVIDER VOICES..." : "Select a Cartesia voice"}
                        </option>
                        {activeProviderOptions.voices.map((voice) => (
                          <option key={voice.id} value={voice.id}>{voice.label}</option>
                        ))}
                        <option value={CUSTOM_OPTION}>Custom voice id</option>
                      </select>
                      <button
                        type="button"
                        title={cartesiaVoicePreviewUrl
                          ? (cartesiaPreviewPlaying ? "Stop sample" : "Play provider sample")
                          : "Preview using Voxis synthesis path"}
                        className="vlab-btn sec"
                        style={{ flexShrink: 0, padding: "0 11px", fontSize: "1rem", minHeight: "36px" }}
                        onClick={() => {
                          if (cartesiaVoicePreviewUrl) {
                            if (cartesiaPreviewPlaying) {
                              if (voiceSampleAudioRef.current) {
                                voiceSampleAudioRef.current.pause();
                                voiceSampleAudioRef.current.currentTime = 0;
                              }
                              setCartesiaPreviewPlaying(false);
                              return;
                            }
                            if (voiceSampleAudioRef.current) {
                              voiceSampleAudioRef.current.pause();
                            }
                            const audio = new Audio(cartesiaVoicePreviewUrl);
                            voiceSampleAudioRef.current = audio;
                            audio.onended = () => setCartesiaPreviewPlaying(false);
                            audio.onerror = () => setCartesiaPreviewPlaying(false);
                            audio.play()
                              .then(() => setCartesiaPreviewPlaying(true))
                              .catch(() => setCartesiaPreviewPlaying(false));
                            return;
                          }

                          void generateAudio(
                            "Voice lab quick check: this is a preview generated through the live Voxis Cartesia pipeline.",
                            {
                              cartesiaVoiceId: voiceProfile.cartesiaVoiceId,
                              providerVoice: voiceProfile.cartesiaVoiceId || voiceProfile.providerVoice,
                              preferredVoice: voiceProfile.cartesiaVoiceId || voiceProfile.preferredVoice,
                            },
                            "voice preview",
                          );
                        }}
                      >
                        {cartesiaPreviewPlaying ? "■" : "▶"}
                      </button>
                    </div>
                    <div className="vlab-inline-actions" style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        className="vlab-reload-btn"
                        onClick={() => {
                          const activeVoice = activeProviderOptions.voices.find((voice) => voice.id === activeVoiceValue);
                          if (!activeVoice) {
                            return;
                          }
                          toggleVoiceFavorite("cartesia", activeVoice);
                        }}
                      >
                        {favoriteCartesiaVoiceIds.has(String(activeVoiceValue || "").trim()) ? "★ Unfavorite" : "☆ Favorite"}
                      </button>
                      {recommendedCartesiaVoice && String(activeVoiceValue || "").trim() !== String(recommendedCartesiaVoice.id || "").trim() ? (
                        <button
                          type="button"
                          className="vlab-reload-btn"
                          onClick={() => {
                            updateVoiceField("cartesiaVoiceId", recommendedCartesiaVoice.id);
                            updateVoiceField("providerVoice", recommendedCartesiaVoice.id);
                            updateVoiceField("preferredVoice", recommendedCartesiaVoice.id);
                          }}
                        >
                          Use Recommended: {recommendedCartesiaVoice.label}
                        </button>
                      ) : null}
                    </div>
                    {selectedVoiceOption === CUSTOM_OPTION ? (
                      <input
                        id="vlab-voice-custom"
                        name="vlabCartesiaVoiceCustom"
                        className="vlab-input"
                        value={voiceProfile.cartesiaVoiceId || voiceProfile.providerVoice || ""}
                        onChange={(e) => {
                          updateVoiceField("providerVoice", e.target.value);
                          updateVoiceField("preferredVoice", e.target.value);
                          updateVoiceField("cartesiaVoiceId", e.target.value);
                        }}
                        placeholder="Paste custom Cartesia voice id"
                      />
                    ) : null}
                    <small className="vlab-small">
                      {getProviderVoiceHelpText("cartesia", activeProviderOptions)}
                    </small>
                    <small className="vlab-small">
                      {cartesiaVoicePreviewUrl
                        ? "The ▶ button is using Cartesia's provider sample URL for this voice id."
                        : "This voice does not expose a provider sample URL; ▶ falls back to live synthesis preview through Voxis."}
                    </small>
                  </>
                ) : (
                  <>
                    <select
                      id="vlab-voice"
                      name="vlabCloudVoice"
                      className="vlab-select"
                      value={selectedCloudVoiceOption}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === CUSTOM_OPTION) {
                          updateVoiceField("providerVoice", "");
                          updateVoiceField("preferredVoice", "");
                          return;
                        }
                        updateVoiceField("providerVoice", next);
                        updateVoiceField("preferredVoice", next);
                      }}
                    >
                      <option value="" disabled>Select a cloud voice</option>
                      {CLOUD_VOICE_PRESETS.map((voice) => (
                        <option key={voice.id || CUSTOM_OPTION} value={voice.id || CUSTOM_OPTION}>{voice.label}</option>
                      ))}
                    </select>
                    {selectedCloudVoiceOption === CUSTOM_OPTION ? (
                      <input
                        id="vlab-voice-custom"
                        name="vlabCloudVoiceCustom"
                        className="vlab-input"
                        value={voiceProfile.providerVoice || voiceProfile.preferredVoice || ""}
                        onChange={(e) => {
                          updateVoiceField("providerVoice", e.target.value);
                          updateVoiceField("preferredVoice", e.target.value);
                        }}
                        placeholder="alloy"
                      />
                    ) : null}
                    <small className="vlab-small">
                      {voiceProfile.engine === "kokoro" || voiceProfile.engine === "piper"
                        ? "Used if voice synthesis needs to fall back to cloud from this engine."
                        : "OpenAI-compatible cloud voice selection."}
                    </small>
                  </>
                )}
              </div>

              <div className="vlab-field">
                <div className="vlab-label-row">
                  <label htmlFor={activeModelFieldId}>{modelFieldLabel}</label>
                  {(selectedProviderId || supportsCloudModelCatalog) ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {selectedProviderId && showProviderUpdated ? (
                        <span className="vlab-reload-meta">Updated just now</span>
                      ) : null}
                      {!selectedProviderId && showCloudUpdated ? (
                        <span className="vlab-reload-meta">Updated just now</span>
                      ) : null}
                      <button
                        type="button"
                        className="vlab-reload-btn"
                        onClick={() => {
                          if (selectedProviderId) {
                            setProviderOptionsReloadToken((n) => n + 1);
                          } else {
                            setCloudModelsReloadToken((n) => n + 1);
                          }
                        }}
                        disabled={selectedProviderId ? isLoadingProviderOptions : isLoadingCloudModels}
                      >
                        {(selectedProviderId ? isLoadingProviderOptions : isLoadingCloudModels) ? "Loading..." : "Reload"}
                      </button>
                    </div>
                  ) : null}
                </div>
                {selectedProviderId ? (
                  <>
                    <select
                      id="vlab-model"
                      name="vlabProviderModel"
                      className="vlab-select"
                      value={selectedModelOption}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === CUSTOM_OPTION) {
                          if (selectedProviderId === "elevenlabs") {
                            updateVoiceField("elevenLabsModel", "");
                          } else {
                            updateVoiceField("cartesiaModel", "");
                          }
                          return;
                        }

                        if (selectedProviderId === "elevenlabs") {
                          updateVoiceField("elevenLabsModel", next);
                        } else {
                          updateVoiceField("cartesiaModel", next);
                        }
                      }}
                    >
                      <option value="" disabled>
                        {isLoadingProviderOptions ? "LOADING PROVIDER MODELS..." : "Select a model"}
                      </option>
                      {activeProviderOptions.models.map((model) => (
                        <option key={model.id} value={model.id}>{model.label}</option>
                      ))}
                      <option value={CUSTOM_OPTION}>Custom model id</option>
                    </select>
                    {selectedModelOption === CUSTOM_OPTION ? (
                      <input
                        id="vlab-model-custom"
                        name={selectedProviderId === "elevenlabs" ? "vlabElevenLabsModelCustom" : "vlabCartesiaModelCustom"}
                        className="vlab-input"
                        value={activeModelValue}
                        onChange={(e) => {
                          if (selectedProviderId === "elevenlabs") {
                            updateVoiceField("elevenLabsModel", e.target.value);
                          } else {
                            updateVoiceField("cartesiaModel", e.target.value);
                          }
                        }}
                        placeholder={selectedProviderId === "elevenlabs" ? "eleven_multilingual_v2" : "sonic-3"}
                      />
                    ) : null}
                    {selectedProviderId === "cartesia" ? (
                      <div className="vlab-inline-actions" style={{ marginTop: 4 }}>
                        {CARTESIA_MODEL_QUICK_PICKS.map((modelId) => (
                          <button
                            key={modelId}
                            type="button"
                            className="vlab-reload-btn"
                            onClick={() => updateVoiceField("cartesiaModel", modelId)}
                          >
                            {modelId}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="vlab-reload-btn"
                          onClick={() => updateVoiceField("cartesiaModel", "")}
                        >
                          Custom model id
                        </button>
                      </div>
                    ) : null}
                    <small className="vlab-small">
                      {getProviderModelHelpText(selectedProviderId, activeProviderOptions)}
                    </small>
                  </>
                ) : supportsCloudModelCatalog ? (
                  <>
                    <select
                      id="vlab-model"
                      name="vlabProviderModel"
                      className="vlab-select"
                      value={selectedCloudModelOption}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === CUSTOM_OPTION) {
                          updateVoiceField("providerModel", "");
                          return;
                        }

                        updateVoiceField("providerModel", next);
                      }}
                    >
                      <option value="" disabled>
                        {isLoadingCloudModels ? "LOADING CLOUD MODELS..." : "Select a cloud model"}
                      </option>
                      {cloudModels.map((model) => (
                        <option key={model.id} value={model.id}>{model.label}</option>
                      ))}
                      <option value={CUSTOM_OPTION}>Custom model id</option>
                    </select>
                    {selectedCloudModelOption === CUSTOM_OPTION ? (
                      <input
                        id="vlab-model-custom"
                        name="vlabProviderModelCustom"
                        className="vlab-input"
                        value={voiceProfile.providerModel || ""}
                        onChange={(e) => updateVoiceField("providerModel", e.target.value)}
                        placeholder="gpt-4o-mini-tts"
                      />
                    ) : null}
                    <small className="vlab-small">
                      {cloudModelError || (voiceProfile.engine === "kokoro" || voiceProfile.engine === "piper"
                        ? "Used if voice synthesis needs to fall back to cloud from this engine."
                        : "Auto-loaded from Runtime LLM provider model list.")}
                    </small>
                  </>
                ) : (
                  <input
                    id="vlab-model"
                    name="vlabProviderModel"
                    className="vlab-input"
                    value={voiceProfile.providerModel}
                    onChange={(e) => updateVoiceField("providerModel", e.target.value)}
                    placeholder={
                      voiceProfile.engine === "piper"
                        ? "cloud fallback model"
                        : "gpt-4o-mini-tts"
                    }
                  />
                )}
              </div>

              {voiceProfile.engine === "piper" && (
                <>
                  <div className="vlab-field">
                    <label htmlFor="vlab-piper-path">Model Path (advanced)</label>
                    <input
                      id="vlab-piper-path"
                      name="vlabPiperPath"
                      className="vlab-input"
                      value={voiceProfile.piperModelPath}
                      onChange={(e) => updateVoiceField("piperModelPath", e.target.value)}
                      placeholder="/opt/piper/models/en_US-lessac-medium.onnx"
                    />
                  </div>

                  <div className="vlab-field">
                    <label htmlFor="vlab-piper-speaker">
                      {selectedPiperVoice?.speakers?.length > 1 ? "Speaker" : "Speaker ID (optional)"}
                    </label>
                    {selectedPiperVoice?.speakers?.length > 1 ? (
                      <select
                        id="vlab-piper-speaker"
                        name="vlabPiperSpeaker"
                        className="vlab-select"
                        value={String(voiceProfile.piperSpeaker ?? "")}
                        onChange={(e) => updateVoiceField("piperSpeaker", e.target.value)}
                      >
                        <option value="">Default speaker</option>
                        {selectedPiperVoice.speakers.map((s) => (
                          <option key={`${selectedPiperVoice.id}-${s.id}`} value={String(s.id)}>
                            {s.label} ({s.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="vlab-piper-speaker"
                        name="vlabPiperSpeaker"
                        className="vlab-input"
                        value={voiceProfile.piperSpeaker ?? ""}
                        onChange={(e) => updateVoiceField("piperSpeaker", e.target.value)}
                        placeholder="0"
                      />
                    )}
                  </div>
                </>
              )}

              {voiceProfile.engine === "elevenlabs" && (
                <>
                  <div className="vlab-field">
                    <label htmlFor="vlab-stability">Stability</label>
                    <div className="vlab-slider-row">
                      <input
                        id="vlab-stability"
                        name="vlabStability"
                        type="range"
                        className="vlab-slider"
                        min="0" max="1" step="0.01"
                        value={voiceProfile.stability}
                        onChange={(e) => updateVoiceField("stability", Number(e.target.value))}
                        style={sliderStyle(voiceProfile.stability, 0, 1)}
                      />
                      <span className="vlab-slider-readout">{Number(voiceProfile.stability).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="vlab-field">
                    <label htmlFor="vlab-similarity">Similarity Boost</label>
                    <div className="vlab-slider-row">
                      <input
                        id="vlab-similarity"
                        name="vlabSimilarityBoost"
                        type="range"
                        className="vlab-slider"
                        min="0" max="1" step="0.01"
                        value={voiceProfile.similarityBoost}
                        onChange={(e) => updateVoiceField("similarityBoost", Number(e.target.value))}
                        style={sliderStyle(voiceProfile.similarityBoost, 0, 1)}
                      />
                      <span className="vlab-slider-readout">{Number(voiceProfile.similarityBoost).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="vlab-field">
                    <label htmlFor="vlab-style">Style</label>
                    <div className="vlab-slider-row">
                      <input
                        id="vlab-style"
                        name="vlabStyle"
                        type="range"
                        className="vlab-slider"
                        min="0" max="1" step="0.01"
                        value={voiceProfile.style}
                        onChange={(e) => updateVoiceField("style", Number(e.target.value))}
                        style={sliderStyle(voiceProfile.style, 0, 1)}
                      />
                      <span className="vlab-slider-readout">{Number(voiceProfile.style).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Synthesis Parameters ── */}
          <div className="vlab-section">
            <div className="vlab-section-label">◈ SYNTHESIS PARAMETERS</div>
            <div className="vlab-grid">
              <div className="vlab-field">
                <label htmlFor="vlab-pitch">Pitch Modifier</label>
                <div className="vlab-slider-row">
                  <input
                    id="vlab-pitch"
                    name="vlabPitch"
                    type="range"
                    className="vlab-slider"
                    min="0.5" max="1.6" step="0.05"
                    value={voiceProfile.pitch}
                    onChange={(e) => updateVoiceField("pitch", Number(e.target.value))}
                    style={sliderStyle(voiceProfile.pitch, 0.5, 1.6)}
                  />
                  <span className="vlab-slider-readout">{Number(voiceProfile.pitch).toFixed(2)}×</span>
                </div>
                {voiceProfile.engine === "cartesia" ? (
                  <small className="vlab-small">
                    Cartesia currently does not expose native numeric pitch control in this path. Use voice selection, model, prosody shaping, and rate changes for audible tuning.
                  </small>
                ) : null}
              </div>
              <div className="vlab-field">
                <label htmlFor="vlab-rate">Rate Modifier</label>
                <div className="vlab-slider-row">
                  <input
                    id="vlab-rate"
                    name="vlabRate"
                    type="range"
                    className="vlab-slider"
                    min="0.6" max="1.6" step="0.05"
                    value={voiceProfile.rate}
                    onChange={(e) => updateVoiceField("rate", Number(e.target.value))}
                    style={sliderStyle(voiceProfile.rate, 0.6, 1.6)}
                  />
                  <span className="vlab-slider-readout">{Number(voiceProfile.rate).toFixed(2)}×</span>
                </div>
              </div>
              <div className="vlab-field">
                <label htmlFor="vlab-realism-enabled">Realism Post-Processing</label>
                <label className="vlab-toggle" htmlFor="vlab-realism-enabled" style={{ marginTop: 4 }}>
                  <input
                    id="vlab-realism-enabled"
                    name="vlabRealismEnabled"
                    type="checkbox"
                    checked={Boolean(voiceProfile.realismEnabled)}
                    onChange={(e) => updateVoiceField("realismEnabled", e.target.checked)}
                  />
                  <span className="vlab-toggle-track" />
                  <span className="vlab-toggle-label">Enable ffmpeg realism chain</span>
                </label>
                <small className="vlab-small">
                  Adds loudness normalization, compression, and high-frequency taming after TTS synthesis.
                </small>
              </div>
              <div className="vlab-field">
                <label htmlFor="vlab-realism-preset">Realism Preset</label>
                <select
                  id="vlab-realism-preset"
                  name="vlabRealismPreset"
                  className="vlab-select"
                  value={voiceProfile.realismPreset || "conversational"}
                  onChange={(e) => updateVoiceField("realismPreset", e.target.value)}
                  disabled={!voiceProfile.realismEnabled}
                >
                  {REALISM_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
                <small className="vlab-small">
                  {REALISM_PRESETS.find((preset) => preset.id === (voiceProfile.realismPreset || "conversational"))?.description || "Balanced cleanup for everyday dialogue."}
                </small>
              </div>
            </div>
          </div>

          {/* ── Voice Flags ── */}
          <div className="vlab-section">
            <div className="vlab-section-label">◈ VOICE FLAGS</div>
            <div className="vlab-toggle-row">
              <label className="vlab-toggle">
                <input
                  name="vlabVoiceEnabled"
                  type="checkbox"
                  checked={voiceProfile.enabled}
                  onChange={(e) => updateVoiceField("enabled", e.target.checked)}
                />
                <span className="vlab-toggle-track" />
                <span className="vlab-toggle-label">Enable voice playback</span>
              </label>
              <label className="vlab-toggle">
                <input
                  name="vlabVoiceAutoplay"
                  type="checkbox"
                  checked={voiceProfile.autoplay}
                  onChange={(e) => updateVoiceField("autoplay", e.target.checked)}
                />
                <span className="vlab-toggle-track" />
                <span className="vlab-toggle-label">Auto-play assistant replies</span>
              </label>
            </div>
          </div>

          {/* ── Signal Tester ── */}
          <div className="vlab-section">
            <div className="vlab-section-label">◈ SIGNAL TESTER</div>
            <div className="vlab-field">
              <label htmlFor="vlab-prosody-url">Prosody Source URL</label>
              <input
                id="vlab-prosody-url"
                className="vlab-input"
                value={prosodyUrl}
                onChange={(e) => setProsodyUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="vlab-actions" style={{ marginTop: 6 }}>
                <button
                  type="button"
                  className="vlab-btn sec"
                  onClick={() => void extractProsodyTemplate({ useFile: false })}
                  disabled={isExtractingProsody || !prosodyUrl.trim()}
                >
                  {isExtractingProsody ? "EXTRACTING…" : "EXTRACT PROSODY"}
                </button>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] || null;
                    setProsodyFile(nextFile);
                    if (nextFile) {
                      onStatus?.({ type: "info", message: `Selected audio file: ${nextFile.name}` });
                    }
                  }}
                  style={{ maxWidth: 280 }}
                />
                <button
                  type="button"
                  className="vlab-btn sec"
                  onClick={() => void extractProsodyTemplate({ useFile: true })}
                  disabled={isExtractingProsody || !hasProsodyFile}
                >
                  {isExtractingProsody ? "EXTRACTING…" : "EXTRACT FROM FILE"}
                </button>
                {Array.isArray(voiceSamples?.representatives) && voiceSamples.representatives.length > 0 ? (
                  <button
                    type="button"
                    className="vlab-btn sec"
                    onClick={() => {
                      setProsodyModalError("");
                      setIsProsodyModalOpen(true);
                    }}
                  >
                    REVIEW VOICES
                  </button>
                ) : null}
              </div>
              <div className="vlab-small">
                Downloads source audio, extracts cadence/rhythm template, attaches it to this persona, and removes temp audio.
              </div>
              {prosodyFile ? (
                <div className="vlab-small">
                  Selected file: <strong>{prosodyFile.name}</strong> ({Math.round(prosodyFile.size / 1024)} KB)
                </div>
              ) : null}
            </div>
            <div className="vlab-field">
              <label htmlFor="vlab-sample">Sample Transmission Text</label>
              <textarea
                id="vlab-sample"
                className="vlab-textarea"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder="Type a line to synthesize and preview…"
              />
              <div className="vlab-small">
                Sample preview runs through the same Speech Director pipeline as live TTS replies.
              </div>
              {directedPreview ? (
                <div className="vlab-small" style={{ marginTop: 8 }}>
                  Directed preview: <strong>{directedPreview}</strong>
                  {previewTelemetry?.adjustedVoice ? (
                    <>
                      {" "}
                      | Engine: {String(previewTelemetry.engine || "auto").toUpperCase()} | Rate:
                      {` ${Number(previewTelemetry.adjustedVoice.rate ?? voiceProfile.rate).toFixed(2)}x`} | Pitch:
                      {` ${Number(previewTelemetry.adjustedVoice.pitch ?? voiceProfile.pitch).toFixed(2)}x`}
                    </>
                  ) : null}
                  {previewTelemetry?.prosodyEnvelope ? (
                    <>
                      {" "}
                      | Phrasing: {String(previewTelemetry.prosodyEnvelope.phrasing || "balanced")} | Intensity:
                      {` ${Number(previewTelemetry.prosodyEnvelope.intensity ?? 0.5).toFixed(2)}`} | Confidence:
                      {` ${Number(previewTelemetry.prosodyEnvelope.confidence ?? 0).toFixed(2)}`} | Emphasis:
                      {` ${(previewTelemetry.prosodyEnvelope.emphasis?.words || []).map((item) => item.term).join(", ") || "none"}`}
                    </>
                  ) : null}
                  {previewTelemetry?.synthesisText ? (
                    <>
                      {" "}
                      | Engine input: <strong>{String(previewTelemetry.synthesisText)}</strong>
                    </>
                  ) : null}
                  {previewTelemetry?.ttsTelemetry?.engineControls?.experimentalControls ? (
                    <>
                      {" "}
                      | Cartesia controls: {JSON.stringify(previewTelemetry.ttsTelemetry.engineControls.experimentalControls)}
                    </>
                  ) : null}
                  {previewTelemetry?.realismTelemetry ? (
                    <>
                      {" "}
                      | Realism: {String(previewTelemetry.realismTelemetry.chain || previewTelemetry.realismChain || "disabled")}
                      {previewTelemetry.realismTelemetry.applied === false && previewTelemetry.realismTelemetry.error
                        ? ` (${String(previewTelemetry.realismTelemetry.error)})`
                        : ""}
                    </>
                  ) : previewTelemetry?.realismChain ? (
                    <>
                      {" "}
                      | Realism: {String(previewTelemetry.realismChain)}
                    </>
                  ) : null}
                  {previewTelemetry?.emotionFrame ? (
                    <>
                      {" "}
                      | Emotion: {String(previewTelemetry.emotionFrame.displayLabel || "Neutral")} | Zone:
                      {` ${String(previewTelemetry.emotionFrame.zone?.label || "Green Zone")}`} | Emotional Intensity:
                      {` ${Math.round(Number(previewTelemetry.emotionFrame.intensity || 0) * 100)}%`}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Voice Sample Selection ── */}
          {isProsodyModalOpen ? (
            <div
              className="vlab-modal-overlay"
              onClick={() => {
                if (!isExtractingProsody) {
                  setIsProsodyModalOpen(false);
                }
              }}
            >
              <div className="vlab-modal" onClick={(event) => event.stopPropagation()}>
                <div className="vlab-modal-header">
                  <div>
                    <h4 className="vlab-modal-title">Prosody Extraction</h4>
                    <p className="vlab-modal-copy">
                      Track extraction progress, preview isolated voices, and choose the voice that best matches this persona.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="vlab-modal-close"
                    onClick={() => setIsProsodyModalOpen(false)}
                    disabled={isExtractingProsody}
                  >
                    Close
                  </button>
                </div>

                {(isExtractingProsody || prosodyModalError) ? (
                  <div className="vlab-progress-panel">
                    {PROSODY_PROGRESS_STEPS.map((step, index) => {
                      const stateClass = index < prosodyProgressIndex
                        ? "done"
                        : index === prosodyProgressIndex
                          ? "active"
                          : "";
                      return (
                        <div key={step} className={`vlab-progress-step ${stateClass}`.trim()}>
                          <span className="vlab-progress-dot" />
                          {step}
                        </div>
                      );
                    })}
                    {prosodyModalError ? (
                      <div className="vlab-small" style={{ color: "#ff8d8d" }}>
                        {prosodyModalError}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {voiceSamples ? (
                  <VoiceSampleSelector
                    personality={personality}
                    voiceSamples={voiceSamples}
                    isLoading={isExtractingProsody}
                    onSampleSelected={(updatedPersonality) => {
                      onPersonalityUpdated?.(updatedPersonality);
                      setVoiceSamples(updatedPersonality?.voiceSampleAnalysis || voiceSamples);
                      setIsProsodyModalOpen(false);
                    }}
                    onStatus={onStatus}
                  />
                ) : !isExtractingProsody && !prosodyModalError ? (
                  <div className="vlab-small">No representative voices were detected from the source.</div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ── Waveform Monitor ── */}
          <div className="vlab-section">
            <div className="vlab-section-label">◈ WAVEFORM MONITOR</div>
            <div className="vlab-waveform-wrap">
              <div className="vlab-waveform-tag">FREQUENCY SPECTRUM</div>
              {isGeneratingAudio && (
                <div className="vlab-gen-badge">
                  <span className="vlab-gen-dot" />
                  SYNTHESIZING
                </div>
              )}
              <canvas ref={canvasRef} className="vlab-canvas" />
            </div>
            {/* Always render audio element so Web Audio API can attach to it */}
            <audio
              ref={audioRef}
              className="vlab-audio-player"
              controls
              src={audioUrl || undefined}
              style={{ display: audioUrl ? "block" : "none" }}
            />
          </div>

          {/* ── Controls ── */}
          <div className="vlab-section">
            <div className="vlab-section-label">◈ CONTROLS</div>
            <div className="vlab-grid" style={{ marginBottom: 8 }}>
              <div className="vlab-field">
                <label htmlFor="vlab-voice-map-name">Saved Voice Map Name</label>
                <input
                  id="vlab-voice-map-name"
                  className="vlab-input"
                  value={voiceMapName}
                  onChange={(event) => setVoiceMapName(event.target.value)}
                  placeholder="e.g. Dark Ara Whisper"
                />
              </div>
              <div className="vlab-field">
                <label htmlFor="vlab-voice-map-select">Saved Voice Maps (sorted by name)</label>
                <select
                  id="vlab-voice-map-select"
                  className="vlab-select"
                  value={selectedVoiceMapId}
                  onChange={(event) => {
                    const nextId = String(event.target.value || "");
                    setSelectedVoiceMapId(nextId);
                    if (nextId) {
                      const map = savedVoiceMaps.find((entry) => entry.id === nextId);
                      if (map?.voiceName) {
                        setVoiceMapName(map.voiceName);
                      }
                    }
                  }}
                  disabled={isLoadingVoiceMaps}
                >
                  <option value="">{isLoadingVoiceMaps ? "Loading maps..." : "Select a saved voice map"}</option>
                  {savedVoiceMaps.map((map) => (
                    <option key={map.id} value={map.id}>
                      {map.voiceName}
                      {String(map.id || "") === recommendedVoiceMapId ? " ★" : ""}
                      {map.linkedPersonalityName ? ` - ${map.linkedPersonalityName}` : ""}
                    </option>
                  ))}
                </select>
                {recommendedVoiceMapId ? (
                  <div className="vlab-small">★ Recommended for current voice/persona</div>
                ) : null}
              </div>
            </div>
            <div className="vlab-toggle-row" style={{ marginBottom: 8 }}>
              <label className="vlab-toggle">
                <input
                  type="checkbox"
                  checked={syncMapOnProfileSave}
                  onChange={(event) => setSyncMapOnProfileSave(event.target.checked)}
                />
                <span className="vlab-toggle-track" />
                <span className="vlab-toggle-label">When saving profile, also update selected voice map</span>
              </label>
            </div>
            <div className="vlab-actions">
              <button
                type="button"
                className="vlab-btn sec"
                onClick={() => void saveVoiceMap()}
                disabled={isSavingVoiceMap || !voiceMapName.trim()}
              >
                {isSavingVoiceMap ? "SAVING MAP…" : "SAVE VOICE MAP"}
              </button>
              <button
                type="button"
                className="vlab-btn sec"
                onClick={() => applyVoiceMap(selectedVoiceMapId)}
                disabled={!selectedVoiceMapId}
              >
                APPLY VOICE MAP
              </button>
              <button
                type="button"
                className="vlab-btn sec"
                onClick={() => void deleteVoiceMap()}
                disabled={!selectedVoiceMapId || isDeletingVoiceMap}
              >
                {isDeletingVoiceMap ? "DELETING…" : "DELETE VOICE MAP"}
              </button>
              <button
                type="button"
                className="vlab-btn"
                onClick={() => void generateAudio(sampleText)}
                disabled={isGeneratingAudio || !sampleText.trim()}
              >
                {isGeneratingAudio ? "SYNTHESIZING…" : "⟴ GENERATE SAMPLE"}
              </button>
              <button
                type="button"
                className="vlab-btn sec"
                onClick={() => void generateAudio(latestAssistantMessage?.content || "")}
                disabled={isGeneratingAudio || !latestAssistantMessage}
              >
                ⟳ LATEST REPLY
              </button>
              <button type="button" className="vlab-btn sec" onClick={stopSpeaking}>
                ■ STOP
              </button>
              <button
                type="button"
                className="vlab-btn sec"
                onClick={() => void handleSaveVoiceProfile()}
                disabled={isSavingVoice}
              >
                {isSavingVoice ? "SAVING…" : "✦ SAVE PROFILE"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
