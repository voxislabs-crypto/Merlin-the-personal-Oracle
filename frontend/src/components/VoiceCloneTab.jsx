/**
 * VoiceCloneTab.jsx
 *
 * Voice cloning section inside the Voice Lab.
 * Two sub-modes:
 *   OpenVoice — zero-shot clone from a short reference clip (6–60s)
 *   Kokoro+RVC — link a pre-trained RVC voice pack as a post-processing layer on Kokoro
 *
 * Features:
 *   - File drop or YouTube URL input
 *   - SSE progress bar with step labels
 *   - "This may take up to 30 seconds" warning
 *   - Voice pack manager for RVC
 *   - User-initiated only (no auto-trigger)
 */

import { useEffect, useRef, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { trackedFetch } from "../utils/requestTracker.js";

const STEPS = {
  downloading: "Fetching audio…",
  received: "File received.",
  normalizing: "Normalizing audio…",
  registering: "Registering voice…",
  done: "Done.",
};

export default function VoiceCloneTab({ personality, onStatus }) {
  const authFetch = useAuthFetch();
  const personalityId = personality?.id;

  // ── Clone state ──────────────────────────────────────────────────────────
  const [cloneEngine, setCloneEngine] = useState("openvoice");
  const [source, setSource] = useState("url"); // "url" | "file"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [rvcPackId, setRvcPackId] = useState("");

  // ── Status ───────────────────────────────────────────────────────────────
  const [cloneStatus, setCloneStatus] = useState(null); // backend clone meta
  const [pipelineReady, setPipelineReady] = useState(null);
  const [openVoiceInstalled, setOpenVoiceInstalled] = useState(null);
  const [rvcInstalled, setRvcInstalled] = useState(null);

  // ── SSE progress ─────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { step, pct, message }
  const [progressDone, setProgressDone] = useState(null); // done/error message
  const sseRef = useRef(null);

  // ── RVC Packs ────────────────────────────────────────────────────────────
  const [rvcPacks, setRvcPacks] = useState([]);
  const [isUploadingPack, setIsUploadingPack] = useState(false);
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packModelFile, setPackModelFile] = useState(null);
  const [packIndexFile, setPackIndexFile] = useState(null);
  const [packSampleFile, setPackSampleFile] = useState(null);

  // ── File drag-drop ───────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef(null);

  // ── Load initial status ──────────────────────────────────────────────────
  useEffect(() => {
    if (!personalityId) return;
    loadStatus();
    loadRvcPacks();
  }, [personalityId]);

  async function loadStatus() {
    try {
      const res = await authFetch(`/api/personality/${personalityId}/voice-clone`);
      if (!res.ok) return;
      const data = await res.json();
      setCloneStatus(data);
      setPipelineReady(data.pipelineReady);
      setOpenVoiceInstalled(data.openVoiceInstalled);
      setRvcInstalled(data.rvcInstalled);
      if (data.cloneEngine) setCloneEngine(data.cloneEngine);
      if (data.cloneRvcPackId) setRvcPackId(String(data.cloneRvcPackId));
    } catch {
      // non-fatal — status panel just stays blank
    }
  }

  async function loadRvcPacks() {
    try {
      const res = await authFetch("/api/voice-clone/rvc-packs");
      if (!res.ok) return;
      const data = await res.json();
      setRvcPacks(data.packs || []);
    } catch {
      // non-fatal
    }
  }

  // ── Drag-drop handlers ───────────────────────────────────────────────────
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAudioFile(file);
      setSource("file");
    }
  }

  // ── Start clone pipeline ─────────────────────────────────────────────────
  async function startClone() {
    if (isRunning) return;
    setIsRunning(true);
    setProgress({ step: "start", pct: 0, message: "Starting pipeline…" });
    setProgressDone(null);

    const formData = new FormData();
    formData.append("engine", cloneEngine);
    formData.append("source", source);
    if (source === "url") formData.append("youtubeUrl", youtubeUrl);
    if (source === "file" && audioFile) formData.append("audio", audioFile);
    if (cloneEngine === "kokoro-rvc" && rvcPackId) formData.append("rvcPackId", rvcPackId);

    try {
      const { getToken } = window.__clerkAuthHelpers || {};
      const token = getToken ? await getToken() : null;
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await trackedFetch(`/api/personality/${personalityId}/voice-clone`, {
        method: "POST",
        headers,
        body: formData,
      }, {
        cause: `voice-clone:start:${cloneEngine}`,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        setProgressDone({ type: "error", message: err.error || "Request failed." });
        setIsRunning(false);
        return;
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventName = null;
        let dataLine = null;

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataLine = line.slice(6).trim();
          } else if (line === "" && eventName && dataLine) {
            try {
              const payload = JSON.parse(dataLine);
              handleSseEvent(eventName, payload);
            } catch {
              // skip malformed
            }
            eventName = null;
            dataLine = null;
          }
        }
      }
    } catch (err) {
      setProgressDone({ type: "error", message: String(err?.message || "Connection failed.") });
    } finally {
      setIsRunning(false);
      loadStatus();
    }
  }

  function handleSseEvent(event, payload) {
    if (event === "progress") {
      setProgress({ step: payload.step, pct: payload.pct, message: payload.message });
    } else if (event === "start") {
      setProgress({ step: "start", pct: 0, message: payload.message });
    } else if (event === "done") {
      setProgress({ step: "done", pct: 100, message: payload.message });
      setProgressDone({ type: "success", message: payload.message });
      onStatus?.({ type: "success", message: payload.message });
    } else if (event === "error") {
      setProgressDone({ type: "error", message: payload.message });
      setProgress(null);
    }
  }

  // ── Remove clone ──────────────────────────────────────────────────────────
  async function removeClone() {
    if (!confirm("Remove voice clone data for this persona?")) return;
    try {
      const res = await authFetch(`/api/personality/${personalityId}/voice-clone`, { method: "DELETE" });
      if (res.ok) {
        setCloneStatus(null);
        setProgress(null);
        setProgressDone(null);
        onStatus?.({ type: "info", message: "Voice clone data removed." });
      }
    } catch {
      // ignore
    }
  }

  // ── Upload RVC Pack ───────────────────────────────────────────────────────
  async function uploadRvcPack() {
    if (!packName.trim() || !packModelFile) {
      onStatus?.({ type: "warn", message: "Pack name and model (.pth) are required." });
      return;
    }
    setIsUploadingPack(true);
    try {
      const fd = new FormData();
      fd.append("name", packName.trim());
      fd.append("description", packDescription.trim());
      fd.append("model", packModelFile);
      if (packIndexFile) fd.append("index", packIndexFile);
      if (packSampleFile) fd.append("sample", packSampleFile);

      const { getToken } = window.__clerkAuthHelpers || {};
      const token = getToken ? await getToken() : null;
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await trackedFetch("/api/voice-clone/rvc-packs", {
        method: "POST",
        headers,
        body: fd,
      }, {
        cause: "voice-clone:upload-rvc-pack",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setPackName("");
      setPackDescription("");
      setPackModelFile(null);
      setPackIndexFile(null);
      setPackSampleFile(null);
      await loadRvcPacks();
      onStatus?.({ type: "success", message: `Voice pack "${data.pack.name}" registered.` });
    } catch (err) {
      onStatus?.({ type: "error", message: String(err?.message || err) });
    } finally {
      setIsUploadingPack(false);
    }
  }

  async function deleteRvcPack(packId, name) {
    if (!confirm(`Delete voice pack "${name}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/voice-clone/rvc-packs/${packId}`, { method: "DELETE" });
      if (res.ok) {
        await loadRvcPacks();
        onStatus?.({ type: "info", message: `Voice pack "${name}" deleted.` });
      }
    } catch {
      // ignore
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const activeCloneEngine = cloneStatus?.cloneEngine;
  const isCloneActive = Boolean(activeCloneEngine);
  const canStart =
    !isRunning &&
    ((source === "url" && youtubeUrl.trim()) ||
      (source === "file" && audioFile)) &&
    (cloneEngine !== "kokoro-rvc" || rvcPackId);

  return (
    <div className="vclone-root">
      <style>{cloneStyles}</style>

      {/* ── Active Clone Badge ──────────────────────────────────────────── */}
      {isCloneActive && (
        <div className="vclone-active-badge">
          <span className="vclone-active-dot" />
          <span>
            ACTIVE: {activeCloneEngine === "openvoice" ? "OpenVoice v2" : "Kokoro + RVC"}
            {activeCloneEngine === "kokoro-rvc" && cloneStatus?.cloneRvcPackId
              ? ` — Pack #${cloneStatus.cloneRvcPackId}`
              : ""}
          </span>
          <button className="vclone-remove-btn" onClick={removeClone} title="Remove clone">
            ✕ Remove
          </button>
        </div>
      )}

      {/* ── System Check ───────────────────────────────────────────────── */}
      {pipelineReady === false && (
        <div className="vclone-warn-banner">
          ⚠ Pipeline dependencies missing.
          {" "}
          {!cloneStatus?.pipeline?.ytdlp && <span>Install <code>yt-dlp</code>. </span>}
          {!cloneStatus?.pipeline?.ffmpeg && <span>Install <code>ffmpeg</code>. </span>}
          URL sources will not work until these are installed.
        </div>
      )}
      {openVoiceInstalled === false && cloneEngine === "openvoice" && (
        <div className="vclone-warn-banner">
          ⚠ OpenVoice v2 Python package not found. Run:
          {" "}
          <code>pip install git+https://github.com/myshell-ai/MeloTTS.git git+https://github.com/myshell-ai/OpenVoice.git</code>
        </div>
      )}
      {rvcInstalled === false && cloneEngine === "kokoro-rvc" && (
        <div className="vclone-warn-banner">
          ⚠ rvc-python not found. Run: <code>pip install rvc-python</code>
        </div>
      )}

      {/* ── Engine Selector ────────────────────────────────────────────── */}
      <div className="vclone-section">
        <div className="vlab-section-label">◈ CLONE ENGINE</div>
        <div className="vclone-engine-tabs">
          <button
            type="button"
            className={`vclone-engine-tab ${cloneEngine === "openvoice" ? "active" : ""}`}
            onClick={() => setCloneEngine("openvoice")}
          >
            <span className="vclone-tab-label">OpenVoice v2</span>
            <span className="vclone-tab-sub">Zero-shot · short clip · ~10–25s</span>
          </button>
          <button
            type="button"
            className={`vclone-engine-tab ${cloneEngine === "kokoro-rvc" ? "active" : ""}`}
            onClick={() => setCloneEngine("kokoro-rvc")}
          >
            <span className="vclone-tab-label">Kokoro + RVC</span>
            <span className="vclone-tab-sub">Voice pack · Kokoro base · ~5–15s</span>
          </button>
        </div>
      </div>

      {/* ── Source Input ───────────────────────────────────────────────── */}
      <div className="vclone-section">
        <div className="vlab-section-label">◈ REFERENCE SOURCE</div>
        <div className="vclone-source-tabs">
          <button
            type="button"
            className={`vclone-src-tab ${source === "url" ? "active" : ""}`}
            onClick={() => setSource("url")}
          >
            YouTube / URL
          </button>
          <button
            type="button"
            className={`vclone-src-tab ${source === "file" ? "active" : ""}`}
            onClick={() => setSource("file")}
          >
            Upload WAV / MP3
          </button>
          {cloneEngine === "kokoro-rvc" && (
            <button
              type="button"
              className={`vclone-src-tab ${source === "none" ? "active" : ""}`}
              onClick={() => setSource("none")}
            >
              Skip (pack only)
            </button>
          )}
        </div>

        {source === "url" && (
          <div className="vclone-url-row">
            <input
              type="text"
              className="vclone-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isRunning}
            />
            <small className="vlab-small">
              First 60 seconds will be extracted and normalized. Use a clip with clear speech.
            </small>
          </div>
        )}

        {source === "file" && (
          <div
            ref={dropRef}
            className={`vclone-drop-zone ${isDragging ? "dragging" : ""} ${audioFile ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("vclone-file-input")?.click()}
          >
            {audioFile ? (
              <>
                <span className="vclone-drop-icon">✓</span>
                <span className="vclone-drop-name">{audioFile.name}</span>
                <button
                  type="button"
                  className="vclone-drop-clear"
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span className="vclone-drop-icon">⬆</span>
                <span>Drop audio here or click to browse</span>
                <small>WAV, MP3, M4A, FLAC · Max 50 MB</small>
              </>
            )}
            <input
              id="vclone-file-input"
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files[0]) setAudioFile(e.target.files[0]); }}
            />
          </div>
        )}
      </div>

      {/* ── RVC Pack Selector (kokoro-rvc only) ────────────────────────── */}
      {cloneEngine === "kokoro-rvc" && (
        <div className="vclone-section">
          <div className="vlab-section-label">◈ VOICE PACK</div>
          {rvcPacks.length === 0 ? (
            <p className="vclone-no-packs">No voice packs registered yet. Upload one below.</p>
          ) : (
            <select
              className="vlab-select"
              value={rvcPackId}
              onChange={(e) => setRvcPackId(e.target.value)}
              disabled={isRunning}
            >
              <option value="">— Select a voice pack —</option>
              {rvcPacks.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}{p.description ? ` — ${p.description}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ── Start Button + Warning ─────────────────────────────────────── */}
      <div className="vclone-section vclone-action-row">
        <div className="vclone-time-warning">
          ⏱ This process may take up to 30 seconds. Please keep this window open.
        </div>
        <button
          type="button"
          className="vlab-btn"
          disabled={!canStart}
          onClick={() => void startClone()}
        >
          {isRunning ? "CLONING…" : "⟴ START VOICE CLONE"}
        </button>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      {(isRunning || progress) && (
        <div className="vclone-progress-wrap">
          <div className="vclone-progress-bar-track">
            <div
              className="vclone-progress-bar-fill"
              style={{ width: `${progress?.pct ?? 0}%` }}
            />
          </div>
          <div className="vclone-progress-label">
            {STEPS[progress?.step] || progress?.message || "Working…"}
          </div>
        </div>
      )}

      {/* ── Done / Error Message ───────────────────────────────────────── */}
      {progressDone && (
        <div className={`vclone-result ${progressDone.type}`}>
          {progressDone.type === "success" ? "✓ " : "✗ "}
          {progressDone.message}
        </div>
      )}

      {/* ── RVC Voice Pack Manager ─────────────────────────────────────── */}
      <div className="vclone-section vclone-pack-manager">
        <div className="vlab-section-label">◈ VOICE PACK MANAGER</div>

        {rvcPacks.length > 0 && (
          <div className="vclone-pack-list">
            {rvcPacks.map((p) => (
              <div key={p.id} className="vclone-pack-row">
                <div className="vclone-pack-info">
                  <span className="vclone-pack-name">{p.name}</span>
                  {p.description && <span className="vclone-pack-desc">{p.description}</span>}
                  <span className="vclone-pack-id">ID: {p.id}</span>
                </div>
                <button
                  type="button"
                  className="vclone-remove-btn small"
                  onClick={() => void deleteRvcPack(p.id, p.name)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="vclone-pack-upload">
          <div className="vlab-section-label" style={{ fontSize: "0.68rem", marginTop: "0.75rem" }}>
            Register New Pack
          </div>
          <div className="vclone-pack-fields">
            <input
              type="text"
              className="vclone-input"
              placeholder="Pack name (e.g. Morgan Freeman)"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              disabled={isUploadingPack}
            />
            <input
              type="text"
              className="vclone-input"
              placeholder="Description (optional)"
              value={packDescription}
              onChange={(e) => setPackDescription(e.target.value)}
              disabled={isUploadingPack}
            />
            <label className="vclone-file-label">
              <span>Model (.pth) *</span>
              <input
                type="file"
                accept=".pth"
                onChange={(e) => setPackModelFile(e.target.files[0] || null)}
                disabled={isUploadingPack}
              />
              {packModelFile && <span className="vclone-file-name">{packModelFile.name}</span>}
            </label>
            <label className="vclone-file-label">
              <span>Index (.index, optional)</span>
              <input
                type="file"
                accept=".index"
                onChange={(e) => setPackIndexFile(e.target.files[0] || null)}
                disabled={isUploadingPack}
              />
              {packIndexFile && <span className="vclone-file-name">{packIndexFile.name}</span>}
            </label>
            <label className="vclone-file-label">
              <span>Sample audio (optional)</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setPackSampleFile(e.target.files[0] || null)}
                disabled={isUploadingPack}
              />
              {packSampleFile && <span className="vclone-file-name">{packSampleFile.name}</span>}
            </label>
          </div>
          <button
            type="button"
            className="vlab-btn sec"
            disabled={isUploadingPack || !packName.trim() || !packModelFile}
            onClick={() => void uploadRvcPack()}
            style={{ marginTop: "0.5rem" }}
          >
            {isUploadingPack ? "UPLOADING…" : "⬆ REGISTER PACK"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cloneStyles = `
  .vclone-root {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .vclone-section {
    padding: 1rem 1.25rem 0.5rem;
  }

  .vclone-action-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
  }

  /* ── Active badge ── */
  .vclone-active-badge {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0.75rem 1.25rem 0;
    padding: 0.45rem 0.75rem;
    border: 1px solid rgba(74, 222, 128, 0.35);
    border-radius: 8px;
    background: rgba(74, 222, 128, 0.07);
    font-size: 0.72rem;
    color: #4ade80;
    letter-spacing: 0.04em;
  }

  .vclone-active-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    animation: vlab-pulse-ring 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  .vclone-active-badge span:nth-child(2) {
    flex: 1;
  }

  /* ── Warning banner ── */
  .vclone-warn-banner {
    margin: 0.6rem 1.25rem 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(251, 191, 36, 0.35);
    border-radius: 8px;
    background: rgba(251, 191, 36, 0.07);
    font-size: 0.71rem;
    color: #fbbf24;
    line-height: 1.5;
  }

  .vclone-warn-banner code {
    background: rgba(255,255,255,0.07);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }

  /* ── Engine tabs ── */
  .vclone-engine-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
    margin-top: 0.5rem;
  }

  .vclone-engine-tab {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    padding: 0.65rem 0.85rem;
    border: 1px solid rgba(0, 180, 255, 0.18);
    border-radius: 10px;
    background: rgba(0, 180, 255, 0.04);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .vclone-engine-tab:hover {
    border-color: rgba(0, 200, 255, 0.4);
    background: rgba(0, 180, 255, 0.08);
  }

  .vclone-engine-tab.active {
    border-color: rgba(0, 200, 255, 0.65);
    background: rgba(0, 180, 255, 0.13);
  }

  .vclone-tab-label {
    font-size: 0.78rem;
    color: #e0f2ff;
    letter-spacing: 0.03em;
  }

  .vclone-engine-tab.active .vclone-tab-label {
    color: #7df9ff;
  }

  .vclone-tab-sub {
    font-size: 0.63rem;
    color: rgba(160, 200, 220, 0.6);
  }

  /* ── Source tabs ── */
  .vclone-source-tabs {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
    margin-bottom: 0.6rem;
    flex-wrap: wrap;
  }

  .vclone-src-tab {
    padding: 0.3rem 0.75rem;
    border: 1px solid rgba(0, 180, 255, 0.18);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 0.72rem;
    color: rgba(160, 200, 220, 0.7);
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .vclone-src-tab:hover,
  .vclone-src-tab.active {
    border-color: rgba(0, 200, 255, 0.55);
    background: rgba(0, 180, 255, 0.09);
    color: #7df9ff;
  }

  /* ── URL input ── */
  .vclone-url-row {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .vclone-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 180, 255, 0.22);
    border-radius: 8px;
    padding: 0.45rem 0.7rem;
    color: #cce8ff;
    font-size: 0.8rem;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .vclone-input:focus {
    border-color: rgba(0, 200, 255, 0.55);
  }

  .vclone-input:disabled {
    opacity: 0.5;
  }

  /* ── Drop zone ── */
  .vclone-drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 1.25rem 1rem;
    border: 1.5px dashed rgba(0, 180, 255, 0.3);
    border-radius: 10px;
    background: rgba(0, 120, 200, 0.04);
    cursor: pointer;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(160, 200, 230, 0.65);
    transition: border-color 0.15s, background 0.15s;
  }

  .vclone-drop-zone:hover,
  .vclone-drop-zone.dragging {
    border-color: rgba(0, 200, 255, 0.6);
    background: rgba(0, 180, 255, 0.08);
  }

  .vclone-drop-zone.has-file {
    flex-direction: row;
    justify-content: center;
    border-color: rgba(74, 222, 128, 0.45);
    background: rgba(74, 222, 128, 0.04);
    color: #4ade80;
  }

  .vclone-drop-icon {
    font-size: 1.4rem;
  }

  .vclone-drop-name {
    font-size: 0.78rem;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vclone-drop-clear {
    background: none;
    border: none;
    color: rgba(248, 113, 113, 0.8);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0.15rem 0.4rem;
  }

  /* ── Time warning ── */
  .vclone-time-warning {
    font-size: 0.7rem;
    color: rgba(251, 191, 36, 0.75);
    padding: 0.3rem 0;
  }

  /* ── Progress ── */
  .vclone-progress-wrap {
    margin: 0.25rem 1.25rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .vclone-progress-bar-track {
    height: 4px;
    background: rgba(0, 180, 255, 0.12);
    border-radius: 4px;
    overflow: hidden;
  }

  .vclone-progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #00b4ff, #7df9ff);
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  .vclone-progress-label {
    font-size: 0.7rem;
    color: rgba(160, 220, 240, 0.7);
  }

  /* ── Result ── */
  .vclone-result {
    margin: 0.25rem 1.25rem 0.5rem;
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    font-size: 0.73rem;
  }

  .vclone-result.success {
    border: 1px solid rgba(74, 222, 128, 0.4);
    background: rgba(74, 222, 128, 0.07);
    color: #4ade80;
  }

  .vclone-result.error {
    border: 1px solid rgba(248, 113, 113, 0.4);
    background: rgba(248, 113, 113, 0.07);
    color: #f87171;
  }

  /* ── No packs ── */
  .vclone-no-packs {
    font-size: 0.73rem;
    color: rgba(160, 200, 220, 0.5);
    margin: 0.4rem 0;
  }

  /* ── Pack list ── */
  .vclone-pack-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.5rem;
  }

  .vclone-pack-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.65rem;
    border: 1px solid rgba(0, 180, 255, 0.14);
    border-radius: 8px;
    background: rgba(0, 100, 160, 0.06);
  }

  .vclone-pack-info {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .vclone-pack-name {
    font-size: 0.76rem;
    color: #cce8ff;
    font-weight: 500;
  }

  .vclone-pack-desc {
    font-size: 0.67rem;
    color: rgba(160, 200, 220, 0.55);
  }

  .vclone-pack-id {
    font-size: 0.62rem;
    color: rgba(100, 160, 190, 0.45);
    font-variant-numeric: tabular-nums;
  }

  /* ── Pack upload ── */
  .vclone-pack-fields {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-top: 0.4rem;
  }

  .vclone-file-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.73rem;
    color: rgba(160, 210, 230, 0.7);
    cursor: pointer;
  }

  .vclone-file-label span:first-child {
    min-width: 150px;
  }

  .vclone-file-name {
    font-size: 0.68rem;
    color: #7df9ff;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Buttons ── */
  .vclone-remove-btn {
    background: none;
    border: 1px solid rgba(248, 113, 113, 0.35);
    border-radius: 5px;
    color: rgba(248, 113, 113, 0.75);
    cursor: pointer;
    font-size: 0.68rem;
    padding: 0.2rem 0.5rem;
    transition: border-color 0.15s, color 0.15s;
  }

  .vclone-remove-btn:hover {
    border-color: #f87171;
    color: #f87171;
  }

  .vclone-remove-btn.small {
    padding: 0.15rem 0.4rem;
    font-size: 0.62rem;
  }
`;
