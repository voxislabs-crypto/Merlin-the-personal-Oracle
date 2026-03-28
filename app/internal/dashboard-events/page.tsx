'use client';

import { useEffect, useMemo, useState } from 'react';

type DashboardEventsResponse = {
  windowDays: number;
  totalEvents: number;
  uniqueUsers: number;
  countsByEvent: Record<string, number>;
  funnel: {
    firstChart: number;
    firstAsk: number;
    onboardingComplete: number;
    dailyCheckins: number;
  };
  recentEvents: Array<{
    id: string;
    userId: string;
    eventName: string;
    createdAt: string;
  }>;
};

const WINDOW_OPTIONS = [7, 30, 60];

export default function DashboardEventsInternalPage() {
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardEventsResponse | null>(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/dashboard-events?days=${windowDays}`);
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Failed to load dashboard events');
        }

        if (!ignore) {
          setData(result.data as DashboardEventsResponse);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [windowDays]);

  const topEvents = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.countsByEvent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [data]);

  const askRate = data?.funnel.firstChart
    ? Math.round((data.funnel.firstAsk / data.funnel.firstChart) * 100)
    : 0;
  const onboardingRate = data?.funnel.firstAsk
    ? Math.round((data.funnel.onboardingComplete / data.funnel.firstAsk) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/75">Internal Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-cyan-50">Dashboard Funnel Events</h1>
            <p className="mt-2 text-sm text-slate-300">Snapshot of onboarding and retention event volume from dashboard usage.</p>
          </div>
          <div className="flex gap-2">
            {WINDOW_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setWindowDays(option)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  windowDays === option
                    ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                    : 'border-slate-600 bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Last {option}d
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-300">Loading dashboard events...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Events" value={String(data.totalEvents)} />
              <MetricCard label="Unique Users" value={String(data.uniqueUsers)} />
              <MetricCard label="Ask Rate" value={`${askRate}%`} helper="first ask / first chart" />
              <MetricCard label="Onboarding Complete" value={`${onboardingRate}%`} helper="complete / first ask" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-cyan-100">Top Events</h2>
                <div className="mt-3 space-y-2">
                  {topEvents.length ? topEvents.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <span className="text-slate-200">{name}</span>
                      <span className="font-semibold text-cyan-100">{count}</span>
                    </div>
                  )) : <p className="text-xs text-slate-400">No events in selected window.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-indigo-100">Recent Events</h2>
                <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {data.recentEvents.length ? data.recentEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <p className="text-indigo-100">{event.eventName}</p>
                      <p className="mt-1 text-slate-400">{new Date(event.createdAt).toLocaleString()} • user {event.userId.slice(0, 8)}</p>
                    </div>
                  )) : <p className="text-xs text-slate-400">No recent events found.</p>}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}
