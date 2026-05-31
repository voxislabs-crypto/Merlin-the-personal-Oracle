export type MetricPolarity = 'positive' | 'negative';

export type TrendSignal = {
  trendLabel: 'Rising' | 'Easing' | 'Strengthening' | 'Fading' | 'Steady';
  trendGlyph: '↗' | '↘' | '→';
  trendClass: 'text-rose-300' | 'text-emerald-300' | 'text-amber-300' | 'text-zinc-300';
  trendReason: string;
  trendThresholds: string;
};

export type RiskSignal = {
  label: 'High Risk Window' | 'Elevated Watch' | 'Favorable Window' | 'Mixed Conditions';
  className:
    | 'border-rose-400/45 bg-rose-500/15 text-rose-200'
    | 'border-amber-400/45 bg-amber-500/15 text-amber-200'
    | 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
    | 'border-zinc-400/45 bg-zinc-500/15 text-zinc-200';
  reason: string;
  thresholds: string;
};

const POSITIVE_THRESHOLDS = 'Positive metric thresholds: Strengthening >= 67, Fading <= 40, otherwise Steady.';
const NEGATIVE_THRESHOLDS = 'Negative metric thresholds: Rising >= 67, Easing <= 40, otherwise Steady.';
const RISK_THRESHOLDS =
  'Thresholds: High Risk if Pressure >= 70, Elevated Watch if Pressure >= 55, Favorable Window if Focus >= 65, otherwise Mixed Conditions.';

export function getTrendSignal(label: string, value: number, polarity: MetricPolarity): TrendSignal {
  const rounded = Math.round(value);
  const isNegative = polarity === 'negative';

  if (isNegative) {
    if (rounded >= 67) {
      return {
        trendLabel: 'Rising',
        trendGlyph: '↗',
        trendClass: 'text-rose-300',
        trendReason: `${label} is ${rounded} (>= 67), which indicates pressure is rising and may require tighter sequencing.`,
        trendThresholds: NEGATIVE_THRESHOLDS,
      };
    }

    if (rounded <= 40) {
      return {
        trendLabel: 'Easing',
        trendGlyph: '↘',
        trendClass: 'text-emerald-300',
        trendReason: `${label} is ${rounded} (<= 40), which signals easing pressure and more room for recovery or outreach.`,
        trendThresholds: NEGATIVE_THRESHOLDS,
      };
    }

    return {
      trendLabel: 'Steady',
      trendGlyph: '→',
      trendClass: 'text-zinc-300',
      trendReason: `${label} is ${rounded}, inside the steady band. Conditions are stable but still worth monitoring.`,
      trendThresholds: NEGATIVE_THRESHOLDS,
    };
  }

  if (rounded >= 67) {
    return {
      trendLabel: 'Strengthening',
      trendGlyph: '↗',
      trendClass: 'text-emerald-300',
      trendReason: `${label} is ${rounded} (>= 67), indicating strengthening support for execution and momentum.`,
      trendThresholds: POSITIVE_THRESHOLDS,
    };
  }

  if (rounded <= 40) {
    return {
      trendLabel: 'Fading',
      trendGlyph: '↘',
      trendClass: 'text-amber-300',
      trendReason: `${label} is ${rounded} (<= 40), suggesting signal fade and a need for lower-friction choices.`,
      trendThresholds: POSITIVE_THRESHOLDS,
    };
  }

  return {
    trendLabel: 'Steady',
    trendGlyph: '→',
    trendClass: 'text-zinc-300',
    trendReason: `${label} is ${rounded}, inside the steady band. Signal is balanced but not strongly directional.`,
    trendThresholds: POSITIVE_THRESHOLDS,
  };
}

export function getRiskSignal(pressure: number, focus: number): RiskSignal {
  const roundedPressure = Math.round(pressure);
  const roundedFocus = Math.round(focus);

  if (roundedPressure >= 70) {
    return {
      label: 'High Risk Window',
      className: 'border-rose-400/45 bg-rose-500/15 text-rose-200',
      reason: `Pressure is ${roundedPressure} (>= 70), which marks a high-friction window. Keep decisions reversible and minimize optional commitments.`,
      thresholds: RISK_THRESHOLDS,
    };
  }

  if (roundedPressure >= 55) {
    return {
      label: 'Elevated Watch',
      className: 'border-amber-400/45 bg-amber-500/15 text-amber-200',
      reason: `Pressure is ${roundedPressure} (55-69), so conditions are elevated. Sequence work in shorter cycles and avoid stacking emotionally heavy tasks.`,
      thresholds: RISK_THRESHOLDS,
    };
  }

  if (roundedFocus >= 65) {
    return {
      label: 'Favorable Window',
      className: 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200',
      reason: `Focus is ${roundedFocus} (>= 65), indicating a favorable execution window. Prioritize one strategic move while clarity is strong.`,
      thresholds: RISK_THRESHOLDS,
    };
  }

  return {
    label: 'Mixed Conditions',
    className: 'border-zinc-400/45 bg-zinc-500/15 text-zinc-200',
    reason: `Signals are mixed (pressure ${roundedPressure}, focus ${roundedFocus}). Use low-risk steps and re-check conditions before major pivots.`,
    thresholds: RISK_THRESHOLDS,
  };
}