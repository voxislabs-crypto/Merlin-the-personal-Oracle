/**
 * Two day meters, two labels.
 *
 * `intensity` is the Storm Watch alarm (tone word at 80+).
 * `overallFriction` is the hard-aspect load.
 * Both can be true. They must not look like two official percents for the same thing.
 */

export const ALARM_LABEL = 'alarm';
export const FRICTION_LABEL = 'friction';

/** Gap at which unlabeled dual percents look like a fight. */
export const DUAL_SCORE_GAP = 4;

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Hard-aspect load only — never fall back to the alarm. */
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
 * Spoken / chat form.
 * Differing meters: "Storm Watch 85, friction 71"
 * Matching meters: "Storm Watch 85"
 */
export function formatStormWatchScoreLine(
  toneLabel: string,
  alarm: number,
  friction?: number | null,
): string {
  const a = clampScore(alarm);
  const label = (toneLabel || 'Storm Watch').trim() || 'Storm Watch';
  if (
    typeof friction === 'number' &&
    Number.isFinite(friction) &&
    dualScoresNeedLabels(a, friction)
  ) {
    return `${label} ${a}, friction ${clampScore(friction)}`;
  }
  return `${label} ${a}`;
}

/** Compact UI: "85% alarm" or "85% alarm · 71% friction". */
export function formatDualScoreUi(
  alarm: number,
  friction?: number | null,
): string {
  const a = clampScore(alarm);
  if (
    typeof friction === 'number' &&
    Number.isFinite(friction) &&
    dualScoresNeedLabels(a, friction)
  ) {
    return `${a}% ${ALARM_LABEL} · ${clampScore(friction)}% ${FRICTION_LABEL}`;
  }
  return `${a}% ${ALARM_LABEL}`;
}

export function formatShareScoreSuffix(
  alarm?: number | null,
  friction?: number | null,
): string {
  const hasAlarm = typeof alarm === 'number' && Number.isFinite(alarm);
  const hasFriction = typeof friction === 'number' && Number.isFinite(friction);
  if (hasAlarm && hasFriction && dualScoresNeedLabels(alarm, friction)) {
    return ` · Storm Watch ${clampScore(alarm)}, friction ${clampScore(friction)}`;
  }
  if (hasFriction) return ` · friction ${clampScore(friction)}/100`;
  if (hasAlarm) return ` · alarm ${clampScore(alarm)}%`;
  return '';
}

/**
 * Oracle / APP SIGHT block. Always names both meters so the model cannot
 * pick one unlabeled official percent.
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
  const cite =
    typeof friction === 'number' && Number.isFinite(friction)
      ? formatStormWatchScoreLine(label, a, friction)
      : `${label} ${a}`;
  const agree =
    typeof friction === 'number' &&
    Number.isFinite(friction) &&
    !dualScoresNeedLabels(a, friction);

  return `
SCORE PAIR (two meters — both can be true; they must not look like a fight):
- ${label} / ${ALARM_LABEL}: ${a}% — weather intensity that sets the tone word. 80+ is Storm Watch.
- ${FRICTION_LABEL} / hard-aspect load: ${frictionLine} — transit impact, not the alarm.
- Cite as: "${cite}."${agree ? ' Meters agree today — still name which one if you cite a percent.' : ''}
- Never present two unlabeled percents as competing official scores for the same day. Never pick one and hide the other.
  `.trim();
}
