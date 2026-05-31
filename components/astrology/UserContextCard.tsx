'use client';

import React from 'react';

interface UserContextApiResult {
  success?: boolean;
  error?: string;
  data?: {
    situation?: string;
    mood?: string;
    goals?: string[];
    lastFeedbackNotes?: string;
    updatedAt?: string;
  } | null;
}

interface UserContextCardProps {
  userId?: string;
  onSaved?: () => void;
}

interface UserContextState {
  situation: string;
  mood: string;
  goalsText: string;
  lastFeedbackNotes: string;
  updatedAt?: string;
}

const EMPTY_STATE: UserContextState = {
  situation: '',
  mood: '',
  goalsText: '',
  lastFeedbackNotes: '',
};

export function UserContextCard({ userId, onSaved }: UserContextCardProps) {
  const [context, setContext] = React.useState<UserContextState>(EMPTY_STATE);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [statusTone, setStatusTone] = React.useState<'success' | 'error'>('success');

  React.useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/user-context?userId=${encodeURIComponent(userId)}`)
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as UserContextApiResult | null;

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Failed to load context');
        }

        return result;
      })
      .then((result) => {
        if (cancelled || !result.success || !result.data) return;
        setContext({
          situation: result.data.situation || '',
          mood: result.data.mood || '',
          goalsText: (result.data.goals || []).join('\n'),
          lastFeedbackNotes: result.data.lastFeedbackNotes || '',
          updatedAt: result.data.updatedAt,
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('[UserContextCard] Failed to load user context:', error);
          setStatus(error instanceof Error ? error.message : 'Failed to load context');
          setStatusTone('error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleChange = (field: keyof UserContextState, value: string) => {
    setContext((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setStatus('');

    try {
      const goals = context.goalsText
        .split('\n')
        .map((goal) => goal.trim())
        .filter(Boolean);

      const response = await fetch('/api/user-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          situation: context.situation,
          mood: context.mood,
          goals,
          lastFeedbackNotes: context.lastFeedbackNotes,
        }),
      });

      const result = (await response.json().catch(() => null)) as UserContextApiResult | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to save context');
      }

      setContext((prev) => ({
        ...prev,
        updatedAt: result.data?.updatedAt,
      }));
      setStatus('Context saved');
      setStatusTone('success');
      onSaved?.();
    } catch (error) {
      console.error('[UserContextCard] Failed to save context:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to save context');
      setStatusTone('error');
    } finally {
      setSaving(false);
      window.setTimeout(() => setStatus(''), 2000);
    }
  };

  if (!userId) return null;

  return (
    <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/10 p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-cyan-200">Merlin Memory</h3>
          <p className="text-xs text-cyan-100/70">
            Save your real-life situation so the forecast can weigh the stars against what is actually happening.
          </p>
        </div>
        {context.updatedAt && (
          <span className="text-xs text-cyan-100/50">
            Updated {new Date(context.updatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-cyan-100/70">Loading context...</p>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-cyan-100/70">Current situation</span>
            <textarea
              value={context.situation}
              onChange={(event) => handleChange('situation', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-cyan-500/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="Example: Homeless, couch surfing, chasing two job leads this week."
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-cyan-100/70">Current mood</span>
              <select
                value={context.mood}
                onChange={(event) => handleChange('mood', event.target.value)}
                className="mt-1 w-full rounded-md border border-cyan-500/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <option value="">Select mood</option>
                <option value="steady">Steady</option>
                <option value="anxious">Anxious</option>
                <option value="hopeful">Hopeful</option>
                <option value="overwhelmed">Overwhelmed</option>
                <option value="grieving">Grieving</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-cyan-100/70">Current goals</span>
              <textarea
                value={context.goalsText}
                onChange={(event) => handleChange('goalsText', event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-cyan-500/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="One goal per line"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-cyan-100/70">Last real-world outcome</span>
            <textarea
              value={context.lastFeedbackNotes}
              onChange={(event) => handleChange('lastFeedbackNotes', event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-cyan-500/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="Example: Got the interview but froze in the room. Need confidence, not more pressure."
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-cyan-100/60">
              Merlin uses these notes to bias domain impact, tone, and risk framing.
            </p>
            <div className="flex items-center gap-3">
              {status ? (
                <span className={statusTone === 'error' ? 'text-xs text-rose-300' : 'text-xs text-cyan-200'}>
                  {status}
                </span>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save memory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}