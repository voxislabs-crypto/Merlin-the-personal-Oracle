'use client';

import { useState } from 'react';
import type { DomainStripItem, DomainTrend } from '@/lib/atmosphere/domain-strip';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';
import {
  buildDomainDetailPayload,
  uniqueExplanations,
  uniqueMechanics,
  type DomainDetailPayload,
} from '@/lib/atmosphere/domain-detail';
import { domainSurfaceLine } from '@/lib/astrology/pressure-engine/lay-reason';
import { DomainDrillDown } from '@/components/dashboard/DomainDrillDown';

export interface LifeDomainStripProps {
  items: DomainStripItem[];
  riskPercent?: number | null;
  risk?: LifeRiskPacket | null;
  className?: string;
  onOpenTransitList?: () => void;
}

function trendClass(trend: DomainStripItem['trend']): string {
  if (trend === 'up') return 'text-sky-100 border-sky-400/40 bg-sky-500/15';
  if (trend === 'down') return 'text-rose-100 border-rose-400/40 bg-rose-500/15';
  return 'text-slate-200 border-white/15 bg-white/5';
}

function trendToTone(trend: DomainTrend): 'pressure' | 'opportunity' | 'neutral' {
  if (trend === 'down') return 'pressure';
  if (trend === 'up') return 'opportunity';
  return 'neutral';
}

/**
 * First screen: a colored sentence. Mechanics stay behind a toggle.
 */
export function LifeDomainStrip({
  items,
  riskPercent,
  risk = null,
  className = '',
  onOpenTransitList,
}: LifeDomainStripProps) {
  const [detail, setDetail] = useState<DomainDetailPayload | null>(null);
  if (!items.length && riskPercent == null) return null;

  const openId = detail?.domain ?? null;
  const openItem = items.find((item) => item.id === openId) || null;

  const openDomain = (item: DomainStripItem) => {
    if (openId === item.id) {
      setDetail(null);
      return;
    }
    setDetail(buildDomainDetailPayload(risk, item));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${trendClass(item.trend)} ${
              openId === item.id ? 'ring-1 ring-white/40' : ''
            }`}
            title={domainSurfaceLine(item.id, trendToTone(item.trend))}
            onClick={() => openDomain(item)}
            aria-expanded={openId === item.id}
          >
            {domainSurfaceLine(item.id, trendToTone(item.trend))}
          </button>
        ))}
        {typeof riskPercent === 'number' ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100 sm:text-xs"
            title="Hard-aspect load for this window — not the Storm Watch alarm"
          >
            <span className="text-sky-300/80 font-medium">Friction</span>
            <span className="tabular-nums">{riskPercent}%</span>
          </span>
        ) : null}
      </div>

      {detail ? (
        <DomainDrillDown
          domain={detail.domain}
          title={domainSurfaceLine(detail.domain, trendToTone(openItem?.trend || 'flat'))}
          titleClassName={
            openItem?.trend === 'down'
              ? 'text-rose-100'
              : openItem?.trend === 'up'
                ? 'text-sky-100'
                : 'text-slate-200'
          }
          className="rounded-xl border border-white/10 bg-slate-950/70"
          pressure={detail.pressure}
          opportunity={detail.opportunity}
          explanations={uniqueExplanations(detail.hits)}
          mechanics={uniqueMechanics(detail.hits)}
          onOpenTransitList={onOpenTransitList}
        />
      ) : null}
    </div>
  );
}
