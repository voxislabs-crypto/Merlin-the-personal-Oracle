import { ratingToIntensity, type DayRating } from '@/lib/dashboard/cosmic-rating';
import type { AtmosphereTone, AtmosphereToneLabel } from '@/lib/atmosphere/types';

export function clampIntensity(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveAtmosphereIntensity(
  intensity?: number,
  dayRating?: DayRating | string
): number {
  if (typeof intensity === 'number' && Number.isFinite(intensity)) {
    return clampIntensity(intensity);
  }
  return clampIntensity(ratingToIntensity(dayRating));
}

const SUPPORTIVE_DAY_RATINGS = new Set(['green', 'positive', 'very positive']);

/** Transit day is supportive — green, positive, or very positive. */
export function isSupportiveDayRating(dayRating?: DayRating | string | null): boolean {
  return SUPPORTIVE_DAY_RATINGS.has((dayRating || '').trim().toLowerCase());
}

/**
 * Screen chrome. Alarm still owns the meter.
 * A supportive day does not wear a red Storm Watch shell.
 */
export function resolveScreenTone(
  intensity?: number,
  dayRating?: DayRating | string | null,
): AtmosphereTone {
  const alarm = resolveAtmosphereIntensity(intensity, dayRating ?? undefined);
  if (isSupportiveDayRating(dayRating)) {
    return resolveTone(Math.min(alarm, 39));
  }
  return resolveTone(alarm);
}

/**
 * Headline on the weather screen.
 * When a green day would otherwise read Storm Watch, say Green Day.
 */
export function screenToneHeadline(
  intensity?: number,
  dayRating?: DayRating | string | null,
): string {
  const alarm = resolveAtmosphereIntensity(intensity, dayRating ?? undefined);
  const tone = resolveScreenTone(intensity, dayRating);
  if (!isSupportiveDayRating(dayRating) || alarm < 40) return tone.label;
  const raw = (dayRating || '').trim().toLowerCase();
  return raw === 'green' ? 'Green Day' : 'Open Day';
}

export function resolveTone(intensity: number): AtmosphereTone {
  const resolved = clampIntensity(intensity);

  if (resolved >= 80) {
    return tonePreset('Storm Watch', 'storm', {
      bar: 'from-rose-500 via-fuchsia-500 to-violet-600',
      shellBg: 'from-rose-950/50 via-slate-900/80 to-violet-950/40',
      border: 'border-rose-400/45',
      text: 'text-rose-200',
      glow: 'shadow-rose-500/20',
    });
  }

  if (resolved >= 60) {
    return tonePreset('Caution', 'rain', {
      bar: 'from-amber-500 via-orange-500 to-rose-500',
      shellBg: 'from-amber-950/40 via-slate-900/80 to-orange-950/30',
      border: 'border-amber-400/45',
      text: 'text-amber-200',
      glow: 'shadow-amber-500/15',
    });
  }

  if (resolved >= 40) {
    return tonePreset('Mixed Weather', 'mixed', {
      bar: 'from-cyan-500 via-blue-500 to-indigo-500',
      shellBg: 'from-cyan-950/35 via-slate-900/80 to-indigo-950/35',
      border: 'border-cyan-400/40',
      text: 'text-cyan-200',
      glow: 'shadow-cyan-500/10',
    });
  }

  return tonePreset('Clear Flow', 'clear', {
    bar: 'from-emerald-500 via-teal-500 to-cyan-500',
    shellBg: 'from-emerald-950/35 via-slate-900/80 to-cyan-950/30',
    border: 'border-emerald-400/40',
    text: 'text-emerald-200',
    glow: 'shadow-emerald-500/10',
  });
}

function tonePreset(
  label: AtmosphereToneLabel,
  icon: AtmosphereTone['icon'],
  tokens: { bar: string; shellBg: string; border: string; text: string; glow: string }
): AtmosphereTone {
  return {
    label,
    icon,
    gradient: tokens.bar,
    shellBg: tokens.shellBg,
    border: tokens.border,
    text: tokens.text,
    glow: tokens.glow,
  };
}