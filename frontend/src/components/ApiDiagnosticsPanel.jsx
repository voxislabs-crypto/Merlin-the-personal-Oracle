import { useEffect, useRef, useState } from "react";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { trackedFetch } from "../utils/requestTracker.js";

const styles = `
  .diag-shell {
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 28px;
    background: linear-gradient(170deg, rgba(0, 4, 14, 0.8), rgba(2, 5, 18, 0.75));
    backdrop-filter: blur(24px);
    padding: 24px;
    margin-bottom: 24px;
    display: grid;
    gap: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }

  .diag-shell h3 {
    margin: 0;
    color: #4effd8;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    opacity: 0.8;
  }

  .diag-shell p {
    margin: 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .diag-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .diag-actions button {
    border: 1px solid rgba(78, 255, 216, 0.3);
    border-radius: 14px;
    background: rgba(78, 255, 216, 0.1);
    color: #4effd8;
    padding: 10px 20px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .diag-actions button:hover:not(:disabled) {
    background: rgba(78, 255, 216, 0.15);
    border-color: rgba(78, 255, 216, 0.4);
    transform: translateY(-1px);
  }

  .diag-actions button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .diag-grid {
    display: grid;
    gap: 12px;
  }

  .diag-row {
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.02);
    padding: 14px 18px;
    display: grid;
    gap: 8px;
    font-size: 0.85rem;
    transition: all 0.3s ease;
  }

  .diag-row.ok {
    border-color: rgba(78, 255, 216, 0.2);
    background: rgba(78, 255, 216, 0.03);
  }

  .diag-row.warn {
    border-color: rgba(255, 195, 80, 0.2);
    background: rgba(255, 195, 80, 0.03);
  }

  .diag-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    color: rgba(255, 255, 255, 0.9);
  }

  .diag-main strong {
    font-weight: 600;
  }

  .diag-code {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 8px;
    border-radius: 8px;
  }

  .diag-detail {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    word-break: break-all;
    white-space: pre-wrap;
    font-family: "JetBrains Mono", monospace;
    opacity: 0.8;
  }
`;

function compact(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 220 ? `${text.slice(0, 219)}...` : text;
}

export default function ApiDiagnosticsPanel({ onStatus, autoRunToken = 0 }) {
  const authFetch = useAuthFetch();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const lastAutoRunTokenRef = useRef(0);

  async function runSingle({ id, label, withAuth }) {
    const started = performance.now();
    try {
      const response = withAuth
        ? await authFetch(id, { __voxisCause: `api-diagnostics:${id}` })
        : await trackedFetch(id, { credentials: "include" }, { cause: `api-diagnostics:${id}` });
      const ms = Math.round(performance.now() - started);
      let payload = "";
      try {
        const data = await response.json();
        payload = compact(JSON.stringify(data));
      } catch {
        payload = compact(await response.text());
      }

      return {
        id,
        label,
        ok: response.ok,
        status: response.status,
        ms,
        payload,
      };
    } catch (error) {
      const ms = Math.round(performance.now() - started);
      return {
        id,
        label,
        ok: false,
        status: 0,
        ms,
        payload: compact(error?.message || "Network/unknown error"),
      };
    }
  }

  async function runDiagnostics() {
    setRunning(true);
    try {
      const checks = [
        { id: "/health", label: "Backend health", withAuth: false },
        { id: "/health/tts", label: "TTS health", withAuth: false },
        { id: "/me", label: "Auth /me", withAuth: true },
        { id: "/personalities", label: "Auth /personalities", withAuth: true },
      ];

      const next = [];
      for (const check of checks) {
        // Run sequentially so the order is deterministic for support screenshots.
        // eslint-disable-next-line no-await-in-loop
        next.push(await runSingle(check));
      }

      setResults(next);

      const health = next.find((item) => item.id === "/health");
      const ttsHealth = next.find((item) => item.id === "/health/tts");
      const me = next.find((item) => item.id === "/me");

      if (!health?.ok) {
        onStatus?.({ type: "error", message: "Backend health check failed. This is likely PM2/Nginx upstream, not Clerk." });
      } else if (ttsHealth && !ttsHealth.ok) {
        onStatus?.({ type: "error", message: "TTS health failed. Check optional engine install state and backend logs." });
      } else if (health.ok && me && me.status === 401) {
        onStatus?.({ type: "error", message: "Auth failed: check Clerk live/test key pairing in backend and frontend env." });
      } else if (next.every((item) => item.ok)) {
        onStatus?.({ type: "success", message: "Diagnostics passed: backend, TTS, and auth routes are reachable." });
      }
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    const nextToken = Number(autoRunToken || 0);
    if (nextToken <= 0 || nextToken === lastAutoRunTokenRef.current) {
      return;
    }

    lastAutoRunTokenRef.current = nextToken;
    void runDiagnostics();
  }, [autoRunToken]);

  return (
    <div className="diag-shell">
      <style>{styles}</style>
      <h3>Connectivity Diagnostics</h3>
      <p>
        Runs quick checks against <strong>/health</strong>, <strong>/me</strong>, and <strong>/personalities</strong>
        to separate backend-upstream issues from auth configuration issues.
      </p>
      <div className="diag-actions">
        <button type="button" onClick={() => void runDiagnostics()} disabled={running}>
          {running ? "Running diagnostics..." : "Run diagnostics"}
        </button>
      </div>
      {results.length ? (
        <div className="diag-grid">
          {results.map((result) => (
            <div
              key={result.id}
              className={`diag-row ${result.ok ? "ok" : result.status >= 500 || result.status === 0 ? "warn" : ""}`}
            >
              <div className="diag-main">
                <strong>{result.label}</strong>
                <span className="diag-code">{result.id} · {result.status || "ERR"} · {result.ms}ms</span>
              </div>
              <div className="diag-detail">{result.payload || "No body"}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
