'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'baseline' | 'stable' | 'trusted' | 'adaptive' | 'autonomous';

type ModelSnapshot = {
  modelId: string;
  phase: Phase;
  trustScore: number;
  hallucinationRate: number;
  responseCoherence: number;
  emotionalConsistency: number;
  driftScore: number;
  rollbackTriggered: boolean;
};

type GateCheck = {
  key: string;
  pass: boolean;
};

type TimelineEvent = {
  ts: string;
  text: string;
  level: 'info' | 'success' | 'warning' | 'danger';
};

type SnapshotResponse = {
  success: boolean;
  data: {
    metrics: ModelSnapshot;
    gateChecks: GateCheck[];
    timeline: TimelineEvent[];
    schemaStatus: {
      scorecard: boolean;
      phaseGate: boolean;
      rollbackEvent: boolean;
      trustCalibration: boolean;
    };
  };
};

type ReplayResponse = {
  success: boolean;
  data: {
    scenario: string;
    availableScenarios: string[];
    timeline: TimelineEvent[];
    latest: {
      phaseGate?: {
        metrics?: Partial<ModelSnapshot>;
        currentPhase?: Phase;
      };
    } | null;
  };
};

type TrendResponse = {
  success: boolean;
  data: {
    summary: {
      trustSamples: number;
      rollbackCount: number;
      latestTrustScore: number | null;
      trustDelta: number | null;
    };
    trustSeries: Array<{
      ts: string;
      trustScore: number;
    }>;
  };
};

const PHASE_ORDER: Phase[] = ['baseline', 'stable', 'trusted', 'adaptive', 'autonomous'];

const FALLBACK_SNAPSHOT: ModelSnapshot = {
  modelId: 'voxis-luna-v0.4',
  phase: 'trusted',
  trustScore: 0.91,
  hallucinationRate: 0.03,
  responseCoherence: 0.9,
  emotionalConsistency: 0.88,
  driftScore: 0.16,
  rollbackTriggered: false,
};

const FALLBACK_GATE_CHECKS: GateCheck[] = [
  { key: 'dataReadiness', pass: true },
  { key: 'offlineUplift', pass: true },
  { key: 'shadowSafety', pass: true },
  { key: 'transparency', pass: true },
  { key: 'rollbackReadiness', pass: true },
];

const FALLBACK_EVENTS: TimelineEvent[] = [
  { ts: '2026-05-28T07:20:00Z', text: 'Daily scorecard generated', level: 'info' },
  { ts: '2026-05-28T10:40:00Z', text: 'Trust score crossed 0.90 in primary cohort', level: 'success' },
  { ts: '2026-05-28T12:15:00Z', text: 'Drift detector check passed', level: 'success' },
  { ts: '2026-05-28T15:30:00Z', text: 'No rollback trigger conditions met', level: 'info' },
] as const;

export function OpsControlCenterClient() {
  const [snapshot, setSnapshot] = useState<ModelSnapshot>(FALLBACK_SNAPSHOT);
  const [gateChecks, setGateChecks] = useState<GateCheck[]>(FALLBACK_GATE_CHECKS);
  const [events, setEvents] = useState<TimelineEvent[]>(FALLBACK_EVENTS);
  const [schemaStatus, setSchemaStatus] = useState({
    scorecard: true,
    phaseGate: true,
    rollbackEvent: true,
    trustCalibration: true,
  });
  const [loading, setLoading] = useState(true);
  const [replayLoading, setReplayLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState('live');
  const [availableScenarios, setAvailableScenarios] = useState<string[]>([]);
  const [trendSummary, setTrendSummary] = useState<{ trustSamples: number; rollbackCount: number; latestTrustScore: number | null; trustDelta: number | null } | null>(null);
  const [trustTrend, setTrustTrend] = useState<Array<{ ts: string; trustScore: number }>>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const focusedEventRef = useRef<HTMLDivElement | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/internal/ops/snapshot', { cache: 'no-store' });
      const result = (await response.json()) as SnapshotResponse & { error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load ops snapshot');
      }

      setSnapshot(result.data.metrics);
      setGateChecks(result.data.gateChecks.length ? result.data.gateChecks : FALLBACK_GATE_CHECKS);
      setEvents(result.data.timeline.length ? result.data.timeline : FALLBACK_EVENTS);
      setSchemaStatus(result.data.schemaStatus);

      try {
        const trendResponse = await fetch('/api/internal/ops/trends', { cache: 'no-store' });
        const trendResult = (await trendResponse.json()) as TrendResponse & { error?: string };
        if (trendResponse.ok && trendResult.success) {
          setTrendSummary(trendResult.data.summary);
          setTrustTrend(trendResult.data.trustSeries || []);
        }
      } catch {
        // Trend panel is optional and should not block primary dashboard.
      }

      try {
        const replayResponse = await fetch('/api/internal/ops/replay?scenario=healthy', { cache: 'no-store' });
        const replayResult = (await replayResponse.json()) as ReplayResponse & { error?: string };
        if (replayResponse.ok && replayResult.success) {
          setAvailableScenarios(replayResult.data.availableScenarios || []);
        }
      } catch {
        // Replay selector can remain empty if report index is unavailable.
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load ops snapshot');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReplay = useCallback(async (selectedScenario: string) => {
    setReplayLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/internal/ops/replay?scenario=${encodeURIComponent(selectedScenario)}`, {
        cache: 'no-store',
      });
      const result = (await response.json()) as ReplayResponse & { error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load replay scenario');
      }

      setAvailableScenarios(result.data.availableScenarios || []);
      setEvents(result.data.timeline.length ? result.data.timeline : FALLBACK_EVENTS);
      setPlaybackIndex(Math.max(0, (result.data.timeline.length || 1) - 1));
      setIsPlaying(false);

      const replayMetrics = result.data.latest?.phaseGate?.metrics;
      const replayPhase = result.data.latest?.phaseGate?.currentPhase;
      if (replayMetrics || replayPhase) {
        setSnapshot((prev) => ({
          ...prev,
          phase: replayPhase || prev.phase,
          trustScore: typeof replayMetrics?.trustScore === 'number' ? replayMetrics.trustScore : prev.trustScore,
          hallucinationRate:
            typeof replayMetrics?.hallucinationRate === 'number' ? replayMetrics.hallucinationRate : prev.hallucinationRate,
          responseCoherence:
            typeof replayMetrics?.responseCoherence === 'number' ? replayMetrics.responseCoherence : prev.responseCoherence,
          emotionalConsistency:
            typeof replayMetrics?.emotionalConsistency === 'number' ? replayMetrics.emotionalConsistency : prev.emotionalConsistency,
          driftScore: typeof replayMetrics?.driftScore === 'number' ? replayMetrics.driftScore : prev.driftScore,
          rollbackTriggered: result.data.timeline.some((event) => event.level === 'danger'),
        }));
      }
    } catch (replayError) {
      setError(replayError instanceof Error ? replayError.message : 'Replay loading failed');
    } finally {
      setReplayLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (scenario === 'live' || !isPlaying || events.length <= 1) return;

    const timer = window.setInterval(() => {
      setPlaybackIndex((current) => {
        if (current >= events.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, Math.max(250, Math.round(900 / playbackSpeed)));

    return () => {
      window.clearInterval(timer);
    };
  }, [scenario, isPlaying, events.length, playbackSpeed]);

  useEffect(() => {
    if (scenario === 'live') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsPlaying(false);
        setPlaybackIndex((idx) => Math.max(0, idx - 1));
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIsPlaying(false);
        setPlaybackIndex((idx) => Math.min(events.length - 1, idx + 1));
      }

      if (event.key === ' ') {
        event.preventDefault();
        setIsPlaying((state) => !state);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [scenario, events.length]);

  const focusedEvent = useMemo(() => {
    if (scenario === 'live') return null;
    return events[playbackIndex] || null;
  }, [scenario, events, playbackIndex]);

  const playbackSnapshot = useMemo(() => {
    if (!focusedEvent) return snapshot;

    const impact =
      focusedEvent.level === 'danger'
        ? { trust: -0.18, drift: +0.22, coherence: -0.14, emotion: -0.1, hallucination: +0.15, rollback: true }
        : focusedEvent.level === 'warning'
          ? { trust: -0.08, drift: +0.12, coherence: -0.08, emotion: -0.05, hallucination: +0.06, rollback: snapshot.rollbackTriggered }
          : focusedEvent.level === 'success'
            ? { trust: +0.05, drift: -0.06, coherence: +0.04, emotion: +0.04, hallucination: -0.04, rollback: snapshot.rollbackTriggered }
            : { trust: 0, drift: 0, coherence: 0, emotion: 0, hallucination: 0, rollback: snapshot.rollbackTriggered };

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

    return {
      ...snapshot,
      trustScore: clamp01(snapshot.trustScore + impact.trust),
      driftScore: clamp01(snapshot.driftScore + impact.drift),
      responseCoherence: clamp01(snapshot.responseCoherence + impact.coherence),
      emotionalConsistency: clamp01(snapshot.emotionalConsistency + impact.emotion),
      hallucinationRate: clamp01(snapshot.hallucinationRate + impact.hallucination),
      rollbackTriggered: impact.rollback,
    };
  }, [focusedEvent, snapshot]);

  const visibleEvents = useMemo(() => {
    if (scenario === 'live') return events;
    if (events.length === 0) return events;
    return events.slice(0, Math.min(events.length, playbackIndex + 1));
  }, [scenario, events, playbackIndex]);

  useEffect(() => {
    if (scenario === 'live') return;
    if (!focusedEventRef.current) return;

    focusedEventRef.current.scrollIntoView({
      behavior: isPlaying ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [scenario, playbackIndex, isPlaying]);

  const displayTrend = useMemo(
    () => (trustTrend.length ? trustTrend : [{ ts: new Date().toISOString(), trustScore: snapshot.trustScore }]).slice(-20),
    [trustTrend, snapshot.trustScore]
  );

  const replayTrendCursorIndex = useMemo(() => {
    if (scenario === 'live' || !focusedEvent || displayTrend.length === 0) return null;

    const eventTs = new Date(focusedEvent.ts).getTime();
    let bestIdx = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < displayTrend.length; i += 1) {
      const pointTs = new Date(displayTrend[i].ts).getTime();
      const distance = Math.abs(pointTs - eventTs);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIdx = i;
      }
    }

    return bestIdx;
  }, [scenario, focusedEvent, displayTrend]);

  const previousPhase = useMemo(() => {
    const idx = PHASE_ORDER.indexOf(snapshot.phase);
    return idx > 0 ? PHASE_ORDER[idx - 1] : 'baseline';
  }, [snapshot.phase]);

  const systemStatus = useMemo(() => {
    if (playbackSnapshot.rollbackTriggered) {
      return { label: 'AUTO-FROZEN', tone: 'danger' as const };
    }
    if (playbackSnapshot.driftScore >= 0.5 || playbackSnapshot.hallucinationRate >= 0.12) {
      return { label: 'DEGRADED', tone: 'warn' as const };
    }
    if (playbackSnapshot.phase === 'trusted' || playbackSnapshot.phase === 'adaptive' || playbackSnapshot.phase === 'autonomous') {
      return { label: 'TRUSTED', tone: 'ok' as const };
    }
    return { label: 'ROLLED BACK', tone: 'neutral' as const };
  }, [playbackSnapshot]);

  const triggerRollback = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    try {
      const payload = {
        eventId: `rollback-${Date.now()}`,
        modelId: snapshot.modelId,
        fromPhase: snapshot.phase === 'baseline' ? 'stable' : snapshot.phase,
        toPhase: previousPhase,
        trigger: 'manual_override',
        severity: 'high',
        initiatedBy: 'ops',
        metricsSnapshot: {
          trustScore: snapshot.trustScore,
          hallucinationRate: snapshot.hallucinationRate,
          responseCoherence: snapshot.responseCoherence,
          driftScore: snapshot.driftScore,
        },
        summary: 'Manual rollback triggered from internal ops console',
        actionItems: ['Freeze promotion', 'Review drift and trust regressions'],
        occurredAt: new Date().toISOString(),
      };

      const response = await fetch('/api/internal/ops/rollback-events', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { success?: boolean; error?: string; details?: string[] };
      if (!response.ok || !result.success) {
        const details = result.details ? ` (${result.details.join('; ')})` : '';
        throw new Error((result.error || 'Rollback failed') + details);
      }

      await loadSnapshot();
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : 'Rollback failed');
    } finally {
      setActionLoading(false);
    }
  }, [loadSnapshot, previousPhase, snapshot]);

  return (
    <main className="min-h-screen bg-[#050816] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-blue-500/10 p-6 shadow-[0_0_80px_rgba(56,189,248,0.14)]">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Voxis Internal Ops</p>
          <h1 className="mt-2 text-3xl font-semibold text-cyan-50">Cognitive Mission Control</h1>
          <p className="mt-2 text-sm text-slate-300">
            Live governance view for trust calibration, drift monitoring, phase-gate promotion, and rollback readiness.
          </p>
          <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusToneClass(systemStatus.tone)}`}>
            <span>SYSTEM STATUS:</span>
            <span>{systemStatus.label}</span>
          </div>
          {loading ? <p className="mt-2 text-xs text-cyan-200/80">Loading live telemetry...</p> : null}
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Model" value={playbackSnapshot.modelId} />
          <StatCard label="Phase" value={toTitle(playbackSnapshot.phase)} />
          <StatCard label="Trust" value={pct(playbackSnapshot.trustScore)} tone="ok" />
          <StatCard label="Drift" value={pct(playbackSnapshot.driftScore)} tone={playbackSnapshot.driftScore > 0.2 ? 'warn' : 'ok'} />
          <StatCard
            label="Rollback"
            value={playbackSnapshot.rollbackTriggered ? 'Triggered' : 'Clear'}
            tone={playbackSnapshot.rollbackTriggered ? 'danger' : 'ok'}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <Panel title="Incident Replay" accent="indigo">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScenario('live');
                  setIsPlaying(false);
                  void loadSnapshot();
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${scenario === 'live' ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100' : 'border-white/15 bg-white/5 text-slate-200'}`}
              >
                Live
              </button>
              <select
                value={scenario === 'live' ? '' : scenario}
                onChange={(event) => {
                  const next = event.target.value;
                  if (!next) return;
                  setScenario(next);
                  setPlaybackIndex(0);
                  void loadReplay(next);
                }}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">Replay scenario...</option>
                {availableScenarios.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {scenario === 'live' ? 'Using live telemetry.' : `Replay mode: ${scenario}`}
              {replayLoading ? ' Loading...' : ''}
            </p>
            {scenario !== 'live' && events.length > 0 ? (
              <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Time-travel scrubber</span>
                  <span>
                    {playbackIndex + 1}/{events.length}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, events.length - 1)}
                  value={Math.min(playbackIndex, Math.max(0, events.length - 1))}
                  onChange={(event) => {
                    setPlaybackIndex(Number(event.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full accent-cyan-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setPlaybackIndex((idx) => Math.max(0, idx - 1));
                    }}
                    className="rounded border border-white/20 bg-slate-800 px-2 py-1 text-xs"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((state) => !state)}
                    className="rounded border border-cyan-300/40 bg-cyan-500/20 px-2 py-1 text-xs text-cyan-100"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setPlaybackIndex((idx) => Math.min(events.length - 1, idx + 1));
                    }}
                    className="rounded border border-white/20 bg-slate-800 px-2 py-1 text-xs"
                  >
                    Next
                  </button>
                  <select
                    value={String(playbackSpeed)}
                    onChange={(event) => {
                      setPlaybackSpeed(Number(event.target.value));
                    }}
                    className="rounded border border-white/20 bg-slate-800 px-2 py-1 text-xs"
                    title="Playback speed"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
                {focusedEvent ? (
                  <p className="text-xs text-slate-400">
                    Focused event: {new Date(focusedEvent.ts).toLocaleString()} - {focusedEvent.text}
                  </p>
                ) : null}
                <p className="text-[11px] text-slate-500">Keyboard: Left/Right to step, Space to play/pause.</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Trust Trend" accent="cyan">
            {trendSummary ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>Samples: {trendSummary.trustSamples}</div>
                  <div>Rollbacks: {trendSummary.rollbackCount}</div>
                  <div>Latest: {trendSummary.latestTrustScore !== null ? pct(trendSummary.latestTrustScore) : 'n/a'}</div>
                  <div>Delta: {trendSummary.trustDelta !== null ? `${trendSummary.trustDelta > 0 ? '+' : ''}${Math.round(trendSummary.trustDelta * 100)}%` : 'n/a'}</div>
                </div>
                <div className="mt-3 flex h-16 items-end gap-1">
                  {displayTrend.map((point, idx) => (
                    <div
                      key={point.ts}
                      className={`w-2 rounded bg-gradient-to-t from-cyan-500 to-indigo-400 ${replayTrendCursorIndex === idx ? 'ring-2 ring-amber-300/80' : ''}`}
                      style={{ height: `${Math.max(10, Math.round(point.trustScore * 64))}px` }}
                      title={`${new Date(point.ts).toLocaleString()} ${pct(point.trustScore)}${replayTrendCursorIndex === idx ? ' (replay focus)' : ''}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">Trend rollup not available yet.</p>
            )}
          </Panel>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <Panel title="Phase Ladder" accent="cyan">
            <div className="space-y-2">
              {PHASE_ORDER.map((phase) => {
                const active = phase === playbackSnapshot.phase;
                const reached = PHASE_ORDER.indexOf(phase) <= PHASE_ORDER.indexOf(playbackSnapshot.phase);
                return (
                  <div
                    key={phase}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      active
                        ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-50'
                        : reached
                          ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100'
                          : 'border-slate-700 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    {toTitle(phase)}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Trust and Coherence" accent="fuchsia">
            <div className="space-y-3">
              <Meter label="Trust score" value={playbackSnapshot.trustScore} />
              <Meter label="Response coherence" value={playbackSnapshot.responseCoherence} />
              <Meter label="Emotional consistency" value={playbackSnapshot.emotionalConsistency} />
              <Meter label="Hallucination rate" value={1 - playbackSnapshot.hallucinationRate} invert />
            </div>
          </Panel>

          <Panel title="Gate Approval Console" accent="indigo">
            <div className="space-y-2">
              {gateChecks.map((gate) => (
                <div key={gate.key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span className="text-slate-200">{gate.key}</span>
                  <span className={gate.pass ? 'text-emerald-300' : 'text-rose-300'}>{gate.pass ? 'PASS' : 'FAIL'}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg border border-emerald-300/50 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100">
                Promote Candidate
              </button>
              <button
                type="button"
                onClick={() => {
                  void triggerRollback();
                }}
                disabled={actionLoading || scenario !== 'live'}
                className="rounded-lg border border-rose-300/50 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'Triggering...' : scenario !== 'live' ? 'Replay Mode' : 'Trigger Rollback'}
              </button>
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <Panel title="Event Timeline" accent="cyan">
            <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {visibleEvents.map((event) => {
                const isFocused = scenario !== 'live' && focusedEvent?.ts === event.ts && focusedEvent?.text === event.text;

                return (
                <div
                  key={`${event.ts}-${event.text}`}
                  ref={isFocused ? focusedEventRef : null}
                  aria-current={isFocused ? 'true' : undefined}
                  className={`rounded-lg border px-3 py-2 ${
                    isFocused
                      ? 'border-amber-300/60 bg-amber-500/10 shadow-[0_0_0_1px_rgba(252,211,77,0.35)]'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="text-xs text-slate-400">{new Date(event.ts).toLocaleString()}</p>
                  <p className={`text-sm ${event.level === 'danger' ? 'text-rose-300' : event.level === 'warning' ? 'text-amber-300' : event.level === 'success' ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {event.text}
                  </p>
                </div>
              );
              })}
            </div>
          </Panel>

          <Panel title="Schema Contract Status" accent="fuchsia">
            <ul className="space-y-2 text-sm text-slate-200">
              <li>scorecard.schema.json {schemaStatus.scorecard ? 'loaded' : 'missing'}</li>
              <li>phase-gate.schema.json {schemaStatus.phaseGate ? 'loaded' : 'missing'}</li>
              <li>rollback-event.schema.json {schemaStatus.rollbackEvent ? 'loaded' : 'missing'}</li>
              <li>trust-calibration.schema.json {schemaStatus.trustCalibration ? 'loaded' : 'missing'}</li>
              <li>phase-gate-flow.mmd available in visuals</li>
            </ul>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'ok' | 'warn' | 'danger' }) {
  const toneClass =
    tone === 'ok'
      ? 'border-emerald-300/30'
      : tone === 'warn'
        ? 'border-amber-300/30'
        : tone === 'danger'
          ? 'border-rose-300/30'
          : 'border-white/10';

  return (
    <div className={`rounded-xl border bg-slate-900/70 p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: 'cyan' | 'fuchsia' | 'indigo';
  children: React.ReactNode;
}) {
  const accentClass =
    accent === 'cyan'
      ? 'border-cyan-500/30'
      : accent === 'fuchsia'
        ? 'border-fuchsia-500/30'
        : 'border-indigo-500/30';

  return (
    <section className={`rounded-2xl border bg-slate-900/70 p-4 ${accentClass}`}>
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Meter({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const normalized = Math.max(0, Math.min(1, value));
  const displayed = invert ? 1 - normalized : normalized;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{pct(displayed)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
        <div className="h-full rounded bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400" style={{ width: `${Math.round(displayed * 100)}%` }} />
      </div>
    </div>
  );
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function toTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusToneClass(tone: 'neutral' | 'ok' | 'warn' | 'danger'): string {
  if (tone === 'ok') return 'border-emerald-300/50 bg-emerald-500/20 text-emerald-100';
  if (tone === 'warn') return 'border-amber-300/50 bg-amber-500/20 text-amber-100';
  if (tone === 'danger') return 'border-rose-300/50 bg-rose-500/20 text-rose-100';
  return 'border-slate-400/40 bg-slate-700/30 text-slate-100';
}
