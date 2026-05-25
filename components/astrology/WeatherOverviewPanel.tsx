import { Cloud, CloudDrizzle, CloudFog, CloudLightning, Sun, Timer } from 'lucide-react';

import type { LifeDomain, WeatherCondition, WeatherForecastReport } from '@/types/astrology';

type HorizonHours = 24 | 72 | 168 | 720;

interface WeatherOverviewPanelProps {
  weather: WeatherForecastReport | null | undefined;
  loading?: boolean;
  error?: string | null;
  selectedHorizon: HorizonHours;
  onHorizonChange: (hours: HorizonHours) => void;
}

const HORIZON_LABELS: Record<HorizonHours, string> = {
  24: '24h',
  72: '72h',
  168: '7d',
  720: '30d',
};

const DOMAIN_LABELS: Record<LifeDomain, string> = {
  identity: 'Identity',
  career: 'Work',
  relationships: 'Relationships',
  finances: 'Resources',
  mental_strain: 'Mental Load',
  creativity: 'Creativity',
  spiritual_growth: 'Reflection',
  social_connection: 'Social',
  reinvention: 'Rebuild',
};

function getConditionClasses(condition: WeatherCondition): string {
  switch (condition) {
    case 'storm':
      return 'border-rose-400/45 bg-gradient-to-br from-rose-900/25 to-orange-900/20';
    case 'turbulence':
      return 'border-amber-400/45 bg-gradient-to-br from-amber-900/20 to-orange-900/20';
    case 'fog':
      return 'border-slate-400/40 bg-gradient-to-br from-slate-800/35 to-slate-900/50';
    case 'variable':
      return 'border-cyan-400/40 bg-gradient-to-br from-cyan-900/20 to-blue-900/25';
    case 'flow':
    default:
      return 'border-teal-400/40 bg-gradient-to-br from-teal-900/20 to-blue-900/20';
  }
}

function getConditionIcon(condition: WeatherCondition) {
  switch (condition) {
    case 'storm':
      return <CloudLightning className="h-4 w-4 text-rose-300" />;
    case 'turbulence':
      return <CloudDrizzle className="h-4 w-4 text-amber-300" />;
    case 'fog':
      return <CloudFog className="h-4 w-4 text-slate-300" />;
    case 'variable':
      return <Cloud className="h-4 w-4 text-cyan-300" />;
    case 'flow':
    default:
      return <Sun className="h-4 w-4 text-teal-300" />;
  }
}

function getSeverityBadgeClasses(band: WeatherForecastReport['severity']['band']): string {
  switch (band) {
    case 'severe':
      return 'border-rose-400/50 bg-rose-600/20 text-rose-100';
    case 'high':
      return 'border-amber-400/50 bg-amber-600/20 text-amber-100';
    case 'moderate':
      return 'border-cyan-400/50 bg-cyan-600/20 text-cyan-100';
    case 'low':
    default:
      return 'border-teal-400/50 bg-teal-600/20 text-teal-100';
  }
}

export function WeatherOverviewPanel({
  weather,
  loading = false,
  error,
  selectedHorizon,
  onHorizonChange,
}: WeatherOverviewPanelProps) {
  const horizonOptions = weather?.horizons?.options?.length
    ? weather.horizons.options
    : ([24, 72, 168, 720] as HorizonHours[]);

  const topDomains = [...(weather?.domains || [])]
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 4);

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/55 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Instant Forecast</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-50">Atmospheric Snapshot</h3>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/80 p-1">
          {horizonOptions.map((hours) => (
            <button
              key={hours}
              type="button"
              onClick={() => onHorizonChange(hours)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedHorizon === hours
                  ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-300/50'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                {HORIZON_LABELS[hours]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading && !weather ? (
        <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/60 p-4 text-sm text-slate-300">
          Building atmospheric model for the selected horizon...
        </div>
      ) : null}

      {error && !weather ? (
        <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {weather ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3 md:col-span-2">
              <p className="text-sm leading-relaxed text-slate-100">{weather.summary}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
              <div className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${getSeverityBadgeClasses(weather.severity.band)}`}>
                Severity {weather.severity.score}/100 · {weather.severity.band}
              </div>
              <div className="rounded-lg border border-violet-400/50 bg-violet-600/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100">
                Confidence {weather.confidence.score}/100 · {weather.confidence.band}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topDomains.map((domain) => (
              <article
                key={domain.domain}
                className={`rounded-lg border p-3 ${getConditionClasses(domain.condition)}`}
                aria-label={`${DOMAIN_LABELS[domain.domain]} forecast`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{DOMAIN_LABELS[domain.domain]}</p>
                  {getConditionIcon(domain.condition)}
                </div>
                <p className="mt-2 text-xs text-slate-200/90">{domain.headline}</p>
                <p className="mt-2 text-[11px] text-slate-300">Pressure {domain.pressure}/100</p>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Recommended Navigation</p>
            <ul className="mt-2 space-y-1.5">
              {(weather.navigation || []).slice(0, 4).map((tip, index) => (
                <li key={`${tip}-${index}`} className="text-sm text-slate-100">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}
