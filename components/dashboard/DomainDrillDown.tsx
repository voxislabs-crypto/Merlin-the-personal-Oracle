'use client';

import { domainInPlainWords } from '@/lib/astrology/pressure-engine/lay-reason';
import { ShowMechanics } from '@/components/dashboard/ShowMechanics';

export function DomainDrillDown({
  domain,
  title,
  titleClassName = '',
  className = 'border-t border-white/10',
  pressure,
  opportunity,
  explanations,
  mechanics,
  onOpenTransitList,
}: {
  domain: string;
  title?: string;
  titleClassName?: string;
  className?: string;
  pressure: number;
  opportunity: number;
  explanations: string[];
  mechanics: Array<string | null | undefined>;
  onOpenTransitList?: () => void;
}) {
  return (
    <div className={`space-y-2 px-3 py-2.5 ${className}`}>
      {title ? <p className={`text-sm font-semibold ${titleClassName}`}>{title}</p> : null}
      <p className="text-[11px] font-medium tabular-nums text-slate-400">
        {`Pressure ${Math.round(pressure)}/100 · Opportunity ${Math.round(opportunity)}/100`}
      </p>
      <p className="text-[11px] text-slate-500">
        Only what is touching {domainInPlainWords(domain)} right now.
      </p>
      {explanations.length ? (
        <div className="rounded-md bg-black/25 px-2.5 py-2">
          {explanations.map((line) => (
            <p key={line} className="text-xs leading-relaxed text-slate-200">
              {line}
            </p>
          ))}
          <ShowMechanics className="mt-1.5" lines={mechanics} />
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Quiet in this area — no specific transit is scoring it today.
        </p>
      )}
      {onOpenTransitList ? (
        <button
          type="button"
          onClick={onOpenTransitList}
          className="text-[11px] font-medium text-sky-300 underline-offset-2 hover:underline"
        >
          See full transit list
        </button>
      ) : null}
    </div>
  );
}
