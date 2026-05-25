import 'server-only';

import type {
  DomainScore,
  LifeDomain,
  WeatherCondition,
  WeatherConfidence,
  WeatherConfidenceBand,
  WeatherDomainForecast,
  WeatherForecastReport,
  WeatherSeverity,
  WeatherSeverityBand,
} from '@/types/astrology';

const HORIZON_OPTIONS: Array<24 | 72 | 168 | 720> = [24, 72, 168, 720];

const DOMAIN_LABELS: Record<LifeDomain, string> = {
  identity: 'Identity climate',
  career: 'Work pressure',
  relationships: 'Relationship weather',
  finances: 'Resource stability',
  mental_strain: 'Mental load',
  creativity: 'Creative flow',
  spiritual_growth: 'Meaning and reflection',
  social_connection: 'Social dynamics',
  reinvention: 'Rebuild momentum',
};

const DOMAIN_GUIDANCE: Record<LifeDomain, string[]> = {
  identity: ['Protect your baseline routines before starting new identity experiments.'],
  career: ['Prioritize maintenance tasks before expansion moves.'],
  relationships: ['Favor listening over solving in sensitive conversations.'],
  finances: ['Delay non-essential spending until signal clarity improves.'],
  mental_strain: ['Reduce input volume and use short focus cycles.'],
  creativity: ['Capture ideas quickly and refine them later.'],
  spiritual_growth: ['Create quiet space for reflection before major commitments.'],
  social_connection: ['Choose fewer but higher-quality interactions today.'],
  reinvention: ['Restructure existing systems before launching new ones.'],
};

function clampScore(score: number): number {
  if (Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function toSeverityBand(score: number): WeatherSeverityBand {
  if (score >= 80) {
    return 'severe';
  }
  if (score >= 60) {
    return 'high';
  }
  if (score >= 35) {
    return 'moderate';
  }
  return 'low';
}

function toConfidenceBand(score: number): WeatherConfidenceBand {
  if (score >= 75) {
    return 'high';
  }
  if (score >= 45) {
    return 'medium';
  }
  return 'low';
}

function toCondition(score: number): WeatherCondition {
  if (score >= 80) {
    return 'storm';
  }
  if (score >= 60) {
    return 'turbulence';
  }
  if (score >= 40) {
    return 'fog';
  }
  if (score >= 20) {
    return 'variable';
  }
  return 'flow';
}

function toHeadline(domain: LifeDomain, condition: WeatherCondition): string {
  const label = DOMAIN_LABELS[domain];

  switch (condition) {
    case 'storm':
      return `${label}: intense conditions, keep decisions reversible.`;
    case 'turbulence':
      return `${label}: unstable pressure, pace before pushing.`;
    case 'fog':
      return `${label}: low clarity, verify assumptions.`;
    case 'variable':
      return `${label}: mixed signals, adapt hour by hour.`;
    default:
      return `${label}: supportive flow, build steady momentum.`;
  }
}

function pickTopNavigation(domains: WeatherDomainForecast[]): string[] {
  const ordered = [...domains].sort((a, b) => b.pressure - a.pressure);
  const topThree = ordered.slice(0, 3);

  const output: string[] = topThree.map((domain) => domain.recommendations[0]);

  if (ordered[0] && ordered[0].condition !== 'flow') {
    output.unshift('Pause before reacting and choose the smallest reversible action.');
  }

  return Array.from(new Set(output)).slice(0, 5);
}

export interface BuildWeatherReportInput {
  generatedAt?: string;
  globalPressure: number;
  confidence: number;
  domainScores: DomainScore[];
  defaultHours?: 24 | 72;
}

function toWeatherDomainForecast(score: DomainScore): WeatherDomainForecast {
  const pressure = clampScore(score.pressure);
  const confidence = clampScore(score.confidence);
  const condition = toCondition(pressure);

  return {
    domain: score.domain,
    condition,
    pressure,
    confidence,
    headline: toHeadline(score.domain, condition),
    recommendations: DOMAIN_GUIDANCE[score.domain],
    topDrivers: score.topDrivers,
  };
}

function toSummary(severity: WeatherSeverity, confidence: WeatherConfidence): string {
  if (severity.band === 'severe') {
    return `High-pressure weather is active. Slow down, reduce risk, and protect energy. Confidence is ${confidence.band}.`;
  }

  if (severity.band === 'high') {
    return `Elevated turbulence is likely. Stay adaptive and prioritize maintenance over force. Confidence is ${confidence.band}.`;
  }

  if (severity.band === 'moderate') {
    return `Mixed atmospheric signals are in play. Favor clarity checks and steady execution. Confidence is ${confidence.band}.`;
  }

  return `Supportive flow conditions are present. This is favorable for constructive progress. Confidence is ${confidence.band}.`;
}

export function buildWeatherForecastReport(input: BuildWeatherReportInput): WeatherForecastReport {
  const severityScore = clampScore(input.globalPressure);
  const confidenceScore = clampScore(input.confidence);
  const severity: WeatherSeverity = {
    score: severityScore,
    band: toSeverityBand(severityScore),
  };

  const confidence: WeatherConfidence = {
    score: confidenceScore,
    band: toConfidenceBand(confidenceScore),
  };

  const domains = input.domainScores.map(toWeatherDomainForecast);
  const navigation = pickTopNavigation(domains);

  return {
    version: 'weather-v1',
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    summary: toSummary(severity, confidence),
    severity,
    confidence,
    horizons: {
      defaultHours: input.defaultHours ?? 72,
      options: HORIZON_OPTIONS,
    },
    domains,
    navigation,
    notes: [
      'Forecasts are directional guidance, not deterministic outcomes.',
      'Use high-pressure windows for preparation and risk management.',
    ],
  };
}
