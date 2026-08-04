/**
 * Short, sharp life-weather copy for the Today brief.
 * Prefer atmosphere packet + one concrete driver over long cosmic prose.
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import type { AtmospherePacket } from '@/lib/atmosphere/types';

export interface LifeWeatherBriefCopy {
  /** One or two sentences: how life feels today */
  story: string;
  /** Concrete why (driver / signal) */
  why: string;
  /** Single actionable move */
  move: string;
  eyebrow: string;
  askLabel: string;
}

function firstSentence(text: string, maxLen = 220): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] || cleaned).trim();
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

function intensityLead(intensity: number): string {
  if (intensity >= 80) return 'High-pressure life weather.';
  if (intensity >= 60) return 'Elevated life weather — pace yourself.';
  if (intensity >= 40) return 'Mixed life weather.';
  return 'Steady life weather.';
}

function fallbackMove(intensity: number): string {
  if (intensity >= 75) {
    return 'Protect bandwidth. Delay non-essential decisions until the pressure eases.';
  }
  if (intensity >= 55) {
    return 'One clear priority only. Leave room to adjust by evening.';
  }
  if (intensity >= 40) {
    return 'Move on one reversible step — talk, draft, or scout — before you commit hard.';
  }
  return 'Use the calm: finish one meaningful thing and leave the rest for later.';
}

export interface BuildLifeWeatherBriefInput {
  packet?: AtmospherePacket | null;
  forecastSummary?: string | null;
  forecastAdvice?: string | null;
  transitDo?: string | null;
  predictiveMove?: string | null;
  loading?: boolean;
  premiumLocked?: boolean;
  errorMessage?: string | null;
}

/**
 * Build the three-beat Today brief: story · why · move.
 */
export function buildLifeWeatherBrief(input: BuildLifeWeatherBriefInput): LifeWeatherBriefCopy {
  const eyebrow = "Today's life weather";
  const askLabel = 'Ask Merlin about today';

  if (input.loading) {
    return {
      eyebrow,
      askLabel,
      story: 'Reading life weather for your chart…',
      why: 'Station is still locking signals.',
      move: 'Hang tight — your forecast is assembling.',
    };
  }

  if (input.premiumLocked) {
    return {
      eyebrow,
      askLabel,
      story: 'Full life weather is on a paid plan.',
      why: 'Your chart is ready; depth forecast unlocks with premium.',
      move: 'Upgrade when you want daily intensity, storms, and a clear move.',
    };
  }

  if (input.errorMessage) {
    return {
      eyebrow,
      askLabel,
      story: sanitizeCopyText(input.errorMessage),
      why: 'The weather feed hiccuped.',
      move: 'Refresh in a moment, or ask Merlin to re-read today.',
    };
  }

  const packet = input.packet;
  const intensity = packet?.intensity ?? 45;
  const driverLabel = packet?.dominantDriver?.label?.trim();
  const driverWhy = packet?.dominantDriver?.rationale?.trim();
  const toneLabel = packet?.tone?.label;

  const summary =
    firstSentence(input.forecastSummary || '') ||
    (driverWhy ? firstSentence(driverWhy) : '') ||
    (toneLabel
      ? `${intensityLead(intensity)} Tone: ${toneLabel}.`
      : intensityLead(intensity));

  // Avoid double intensity leads when summary already starts with one
  const alreadyLed = /^(High-pressure|Elevated|Mixed|Steady) life weather/i.test(summary);
  const story = sanitizeCopyText(
    alreadyLed ? summary : `${intensityLead(intensity)} ${summary}`.replace(/\s+/g, ' ').trim(),
  );

  const why = sanitizeCopyText(
    driverLabel
      ? driverWhy && driverWhy.length < 180
        ? `${driverLabel} — ${firstSentence(driverWhy, 140)}`
        : `Main signal: ${driverLabel}.`
      : driverWhy
        ? firstSentence(driverWhy, 160)
        : 'No single storm dominates — watch pace and energy, not drama.',
  );

  const move = sanitizeCopyText(
    input.transitDo ||
      input.forecastAdvice ||
      input.predictiveMove ||
      fallbackMove(intensity),
  );

  return { story, why, move, eyebrow, askLabel };
}
