import type { LifeDomain, WeatherForecastReport } from '@/types/astrology';

type HorizonHours = 24 | 72 | 168 | 720;

interface WeatherDeepDivePanelProps {
  weather: WeatherForecastReport | null | undefined;
  horizonHours: HorizonHours;
  mbtiType?: string | null;
}

const DOMAIN_LABELS: Record<LifeDomain, string> = {
  identity: 'Identity',
  career: 'Career',
  relationships: 'Relationships',
  finances: 'Resources',
  mental_strain: 'Mental Load',
  creativity: 'Creativity',
  spiritual_growth: 'Reflection',
  social_connection: 'Social',
  reinvention: 'Rebuild',
};

const HORIZON_TEXT: Record<HorizonHours, string> = {
  24: '24 hours',
  72: '72 hours',
  168: '7 days',
  720: '30 days',
};

function getMbtiImpactHint(mbtiType: string | null | undefined, domain: LifeDomain): string {
  if (!mbtiType) {
    return 'Personalized impact appears after personality profile detection.';
  }

  const type = mbtiType.toUpperCase();
  const isIntroverted = type.startsWith('I');
  const isFeeling = type.includes('F');
  const isJudging = type.endsWith('J');

  if (domain === 'social_connection' || domain === 'relationships') {
    if (isIntroverted) {
      return 'Social fronts may drain faster than usual. Protect recovery windows between interactions.';
    }
    return 'Social fronts can amplify momentum. Use structure to avoid overextension.';
  }

  if (domain === 'mental_strain' || domain === 'career') {
    if (isJudging) {
      return 'Closure pressure may rise. Break tasks into reversible checkpoints.';
    }
    return 'Open-loop thinking may scatter focus. Time-box analysis before switching tasks.';
  }

  if (domain === 'creativity' || domain === 'identity') {
    if (isFeeling) {
      return 'Emotional signal is high leverage now. Create first, evaluate later.';
    }
    return 'Pattern clarity is available. Draft systems before committing execution time.';
  }

  return 'Use this front for practical pacing and low-regret decision sequencing.';
}

export function WeatherDeepDivePanel({ weather, horizonHours, mbtiType }: WeatherDeepDivePanelProps) {
  const topDrivers = [...(weather?.domains || [])]
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 3);

  if (!weather || topDrivers.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/55 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300/80">Deep Dive</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-50">Top Active Drivers</h3>
        </div>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
          Horizon: {HORIZON_TEXT[horizonHours]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {topDrivers.map((domain) => (
          <article key={domain.domain} className="rounded-lg border border-slate-600/60 bg-slate-900/70 p-3">
            <p className="text-sm font-semibold text-slate-100">{DOMAIN_LABELS[domain.domain]}</p>
            <p className="mt-1 text-xs text-slate-300">{domain.headline}</p>
            <div className="mt-3 space-y-1.5 text-xs">
              <p className="text-slate-200">Severity {domain.pressure}/100 · Confidence {domain.confidence}/100</p>
              <p className="text-cyan-200">MBTI impact: {getMbtiImpactHint(mbtiType, domain.domain)}</p>
              <p className="text-emerald-200">Suggested response: {domain.recommendations[0]}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
