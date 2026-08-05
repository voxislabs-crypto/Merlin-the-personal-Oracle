/**
 * Share helpers for product-led growth — screenshot-friendly + copy/share text.
 */

export interface ShareWeatherPayload {
  date?: string;
  levelLabel?: string;
  dayRating?: string;
  intensity?: number;
  friction?: number;
  /** Professional flag: material disruption risk is elevated this window */
  elevatedDisruption?: boolean;
  confidence?: number;
  story?: string;
  why?: string;
  move?: string;
  driver?: string;
  siteUrl?: string;
}

function siteBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_URL || 'https://merlin.app';
}

export function buildShareWeatherText(payload: ShareWeatherPayload): string {
  const date =
    payload.date ||
    new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const lines: string[] = [
    `MY LIFE WEATHER · ${date}`,
    '',
  ];

  if (payload.levelLabel || typeof payload.friction === 'number') {
    const level = payload.levelLabel || 'Life weather';
    const fr =
      typeof payload.friction === 'number' ? ` · friction ${Math.round(payload.friction)}/100` : '';
    lines.push(`${level}${fr}`);
  } else if (typeof payload.intensity === 'number') {
    lines.push(`Intensity ${Math.round(payload.intensity)}%${payload.dayRating ? ` · ${payload.dayRating}` : ''}`);
  }

  if (payload.elevatedDisruption === true) {
    lines.push(
      `Elevated disruption risk${typeof payload.confidence === 'number' ? ` · conf ${Math.round(payload.confidence)}%` : ''}`
    );
  } else if (payload.elevatedDisruption === false) {
    lines.push('Disruption risk contained this window');
  }

  if (payload.story?.trim()) {
    lines.push('', payload.story.trim().slice(0, 220));
  }

  if (payload.move?.trim()) {
    lines.push('', `Move: ${payload.move.trim().slice(0, 160)}`);
  }

  if (payload.driver?.trim()) {
    lines.push(`Driver: ${payload.driver.trim()}`);
  }

  lines.push('', `Get yours → ${payload.siteUrl || siteBase()}`);
  lines.push('(Swiss Ephemeris · personal chart · not a generic horoscope)');

  return lines.join('\n');
}

export async function shareWeatherText(payload: ShareWeatherPayload): Promise<{
  method: 'native' | 'clipboard' | 'failed';
  text: string;
}> {
  const text = buildShareWeatherText(payload);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({
        title: 'My life weather · Merlin',
        text,
        url: payload.siteUrl || siteBase(),
      });
      return { method: 'native', text };
    }
  } catch (err) {
    // User cancelled share sheet — don't fall through as error if AbortError
    if (err instanceof Error && err.name === 'AbortError') {
      return { method: 'failed', text };
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { method: 'clipboard', text };
    }
  } catch {
    // fall through
  }

  return { method: 'failed', text };
}
