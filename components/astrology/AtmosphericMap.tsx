import { motion } from 'framer-motion';

import type { LifeDomain, WeatherCondition, WeatherForecastReport } from '@/types/astrology';

interface AtmosphericMapProps {
  weather: WeatherForecastReport | null | undefined;
  loading?: boolean;
}

const DOMAIN_LABELS: Record<LifeDomain, string> = {
  identity: 'Identity',
  career: 'Career',
  relationships: 'Relationships',
  finances: 'Resources',
  mental_strain: 'Mental',
  creativity: 'Creative',
  spiritual_growth: 'Meaning',
  social_connection: 'Social',
  reinvention: 'Rebuild',
};

function getConditionColor(condition: WeatherCondition): string {
  switch (condition) {
    case 'storm':
      return 'rgba(251, 113, 133, 0.75)';
    case 'turbulence':
      return 'rgba(251, 191, 36, 0.7)';
    case 'fog':
      return 'rgba(148, 163, 184, 0.62)';
    case 'variable':
      return 'rgba(34, 211, 238, 0.7)';
    case 'flow':
    default:
      return 'rgba(45, 212, 191, 0.72)';
  }
}

export function AtmosphericMap({ weather, loading = false }: AtmosphericMapProps) {
  const topDomains = [...(weather?.domains || [])]
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 6);

  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-300/80">Atmospheric Map</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-50">Pressure Fronts</h3>
        </div>
        <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-100">
          Live model
        </span>
      </div>

      {loading && !weather ? (
        <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/60 p-4 text-sm text-slate-300">
          Tracking moving fronts across your top life domains...
        </div>
      ) : null}

      {weather ? (
        <>
          <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-700/60 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.22),transparent_42%),radial-gradient(circle_at_78%_40%,rgba(244,114,182,0.17),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(20,184,166,0.2),transparent_43%)] p-4">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(148,163,184,0.08)_50%,transparent_100%)]" />

            <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {topDomains.map((domain, index) => {
                const intensity = Math.max(0.2, domain.pressure / 100);
                const delay = index * 0.08;

                return (
                  <motion.article
                    key={domain.domain}
                    className="relative overflow-hidden rounded-lg border border-slate-600/60 bg-slate-900/65 p-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${getConditionColor(domain.condition)} 0%, transparent 68%)`,
                        opacity: 0.2 + intensity * 0.45,
                      }}
                      animate={{
                        x: ['-8%', '6%', '-8%'],
                        y: ['-4%', '4%', '-4%'],
                      }}
                      transition={{
                        duration: 7 + (1 - intensity) * 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    <div className="relative z-10">
                      <p className="text-sm font-semibold text-slate-100">{DOMAIN_LABELS[domain.domain]}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">{domain.condition}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/80">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: getConditionColor(domain.condition) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${domain.pressure}%` }}
                          transition={{ duration: 0.6, delay: delay + 0.05 }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-300">Pressure {domain.pressure}/100</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-300">
            Reading tip: warmer zones indicate rising tension fronts, while cool zones indicate better flow for recovery, planning, and steady execution.
          </p>
        </>
      ) : null}
    </section>
  );
}
