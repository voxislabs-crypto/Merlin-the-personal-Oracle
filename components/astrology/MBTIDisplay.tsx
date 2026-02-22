'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MBTIDetails } from '@/lib/astrology/mbtiFusion';

export interface MBTIDisplayProps {
  mbti: MBTIDetails;
  className?: string;
}

const MBTI_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  'INTJ': {
    name: 'The Architect',
    description: 'Strategic thinker with a plan for everything'
  },
  'INTP': {
    name: 'The Logician',
    description: 'Innovative inventor with endless curiosity'
  },
  'ENTJ': {
    name: 'The Commander',
    description: 'Bold, imaginative, and strong-willed leader'
  },
  'ENTP': {
    name: 'The Debater',
    description: 'Smart and curious thinker who loves a challenge'
  },
  'INFJ': {
    name: 'The Advocate',
    description: 'Quiet and mystical, yet inspiring and idealistic'
  },
  'INFP': {
    name: 'The Mediator',
    description: 'Poetic, kind, and always eager to help'
  },
  'ENFJ': {
    name: 'The Protagonist',
    description: 'Charismatic and inspiring leader'
  },
  'ENFP': {
    name: 'The Campaigner',
    description: 'Enthusiastic, creative, and sociable free spirit'
  },
  'ISTJ': {
    name: 'The Logistician',
    description: 'Practical and fact-minded individual'
  },
  'ISFJ': {
    name: 'The Defender',
    description: 'Very dedicated and warm protector'
  },
  'ESTJ': {
    name: 'The Executive',
    description: 'Excellent administrator, managing things and people'
  },
  'ESFJ': {
    name: 'The Consul',
    description: 'Extraordinarily caring, social, and popular'
  },
  'ISTP': {
    name: 'The Virtuoso',
    description: 'Bold and practical experimenter'
  },
  'ISFP': {
    name: 'The Adventurer',
    description: 'Flexible and charming artist'
  },
  'ESTP': {
    name: 'The Entrepreneur',
    description: 'Smart, energetic, and perceptive'
  },
  'ESFP': {
    name: 'The Entertainer',
    description: 'Spontaneous, enthusiastic, and energetic'
  },
};

export function MBTIDisplay({ mbti, className = '' }: MBTIDisplayProps) {
  const typeInfo = MBTI_DESCRIPTIONS[mbti.type] || {
    name: 'Unknown Type',
    description: 'Personality type information not available'
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 dark:text-green-400';
    if (confidence >= 70) return 'text-blue-600 dark:text-blue-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getLetterDescription = (letter: string) => {
    const descriptions: Record<string, { full: string; trait: string }> = {
      'E': { full: 'Extraversion', trait: 'Energized by external world' },
      'I': { full: 'Introversion', trait: 'Energized by inner world' },
      'S': { full: 'Sensing', trait: 'Focus on facts and details' },
      'N': { full: 'Intuition', trait: 'Focus on patterns and possibilities' },
      'T': { full: 'Thinking', trait: 'Make decisions with logic' },
      'F': { full: 'Feeling', trait: 'Make decisions with values' },
      'J': { full: 'Judging', trait: 'Prefer structure and plans' },
      'P': { full: 'Perceiving', trait: 'Prefer flexibility and spontaneity' },
    };
    return descriptions[letter] || { full: '', trait: '' };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              {mbti.type}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {typeInfo.name}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {typeInfo.description}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getConfidenceColor(mbti.confidence)}`}>
              {mbti.confidence}%
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Breakdown */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
            Type Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(mbti.breakdown).map(([key, value]) => {
              const desc = getLetterDescription(value);
              return (
                <div
                  key={key}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl font-bold text-primary mb-1">
                    {value}
                  </div>
                  <div className="text-xs font-semibold">{desc.full}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {desc.trait}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Firmware/Overlay */}
        {mbti.firmware && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded border border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/30">
                Firmware Overlay
              </span>
              <span className="text-sm font-semibold">
                {typeof mbti.firmware === 'string' ? mbti.firmware : mbti.firmware.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Secondary personality pattern detected in chart
            </p>
          </div>
        )}

        {/* Astrological Reasoning */}
        {mbti.reasoning && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Astrological Indicators
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mbti.reasoning.extraversion.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.e_i === 'E' ? 'Extraversion' : 'Introversion'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.extraversion.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mbti.reasoning.intuition.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.s_n === 'N' ? 'Intuition' : 'Sensing'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.intuition.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mbti.reasoning.thinking.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.t_f === 'T' ? 'Thinking' : 'Feeling'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.thinking.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {mbti.reasoning.judging.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">
                    {mbti.breakdown.j_p === 'J' ? 'Judging' : 'Perceiving'}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {mbti.reasoning.judging.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
