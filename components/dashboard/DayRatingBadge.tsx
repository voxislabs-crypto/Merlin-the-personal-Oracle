'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDayRatingPresentation } from '@/lib/dashboard/cosmic-rating';

interface DayRatingBadgeProps {
  dayRating: string;
}

export function DayRatingBadge({ dayRating }: DayRatingBadgeProps) {
  const presentation = getDayRatingPresentation(dayRating);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={`inline-flex cursor-help items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${presentation.badgeClass}`}
            aria-label={`Day rating: ${presentation.label}. ${presentation.tooltip}`}
          >
            {presentation.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs border border-slate-600 bg-slate-800 text-slate-100">
          <p className="text-xs font-semibold text-slate-100">{presentation.label} day</p>
          <p className="mt-1 text-xs text-slate-300">{presentation.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}