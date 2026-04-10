import { useMemo, useRef, useEffect } from "react";
import "./BrainTab.css";
import "../styles/futuristic-ui-kit.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Map a VAD value (-1…1) to a 0…100 percentage for bar widths. */
function vadToPercent(v) {
  return Math.round(((clamp(v ?? 0, -1, 1) + 1) / 2) * 100);
}

function fmtVad(v) {
  return (v >= 0 ? "+" : "") + Number(v ?? 0).toFixed(3);
}

function fmtScore(s) {
  if (s === null || s === undefined) return "—";
  return Number(s).toFixed(3);
}

function fmtTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ─── sub-panels ──────────────────────────────────────────────────────────────

function MoodPanel({ moodEvent }) {
  if (!moodEvent?.mood) {
    return (
      <section className="bt-panel bt-mood-panel futuristic-card holo-border scanline">
        <h3 className="bt-panel-title">Mood</h3>
        <p className="bt-empty-hint">Waiting for mood data…</p>
      </section>
    );
  }

  const { valence, arousal, dominance, label } = moodEvent.mood;

  const bars = [
    {
      key: "V",
      label: "Valence",
      value: valence,
      colorClass: valence >= 0.1 ? "bt-bar-green" : valence <= -0.1 ? "bt-bar-red" : "bt-bar-amber",
    },
    {
      key: "A",
      label: "Arousal",
      value: arousal,
      colorClass: arousal >= 0.3 ? "bt-bar-orange" : "bt-bar-blue",
    },
    {
      key: "D",
      label: "Dominance",
      value: dominance,
      colorClass: dominance >= 0.2 ? "bt-bar-purple" : "bt-bar-gold",
    },
  ];

  return (
    <section className="bt-panel bt-mood-panel futuristic-card holo-border scanline">
      <h3 className="bt-panel-title">Mood</h3>
      {label && <span className="bt-mood-label">{label}</span>}
      <div className="bt-vad-rows">
        {bars.map(({ key, label: barLabel, value, colorClass }) => (
          <div key={key} className="bt-vad-row">
            <span className="bt-vad-axis">{key}</span>
            <span className="bt-vad-value">{fmtVad(value)}</span>
            <div className="bt-bar-track">
              {/* midpoint marker */}
              <div className="bt-bar-mid" />
              <div
                className={`bt-bar-fill ${colorClass}`}
                style={{ width: `${vadToPercent(value)}%` }}
              />
            </div>
            <span className="bt-vad-axis-label">{barLabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function NarrativeFeed({ events }) {
  const feedRef = useRef(null);

  // Auto-scroll to top when new events arrive (newest first display)
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events.length]);

  if (events.length === 0) {
    return (
      <section className="bt-panel bt-narrative-panel futuristic-card holo-border scanline">
        <h3 className="bt-panel-title">Narrative Feed</h3>
        <p className="bt-empty-hint">Step-by-step events will appear here during generation.</p>
      </section>
    );
  }

  const stageIcons = {
    mood_update: "◈",
    memory_retrieval: "◎",
    intent_selection: "◆",
    prompt_assembly: "⬡",
    response_generation: "▶",
  };

  return (
    <section className="bt-panel bt-narrative-panel futuristic-card holo-border scanline">
      <h3 className="bt-panel-title">Narrative Feed</h3>
      <ol className="bt-narrative-list" ref={feedRef}>
        {[...events].reverse().map((ev, i) => (
          <li key={events.length - 1 - i} className="bt-narrative-item">
            <span className="bt-stage-icon">{stageIcons[ev.stage] ?? "·"}</span>
            <span className="bt-narrative-text">{ev.narrative}</span>
            <span className="bt-narrative-ts">{fmtTimestamp(ev.timestamp)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MemoryPanel({ memoryEvent }) {
  if (!memoryEvent?.memories?.length) {
    return (
      <section className="bt-panel bt-memory-panel futuristic-card holo-border scanline">
        <h3 className="bt-panel-title">Memory Retrieval</h3>
        <p className="bt-empty-hint">No memories retrieved yet.</p>
      </section>
    );
  }

  return (
    <section className="bt-panel bt-memory-panel futuristic-card holo-border scanline">
      <h3 className="bt-panel-title">Memory Retrieval</h3>
      <ul className="bt-memory-list">
        {memoryEvent.memories.map((mem, i) => {
          const isAnchor = mem.reason === "anchor";
          const scorePercent = mem.score !== null
            ? Math.round(clamp(mem.score, 0, 1) * 100)
            : null;

          return (
            <li key={mem.id ?? i} className={`bt-memory-item ${isAnchor ? "bt-anchor" : ""}`}>
              <div className="bt-memory-top">
                <span className={`bt-mem-badge ${isAnchor ? "bt-badge-anchor" : "bt-badge-type"}`}>
                  {isAnchor ? "⚓ anchor" : mem.reason || "context"}
                </span>
                <span className="bt-mem-score">
                  {scorePercent !== null ? `${scorePercent}%` : "—"}
                </span>
              </div>
              {scorePercent !== null && (
                <div className="bt-bar-track bt-mem-score-bar">
                  <div
                    className="bt-bar-fill bt-bar-cyan"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              )}
              <p className="bt-memory-content">{truncate(mem.content, 120)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function IntentPanel({ intentEvent }) {
  if (!intentEvent?.activeIntent) {
    return (
      <section className="bt-panel bt-intent-panel futuristic-card holo-border scanline">
        <h3 className="bt-panel-title">Active Intent</h3>
        <p className="bt-empty-hint">No active goal selected.</p>
      </section>
    );
  }

  const scores = intentEvent.intentScores ?? {};
  const maxScore = Math.max(1, ...Object.values(scores));

  return (
    <section className="bt-panel bt-intent-panel futuristic-card holo-border scanline">
      <h3 className="bt-panel-title">Active Intent</h3>
      <p className="bt-active-intent">{intentEvent.activeIntent}</p>
      {Object.keys(scores).length > 0 && (
        <div className="bt-intent-scores">
          <p className="bt-scores-label">Goal scores</p>
          {Object.entries(scores).map(([goal, score]) => {
            const pct = Math.round((score / maxScore) * 100);
            const isActive = goal === intentEvent.activeIntent.slice(0, 60);
            return (
              <div key={goal} className={`bt-score-row ${isActive ? "bt-score-active" : ""}`}>
                <span className="bt-score-goal">{truncate(goal, 55)}</span>
                <div className="bt-bar-track">
                  <div
                    className={`bt-bar-fill ${isActive ? "bt-bar-cyan" : "bt-bar-dim"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="bt-score-val">{score}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PromptBudgetPanel({ promptEvent }) {
  if (!promptEvent?.tokenUsage) {
    return (
      <section className="bt-panel bt-budget-panel futuristic-card holo-border scanline">
        <h3 className="bt-panel-title">Prompt Budget</h3>
        <p className="bt-empty-hint">Awaiting prompt assembly…</p>
      </section>
    );
  }

  const { charBudget, charCount, approxTokens, utilization } = promptEvent.tokenUsage;
  const utilPct = Math.round(clamp(utilization ?? 0, 0, 1) * 100);
  const barClass =
    utilPct >= 90 ? "bt-bar-red" : utilPct >= 70 ? "bt-bar-amber" : "bt-bar-green";

  return (
    <section className="bt-panel bt-budget-panel futuristic-card holo-border scanline">
      <h3 className="bt-panel-title">Prompt Budget</h3>
      <div className="bt-budget-row">
        <span className="bt-budget-label">Utilization</span>
        <span className="bt-budget-value">{utilPct}%</span>
      </div>
      <div className="bt-bar-track">
        <div className={`bt-bar-fill ${barClass}`} style={{ width: `${utilPct}%` }} />
      </div>
      <div className="bt-budget-meta">
        <span>{charCount.toLocaleString()} / {charBudget.toLocaleString()} chars</span>
        <span>~{approxTokens.toLocaleString()} tokens</span>
      </div>
    </section>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

/**
 * BrainTab — read-only live telemetry dashboard.
 *
 * Props:
 *   brainEvents  – array of BrainTelemetryEvent objects accumulated during the
 *                  current/last chat turn (comes from liveChatState[id].brainEvents)
 *   personality  – the selected personality object (for name display)
 *   livePhase    – current SSE phase string (used for the status indicator)
 */
export default function BrainTab({ brainEvents = [], personality, livePhase }) {
  const isLive = Boolean(livePhase && livePhase !== "reply-complete");

  // Pick the latest event of each stage
  const latest = useMemo(() => {
    const map = {};
    for (const ev of brainEvents) {
      map[ev.stage] = ev;
    }
    return map;
  }, [brainEvents]);

  const hasAny = brainEvents.length > 0;

  return (
    <div className="brain-tab voxis-futuristic-root">
      <div className="bt-header">
        <h2 className="bt-title">
          Brain
          {personality?.name ? <span className="bt-pers-name"> — {personality.name}</span> : null}
        </h2>
        <div className="bt-status-row">
          {isLive ? (
            <span className="bt-status bt-status-live">
              <span className="bt-pulse" />
              {livePhase.replace(/_/g, " ")}
            </span>
          ) : (
            <span className="bt-status bt-status-idle">
              {hasAny ? "Ready" : "Idle"}
            </span>
          )}
        </div>
      </div>

      {!hasAny ? (
        <div className="bt-empty">
          <p className="bt-empty-main">Send a message to see the brain at work.</p>
          <p className="bt-empty-sub">
            Keep this tab in view while chatting — it updates live during generation.
          </p>
        </div>
      ) : (
        <div className="bt-grid">
          {/* Priority 1: Mood */}
          <MoodPanel moodEvent={latest["mood_update"]} />

          {/* Priority 2: Narrative Feed */}
          <NarrativeFeed events={brainEvents} />

          {/* Priority 3: Memory */}
          <MemoryPanel memoryEvent={latest["memory_retrieval"]} />

          {/* Priority 4: Intent */}
          <IntentPanel intentEvent={latest["intent_selection"]} />

          {/* Prompt Budget */}
          <PromptBudgetPanel promptEvent={latest["prompt_assembly"]} />
        </div>
      )}
    </div>
  );
}
