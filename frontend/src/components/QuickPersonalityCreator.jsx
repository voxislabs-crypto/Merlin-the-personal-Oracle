import { useEffect, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { getApiErrorMessage } from "../lib/apiResponse.js";
import AvatarCore from "./AvatarCore.jsx";
import VoiceSampleSelector from "./VoiceSampleSelector.jsx";

const ANALYZE_PROGRESS_STEPS = [
  "Collecting persona context",
  "Mapping traits and quirks",
  "Drafting speech style",
  "Preparing editable preview",
];

const PROSODY_PROGRESS_STEPS = [
  "Scraping source audio",
  "Analyzing cadence and rhythm",
  "Detecting representative voices",
  "Preparing voice previews",
];

const styles = `
  .quick-creator-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
  }

  .quick-creator-header {
    margin-bottom: 24px;
  }

  .quick-creator-header h2 {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 8px 0;
    color: var(--text);
  }

  .quick-creator-header p {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .step-indicator {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
  }

  .step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    background: rgba(0, 180, 255, 0.1);
    color: var(--muted);
    border: 1px solid rgba(0, 180, 255, 0.2);
  }

  .step-dot.active {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
  }

  .step-dot.completed {
    background: rgba(52, 211, 153, 0.2);
    color: #34d399;
    border-color: #34d399;
  }

  .form-field {
    margin-bottom: 20px;
  }

  .form-field label {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .form-field input,
  .form-field textarea {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 16px;
    background: rgba(6, 14, 28, 0.88);
    color: var(--text);
    font-size: 0.95rem;
    transition: border-color 180ms ease, box-shadow 180ms ease;
  }

  .form-field input:focus,
  .form-field textarea:focus {
    outline: none;
    border-color: rgba(0, 180, 255, 0.42);
    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.08);
  }

  .form-field textarea {
    min-height: 100px;
    resize: vertical;
  }

  .primary-button {
    padding: 14px 28px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--accent-deep));
    color: #fff;
    font-weight: 800;
    font-size: 0.95rem;
    cursor: pointer;
    transition: opacity 180ms, transform 180ms;
  }

  .primary-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .primary-button:disabled {
    opacity: 0.60;
    cursor: wait;
  }

  .secondary-button {
    padding: 14px 28px;
    border: 1px solid rgba(0, 180, 255, 0.20);
    border-radius: 999px;
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 180ms, border-color 180ms;
  }

  .secondary-button:hover:not(:disabled) {
    background: rgba(0, 180, 255, 0.12);
    border-color: rgba(0, 180, 255, 0.32);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(0, 180, 255, 0.2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: var(--text);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .loading-subtext {
    color: var(--muted);
    font-size: 0.9rem;
    margin-top: 8px;
  }

  .loading-progress {
    width: min(460px, 100%);
    margin-top: 18px;
    display: grid;
    gap: 8px;
  }

  .loading-progress-step {
    display: grid;
    grid-template-columns: 14px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(0, 180, 255, 0.14);
    background: rgba(0, 180, 255, 0.03);
    color: var(--muted);
    font-size: 0.82rem;
  }

  .loading-progress-step.done {
    border-color: rgba(74, 222, 128, 0.35);
    background: rgba(74, 222, 128, 0.08);
    color: #b6ffd6;
  }

  .loading-progress-step.active {
    border-color: rgba(0, 180, 255, 0.34);
    background: rgba(0, 180, 255, 0.12);
    color: var(--text);
    box-shadow: 0 0 0 1px rgba(0, 180, 255, 0.12);
  }

  .loading-progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.4);
    background: transparent;
  }

  .loading-progress-step.done .loading-progress-dot {
    border-color: #4ade80;
    background: #4ade80;
  }

  .loading-progress-step.active .loading-progress-dot {
    border-color: var(--accent);
    background: var(--accent);
    box-shadow: 0 0 10px rgba(0, 180, 255, 0.35);
  }

  .confirmation-screen {
    display: grid;
    gap: 24px;
  }

  .character-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    border-radius: 16px;
    background: rgba(0, 180, 255, 0.04);
    border: 1px solid rgba(0, 180, 255, 0.14);
  }

  .character-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(0, 180, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .character-info h3 {
    margin: 0 0 4px 0;
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text);
  }

  .character-info p {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .section-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(0, 180, 255, 0.08);
    border: 1px solid rgba(0, 180, 255, 0.18);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .tag-remove {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255, 100, 100, 0.2);
    border: none;
    color: #ff6464;
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 180ms;
  }

  .tag-remove:hover {
    background: rgba(255, 100, 100, 0.3);
  }

  .tag-input-container {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .tag-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 12px;
    background: rgba(6, 14, 28, 0.88);
    color: var(--text);
    font-size: 0.9rem;
  }

  .tag-add-button {
    padding: 10px 18px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 12px;
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .dialogue-preview {
    padding: 16px;
    border-radius: 12px;
    background: rgba(6, 14, 28, 0.72);
    border: 1px solid rgba(0, 180, 255, 0.1);
  }

  .dialogue-line {
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 180, 255, 0.04);
    border: 1px solid rgba(0, 180, 255, 0.08);
    margin-bottom: 8px;
    font-style: italic;
    color: var(--text);
    font-size: 0.9rem;
  }

  .dialogue-line:last-child {
    margin-bottom: 0;
  }

  .voice-preview-section {
    padding: 16px;
    border-radius: 12px;
    background: rgba(0, 180, 255, 0.04);
    border: 1px solid rgba(0, 180, 255, 0.14);
  }

  .voice-preview-placeholder {
    color: var(--muted);
    font-size: 0.85rem;
    text-align: center;
    padding: 20px;
  }

  .youtube-search-container {
    margin-bottom: 20px;
  }

  .youtube-search-input {
    display: flex;
    gap: 8px;
  }

  .youtube-search-input input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 12px;
    background: rgba(6, 14, 28, 0.88);
    color: var(--text);
    font-size: 0.9rem;
  }

  .youtube-search-button {
    padding: 12px 20px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    border-radius: 12px;
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 180ms;
  }

  .youtube-search-button:hover:not(:disabled) {
    background: rgba(0, 180, 255, 0.12);
  }

  .youtube-search-button:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .video-results {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .video-card {
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 180ms, transform 180ms;
    background: rgba(6, 14, 28, 0.72);
  }

  .video-card:hover {
    border-color: rgba(0, 180, 255, 0.32);
    transform: translateY(-2px);
  }

  .video-card.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(0, 180, 255, 0.2);
  }

  .video-thumbnail {
    width: 100%;
    height: 120px;
    object-fit: cover;
    background: rgba(0, 180, 255, 0.1);
  }

  .video-info {
    padding: 12px;
  }

  .video-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .video-id {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .extracting-voice {
    padding: 16px;
    border-radius: 12px;
    background: rgba(0, 180, 255, 0.04);
    border: 1px solid rgba(0, 180, 255, 0.14);
    text-align: center;
  }

  .extracting-voice-text {
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .extracting-voice-subtext {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .action-bar {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .error-message {
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(255, 100, 100, 0.1);
    border: 1px solid rgba(255, 100, 100, 0.2);
    color: #ff6464;
    font-size: 0.9rem;
    margin-bottom: 16px;
  }

  .dialogue-line-editable {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .dialogue-textarea {
    flex: 1;
    min-height: 60px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 180, 255, 0.2);
    background: rgba(0, 180, 255, 0.04);
    color: var(--text);
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
  }

  .dialogue-textarea:focus {
    outline: none;
    border-color: var(--accent);
    background: rgba(0, 180, 255, 0.08);
  }

  .dialogue-textarea::placeholder {
    color: var(--muted);
  }

  .dialogue-remove {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: rgba(255, 100, 100, 0.1);
    color: #ff6464;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dialogue-remove:hover {
    background: rgba(255, 100, 100, 0.2);
  }

  .dialogue-add-button {
    width: 100%;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px dashed rgba(0, 180, 255, 0.3);
    background: rgba(0, 180, 255, 0.04);
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
  }

  .dialogue-add-button:hover {
    background: rgba(0, 180, 255, 0.08);
    border-color: var(--accent);
  }

  .quick-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 80;
    padding: 20px;
    display: grid;
    place-items: center;
    background: rgba(2, 8, 18, 0.74);
    backdrop-filter: blur(8px);
  }

  .quick-modal {
    width: min(860px, 100%);
    max-height: 86vh;
    overflow: auto;
    border-radius: 20px;
    border: 1px solid rgba(0, 180, 255, 0.24);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 26%),
      linear-gradient(155deg, rgba(6, 18, 34, 0.98), rgba(3, 10, 20, 0.98));
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
    padding: 18px;
    display: grid;
    gap: 14px;
  }

  .quick-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .quick-modal-header h4 {
    margin: 0 0 6px 0;
    color: var(--text);
    font-size: 1rem;
  }

  .quick-modal-copy {
    margin: 0;
    color: var(--muted);
    font-size: 0.86rem;
    line-height: 1.45;
  }

  .quick-modal-close {
    padding: 8px 12px;
    border: 1px solid rgba(0, 180, 255, 0.24);
    border-radius: 999px;
    background: rgba(0, 180, 255, 0.06);
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }

  .quick-modal-close:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .quick-progress-panel {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 180, 255, 0.18);
    background: rgba(0, 180, 255, 0.03);
  }

  .quick-progress-step {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 0.84rem;
  }

  .quick-progress-step.done,
  .quick-progress-step.active {
    color: var(--text);
  }

  .quick-progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(0, 180, 255, 0.3);
    background: transparent;
    flex-shrink: 0;
  }

  .quick-progress-step.done .quick-progress-dot {
    border-color: #4ade80;
    background: #4ade80;
  }

  .quick-progress-step.active .quick-progress-dot {
    border-color: var(--accent);
    background: var(--accent);
  }

  .video-hint {
    margin-top: 10px;
    color: var(--muted);
    font-size: 0.8rem;
  }
`;

export default function QuickPersonalityCreator({ onCreated, onCancel }) {
  const authFetch = useAuthFetch();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sourceUrls: "",
  });
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customTraits, setCustomTraits] = useState([]);
  const [customQuirks, setCustomQuirks] = useState([]);
  const [newTrait, setNewTrait] = useState("");
  const [newQuirk, setNewQuirk] = useState("");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [isExtractingVoice, setIsExtractingVoice] = useState(false);
  const [createdPersonalityId, setCreatedPersonalityId] = useState(null);
  const [editableDialogue, setEditableDialogue] = useState([]);
  const [analysisProgressIndex, setAnalysisProgressIndex] = useState(0);
  const [isVoiceSampleModalOpen, setIsVoiceSampleModalOpen] = useState(false);
  const [prosodyProgressIndex, setProsodyProgressIndex] = useState(0);
  const [prosodyModalError, setProsodyModalError] = useState("");
  const [extractedVoiceSamples, setExtractedVoiceSamples] = useState(null);
  const [characterConfirmation, setCharacterConfirmation] = useState(null);

  useEffect(() => {
    if (!isAnalyzing) {
      return undefined;
    }

    setAnalysisProgressIndex(0);
    const timer = setInterval(() => {
      setAnalysisProgressIndex((current) => Math.min(current + 1, ANALYZE_PROGRESS_STEPS.length - 1));
    }, 1400);

    return () => clearInterval(timer);
  }, [isAnalyzing]);

  const handleAnalyze = async (options = {}) => {
    const { confirm = false } = options;

    if (!formData.name.trim()) {
      setError("Persona name is required");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStep(2);

    try {
      const sourceUrls = formData.sourceUrls
        .split("\n")
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const response = await authFetch("/api/analyze-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sourceUrls,
          confirmCharacterName: confirm ? characterConfirmation?.canonicalName || "" : "",
        }),
      });

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response) || "Analysis failed");
      }

      const data = await response.json();

      if (data?.needsConfirmation) {
        setCharacterConfirmation({
          canonicalName: data.canonicalName || "",
          franchise: data.franchise || "",
          confirmationPrompt: data.confirmationPrompt || "Please confirm the character identity.",
        });
        setStep(1);
        return;
      }

      setCharacterConfirmation(null);
      setAnalysis(data);
      setEditableDialogue(data.sampleDialogue || []);
      setAnalysisProgressIndex(ANALYZE_PROGRESS_STEPS.length - 1);
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to analyze persona");
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveTrait = (index, isCustom = false) => {
    if (isCustom) {
      setCustomTraits(prev => prev.filter((_, i) => i !== index));
    } else {
      setAnalysis(prev => ({
        ...prev,
        traits: prev.traits.filter((_, i) => i !== index),
      }));
    }
  };

  const handleRemoveQuirk = (index, isCustom = false) => {
    if (isCustom) {
      setCustomQuirks(prev => prev.filter((_, i) => i !== index));
    } else {
      setAnalysis(prev => ({
        ...prev,
        quirks: prev.quirks.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddTrait = () => {
    if (newTrait.trim()) {
      setCustomTraits(prev => [...prev, newTrait.trim()]);
      setNewTrait("");
    }
  };

  const handleAddQuirk = () => {
    if (newQuirk.trim()) {
      setCustomQuirks(prev => [...prev, newQuirk.trim()]);
      setNewQuirk("");
    }
  };

  const handleYouTubeSearch = async () => {
    if (!youtubeQuery.trim()) {
      setError("Search query is required");
      return;
    }

    setIsSearchingYouTube(true);
    setError(null);

    try {
      const response = await authFetch(`/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(response) || "YouTube search failed");
      }

      const data = await response.json();
      setYoutubeResults(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to search YouTube");
    } finally {
      setIsSearchingYouTube(false);
    }
  };

  const extractVoiceFromVideo = async (video) => {
    if (!video || !createdPersonalityId) {
      setError("No video selected or persona not created");
      return;
    }

    // Validate URL before sending
    if (!video.url || !/^https?:\/\//i.test(video.url)) {
      setError("Invalid video URL. Please search for videos again.");
      return;
    }

    setSelectedVideo(video);
    setIsVoiceSampleModalOpen(true);
    setProsodyModalError("");
    setProsodyProgressIndex(0);
    setExtractedVoiceSamples(null);
    setIsExtractingVoice(true);
    setError(null);

    const progressTimer = setInterval(() => {
      setProsodyProgressIndex((current) => Math.min(current + 1, PROSODY_PROGRESS_STEPS.length - 1));
    }, 1600);

    try {
      const response = await authFetch(`/api/personality/${createdPersonalityId}/prosody-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: video.url }),
      });

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response) || "Voice extraction failed");
      }

      const data = await response.json();
      setExtractedVoiceSamples(data.voiceSamples || data.personality?.voiceSampleAnalysis || null);
      setProsodyProgressIndex(PROSODY_PROGRESS_STEPS.length - 1);
    } catch (err) {
      const message = err.message || "Failed to extract voice";
      setProsodyModalError(message);
      setError(message);
      // Delete the persona if voice extraction fails
      try {
        await authFetch(`/api/personality/${createdPersonalityId}`, { method: "DELETE" });
      } catch (deleteErr) {
        console.error("Failed to delete persona after voice extraction error:", deleteErr);
      }
    } finally {
      clearInterval(progressTimer);
      setIsExtractingVoice(false);
    }
  };

  const handleExtractVoice = async () => {
    if (!selectedVideo) {
      setError("Select a video first.");
      return;
    }
    await extractVoiceFromVideo(selectedVideo);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const allTraits = [...(analysis.traits || []), ...customTraits];
      const allQuirks = [...(analysis.quirks || []), ...customQuirks];

      const personalityData = {
        name: analysis.name,
        description: analysis.description || `A personality based on ${analysis.name}`,
        traits: allTraits,
        quirks: allQuirks,
        speechStyle: analysis.speechStyle,
        mood: analysis.mood,
        creativeContext: "default",
        behaviorRules: [`Stay in persona as ${analysis.name}. ${analysis.speechStyle || ""}`],
        goals: ["maintain persona consistency"],
        values: allTraits.slice(0, 3),
        notablePhrases: editableDialogue.filter(line => line.trim()),
        moodSensitivity: 1.0,
      };

      const response = await authFetch("/api/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalityData),
      });

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response) || "Failed to create personality");
      }

      const data = await response.json();
      setCreatedPersonalityId(data.id);
      
      // Auto-fill YouTube search with persona name
      setYoutubeQuery(`${analysis.name} voice clips interview`);
      
      // Move to voice extraction step
      setStep(4);
    } catch (err) {
      setError(err.message || "Failed to save personality");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    // Delete the persona if it was created but not completed
    if (createdPersonalityId) {
      try {
        await authFetch(`/api/personality/${createdPersonalityId}`, { method: "DELETE" });
      } catch (deleteErr) {
        console.error("Failed to delete persona when going back:", deleteErr);
      }
    }
    setStep(1);
    setAnalysis(null);
    setError(null);
    setCharacterConfirmation(null);
    setCreatedPersonalityId(null);
    setIsVoiceSampleModalOpen(false);
    setExtractedVoiceSamples(null);
  };

  const handleCancel = async () => {
    // Delete the persona if it was created but not completed
    if (createdPersonalityId) {
      try {
        await authFetch(`/api/personality/${createdPersonalityId}`, { method: "DELETE" });
      } catch (deleteErr) {
        console.error("Failed to delete persona on cancel:", deleteErr);
      }
    }
    onCancel?.();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="quick-creator-container">
        <div className="quick-creator-header">
          <h2>Quick Persona Creator</h2>
          <p>Create a persona in seconds with AI-powered analysis</p>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>1</div>
          <div className={`step-dot ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>2</div>
          <div className={`step-dot ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>3</div>
          <div className={`step-dot ${step >= 4 ? "active" : ""}`}>4</div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <div>
            <div className="form-field">
              <label>Persona Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setCharacterConfirmation(null);
                }}
                placeholder="e.g., Rick Sanchez"
              />
            </div>

            <div className="form-field">
              <label>Brief Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setCharacterConfirmation(null);
                }}
                placeholder="A short description of the persona..."
              />
            </div>

            <div className="form-field">
              <label>Supporting Links (optional, one per line)</label>
              <textarea
                value={formData.sourceUrls}
                onChange={(e) => {
                  setFormData({ ...formData, sourceUrls: e.target.value });
                  setCharacterConfirmation(null);
                }}
                placeholder="https://youtube.com/watch?v=..."
                style={{ minHeight: "80px" }}
              />
            </div>

            {characterConfirmation && (
              <div className="voice-preview-section" role="status" aria-live="polite">
                <div className="section-title">Confirm Character</div>
                <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.45 }}>
                  {characterConfirmation.confirmationPrompt}
                </p>
                <div className="action-bar" style={{ marginTop: 12 }}>
                  <button
                    className="secondary-button"
                    onClick={() => setCharacterConfirmation(null)}
                    disabled={isAnalyzing}
                  >
                    Edit Name
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => handleAnalyze({ confirm: true })}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Analyzing..." : `Confirm ${characterConfirmation.canonicalName}`}
                  </button>
                </div>
              </div>
            )}

            <div className="action-bar">
              <button className="secondary-button" onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Persona"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="loading-container">
            <div className="character-avatar" style={{ marginBottom: 14 }}>
              <AvatarCore
                personalitySeed={`draft:${formData.name}:${formData.description}`}
                likenessHint={analysis?.avatarLikenessHint || `${formData.name} ${formData.description}`}
                size={80}
              />
            </div>
            <div className="loading-spinner"></div>
            <div className="loading-text">Analyzing Persona</div>
            <div className="loading-subtext">Extracting traits, quirks, and voice patterns...</div>
            <div className="loading-progress" role="status" aria-live="polite">
              {ANALYZE_PROGRESS_STEPS.map((item, index) => {
                const stateClass = index < analysisProgressIndex
                  ? "done"
                  : index === analysisProgressIndex
                    ? "active"
                    : "";
                return (
                  <div key={item} className={`loading-progress-step ${stateClass}`.trim()}>
                    <span className="loading-progress-dot" />
                    <span>{item}</span>
                    <span>{index + 1}/{ANALYZE_PROGRESS_STEPS.length}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && analysis && (
          <div className="confirmation-screen">
            <div className="character-header">
              <div className="character-avatar">
                <AvatarCore
                  personality={{ name: analysis.name }}
                  personalitySeed={`analysis:${analysis.name}`}
                  likenessHint={analysis.avatarLikenessHint || `${analysis.name} ${analysis.description || ""}`}
                  size={80}
                />
              </div>
              <div className="character-info">
                <h3>{analysis.name}</h3>
                <p>{analysis.description || "No description provided"}</p>
              </div>
            </div>

            <div>
              <div className="section-title">Discovered Traits</div>
              <div className="tags-container">
                {(analysis.traits || []).map((trait, index) => (
                  <div key={index} className="tag">
                    {trait}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveTrait(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {customTraits.map((trait, index) => (
                  <div key={`custom-${index}`} className="tag">
                    {trait}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveTrait(index, true)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="tag-input-container">
                <input
                  type="text"
                  className="tag-input"
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTrait()}
                  placeholder="Add custom trait..."
                />
                <button className="tag-add-button" onClick={handleAddTrait}>
                  Add
                </button>
              </div>
            </div>

            <div>
              <div className="section-title">Discovered Quirks</div>
              <div className="tags-container">
                {(analysis.quirks || []).map((quirk, index) => (
                  <div key={index} className="tag">
                    {quirk}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveQuirk(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {customQuirks.map((quirk, index) => (
                  <div key={`custom-${index}`} className="tag">
                    {quirk}
                    <button
                      className="tag-remove"
                      onClick={() => handleRemoveQuirk(index, true)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="tag-input-container">
                <input
                  type="text"
                  className="tag-input"
                  value={newQuirk}
                  onChange={(e) => setNewQuirk(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddQuirk()}
                  placeholder="Add custom quirk..."
                />
                <button className="tag-add-button" onClick={handleAddQuirk}>
                  Add
                </button>
              </div>
            </div>

            <div>
              <div className="section-title">Sample Dialogue</div>
              <div className="dialogue-preview">
                {editableDialogue.map((line, index) => (
                  <div key={index} className="dialogue-line-editable">
                    <textarea
                      value={line}
                      onChange={(e) => {
                        const newDialogue = [...editableDialogue];
                        newDialogue[index] = e.target.value;
                        setEditableDialogue(newDialogue);
                      }}
                      className="dialogue-textarea"
                      placeholder="Sample dialogue line..."
                    />
                    <button
                      className="dialogue-remove"
                      onClick={() => {
                        const newDialogue = editableDialogue.filter((_, i) => i !== index);
                        setEditableDialogue(newDialogue);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="dialogue-add-button"
                  onClick={() => setEditableDialogue([...editableDialogue, ""])}
                >
                  + Add Dialogue Line
                </button>
              </div>
            </div>

            <div>
              <div className="section-title">Voice Preview</div>
              <div className="voice-preview-section">
                <div className="voice-preview-placeholder">
                  Voice will be extracted in the next step
                </div>
              </div>
            </div>

            <div className="action-bar">
              <button className="secondary-button" onClick={handleBack}>
                Back
              </button>
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Creating..." : "Create Persona & Extract Voice"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="character-header">
              <div className="character-avatar">
                <AvatarCore
                  personality={{ name: analysis.name }}
                  personalitySeed={`voice-step:${analysis.name}`}
                  likenessHint={analysis.avatarLikenessHint || `${analysis.name} ${analysis.description || ""}`}
                  size={80}
                />
              </div>
              <div className="character-info">
                <h3>{analysis.name}</h3>
                <p>Extract voice from YouTube</p>
              </div>
            </div>

            <div className="youtube-search-container">
              <label>Search YouTube for voice clips</label>
              <div className="youtube-search-input">
                <input
                  type="text"
                  value={youtubeQuery}
                  onChange={(e) => setYoutubeQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleYouTubeSearch()}
                  placeholder={`${analysis.name} voice clips interview`}
                />
                <button
                  className="youtube-search-button"
                  onClick={handleYouTubeSearch}
                  disabled={isSearchingYouTube}
                >
                  {isSearchingYouTube ? "Searching..." : "Search"}
                </button>
              </div>

              {youtubeResults.length > 0 && (
                <div className="video-results">
                  {youtubeResults.map((video) => (
                    <div
                      key={video.id}
                      className={`video-card ${selectedVideo?.id === video.id ? "selected" : ""}`}
                      onClick={() => extractVoiceFromVideo(video)}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="video-thumbnail"
                      />
                      <div className="video-info">
                        <div className="video-title">{video.title}</div>
                        <div className="video-id">{video.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {youtubeResults.length > 0 ? (
                <div className="video-hint">Click a thumbnail to open detected voice previews and choose the best match.</div>
              ) : null}
            </div>

            {isExtractingVoice && (
              <div className="extracting-voice">
                <div className="extracting-voice-text">Extracting Voice</div>
                <div className="extracting-voice-subtext">This may take a minute...</div>
              </div>
            )}

            <div className="action-bar">
              <button className="secondary-button" onClick={() => onCreated?.({ id: createdPersonalityId })}>
                Skip Voice
              </button>
              <button
                className="primary-button"
                onClick={handleExtractVoice}
                disabled={!selectedVideo || isExtractingVoice}
              >
                {isExtractingVoice ? "Extracting..." : "Extract from Selected"}
              </button>
            </div>
          </div>
        )}
      </div>

      {isVoiceSampleModalOpen ? (
        <div
          className="quick-modal-overlay"
          onClick={() => {
            if (!isExtractingVoice) {
              setIsVoiceSampleModalOpen(false);
            }
          }}
        >
          <div className="quick-modal" onClick={(event) => event.stopPropagation()}>
            <div className="quick-modal-header">
              <div>
                <h4>Prosody Extraction</h4>
                <p className="quick-modal-copy">
                  Track extraction progress, preview isolated voices, and choose the voice that best matches this persona.
                </p>
              </div>
              <button
                type="button"
                className="quick-modal-close"
                onClick={() => setIsVoiceSampleModalOpen(false)}
                disabled={isExtractingVoice}
              >
                Close
              </button>
            </div>

            {(isExtractingVoice || prosodyModalError) ? (
              <div className="quick-progress-panel">
                {PROSODY_PROGRESS_STEPS.map((item, index) => {
                  const stateClass = index < prosodyProgressIndex
                    ? "done"
                    : index === prosodyProgressIndex
                      ? "active"
                      : "";
                  return (
                    <div key={item} className={`quick-progress-step ${stateClass}`.trim()}>
                      <span className="quick-progress-dot" />
                      {item}
                    </div>
                  );
                })}
                {prosodyModalError ? (
                  <div className="loading-subtext" style={{ color: "#ff8d8d" }}>
                    {prosodyModalError}
                  </div>
                ) : null}
              </div>
            ) : null}

            {extractedVoiceSamples ? (
              <VoiceSampleSelector
                personality={{ id: createdPersonalityId, name: analysis?.name }}
                voiceSamples={extractedVoiceSamples}
                isLoading={isExtractingVoice}
                onSampleSelected={(updatedPersonality) => {
                  setIsVoiceSampleModalOpen(false);
                  onCreated?.(updatedPersonality || { id: createdPersonalityId });
                }}
                onStatus={({ type, message }) => {
                  if (type === "error") {
                    setError(message || "Voice sample confirmation failed.");
                  }
                }}
              />
            ) : !isExtractingVoice && !prosodyModalError ? (
              <div className="loading-subtext">No representative voices were detected from the source.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
