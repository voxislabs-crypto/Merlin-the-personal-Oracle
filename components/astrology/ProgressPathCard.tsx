'use client';

import React from 'react';

interface ProgressPathCardProps {
  arcPath?: string;
  arcLevel?: number;
  arcXp?: number;
  interactionCount?: number;
  compact?: boolean;
}

export function ProgressPathCard({
  arcPath,
  arcLevel,
  arcXp,
  interactionCount,
  compact = false,
}: ProgressPathCardProps) {
  if (!arcPath && !arcLevel && !arcXp) {
    return null;
  }

  const level = arcLevel || 1;
  const xp = arcXp || 0;
  const xpInLevel = xp % 100;
  const progressPercent = Math.max(0, Math.min(100, xpInLevel));

  return (
    <div className={`rounded-lg border border-cyan-500/30 bg-cyan-950/15 ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs uppercase tracking-wider text-cyan-300/85 mb-1">Path Progression</p>
      <p className={`font-semibold text-cyan-100 ${compact ? 'text-sm' : 'text-base'}`}>
        {arcPath} • Level {level}
      </p>
      {!compact && interactionCount !== undefined && (
        <p className="text-xs text-cyan-100/70 mt-1">Interactions: {interactionCount}</p>
      )}
      <div className="mt-2 h-1.5 rounded-full bg-cyan-950/70 overflow-hidden">
        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progressPercent}%` }} />
      </div>
      {!compact && <p className="text-[11px] text-cyan-100/70 mt-1">XP {xpInLevel}/100 to next level</p>}
    </div>
  );
}
