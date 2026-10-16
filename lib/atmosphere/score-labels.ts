/**
 * User-facing meter language.
 *
 * `intensity` is symbolic intensity (the Storm Watch mood word still starts at 80).
 * `overallFriction` is friction load (hard-aspect pressure).
 * Both are heuristic scales. Neither is a chance that something will happen.
 */

export const SYMBOLIC_INTENSITY_LABEL = 'symbolic intensity';
export const FRICTION_LOAD_LABEL = 'friction load';
export const READING_CONFIDENCE_LABEL = 'Reading confidence';
export const THEME_EMPHASIS_LABEL = 'Theme emphasis';
export const CHART_CLARITY_LABEL = 'Chart clarity';

/** Older call sites. Same strings as the labels above. */
export const ALARM_LABEL = SYMBOLIC_INTENSITY_LABEL;
export const FRICTION_LABEL = FRICTION_LOAD_LABEL;

/** Gap at which unlabeled dual figures look like a fight. */
export const DUAL_SCORE_GAP = 4;

/**
 * Stable definitions. A 70 means the same thing every session.
 * These are the words tooltips and expands should show.
 */
export const METER_DEFINITIONS = {
  symbolicIntensity:
    'How loud the chart’s symbolic weather is, on a 0–100 heuristic scale. 70 means a strong symbolic load. It is not a 70% chance that something will happen.',
  frictionLoad:
    'How much hard-aspect pressure is in this window, on a 0–100 heuristic scale. It is not the probability of a bad outcome.',
  readingConfidence:
    'How mixed the chart signals are. Higher means the read is cleaner, not that a prediction is more likely to come true.',
  themeEmphasis:
    'Which life themes the chart is emphasizing (relationships, home, work, money, energy). A highlight, not a risk percent for that area.',
  chartClarity:
    'How cleanly the chart’s letter votes agreed. Chart clarity, not a questionnaire match and not the chance this type is correct.',
} as const;

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Hard-aspect load only — never fall back to symbolic intensity. */
export function resolveFrictionPercent(
  risk?: { overallFriction?: number } | null,
): number | null {
  const n = risk?.overallFriction;
  if (typeof n === 'number' && Number.isFinite(n)) return clampScore(n);
  return null;
}

export function dualScoresNeedLabels(alarm: number, friction: number): boolean {
  return Math.abs(clampScore(alarm) - clampScore(friction)) >= DUAL_SCORE_GAP;
}

/**
 * Spoken / chat form. Names the meter and calls it a heuristic.
 * "Symbolic intensity 85 (heuristic), friction load 71"
 */
export function formatStormWatchScoreLine(
  _toneLabel: string,
  alarm: number,
  friction?: number | null,
): string {
  const a = clampScore(alarm);
  if (typeof friction === 'number' && Number.isFinite(friction)) {
    return `Symbolic intensity ${a} (heuristic), friction load ${clampScore(friction)}`;
  }
  return `Symbolic intensity ${a} (heuristic)`;
}

/** Compact UI. No percent glyph. "85 symbolic intensity · 71 friction load". */
export function formatDualScoreUi(
  alarm: number,
  friction?: number | null,
): string {
  const a = clampScore(alarm);
  if (typeof friction === 'number' && Number.isFinite(friction)) {
    return `${a} ${SYMBOLIC_INTENSITY_LABEL} · ${clampScore(friction)} ${FRICTION_LOAD_LABEL}`;
  }
  return `${a} ${SYMBOLIC_INTENSITY_LABEL}`;
}

export function formatShareScoreSuffix(
  alarm?: number | null,
  friction?: number | null,
): string {
  const hasAlarm = typeof alarm === 'number' && Number.isFinite(alarm);
  const hasFriction = typeof friction === 'number' && Number.isFinite(friction);
  if (hasAlarm && hasFriction) {
    return ` · symbolic intensity ${clampScore(alarm)}, friction load ${clampScore(friction)}`;
  }
  if (hasFriction) return ` · friction load ${clampScore(friction)}`;
  if (hasAlarm) return ` · symbolic intensity ${clampScore(alarm)} (heuristic)`;
  return '';
}

/**
 * Oracle / APP SIGHT block. Scores are heuristic intensity, not calibrated
 * probabilities and not the chance of an outcome.
 */
export function formatScorePairContext(
  toneLabel: string,
  alarm: number,
  friction?: number | null,
): string {
  const a = clampScore(alarm);
  const label = (toneLabel || 'Storm Watch').trim() || 'Storm Watch';
  const frictionLine =
    typeof friction === 'number' && Number.isFinite(friction)
      ? `${clampScore(friction)}/100`
      : 'not loaded';
  const cite = formatStormWatchScoreLine(label, a, friction);
  const agree =
    typeof friction === 'number' &&
    Number.isFinite(friction) &&
    !dualScoresNeedLabels(a, friction);

  return `
SCORE PAIR (heuristic intensity — not a calibrated probability, not a chance of an outcome):
- Symbolic intensity: ${a}/100 — how loud the symbolic weather is. The mood word is ${label}. 80+ is the Storm Watch mood. A 70 is a strong symbolic load, not a 70% chance.
- Friction load / hard-aspect load: ${frictionLine} — hard-aspect pressure in this window. Not the probability of a bad outcome.
- Reading confidence is separate: how clean the read is, not how likely a prediction is to come true.
- Theme emphasis names life areas (relationships, home, work, money, energy). A highlight, not a risk percent for that area.
- Cite as: "${cite}." Name the meter and call it a heuristic.${agree ? ' Meters agree today — still name which one if you cite a figure.' : ''}
- Never say "N% risk", "N% alarm", "N% probability", or "N% chance". Never present two unlabeled figures as competing official scores. Never quote one meter and hide the other.
  `.trim();
}
