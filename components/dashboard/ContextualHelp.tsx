'use client';

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContextualHelpProps {
  label: string;
  className?: string;
}

export function ContextualHelp({ label, className = '' }: ContextualHelpProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={`inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-200 transition ${className}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-slate-800 text-slate-100 border border-slate-600">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}