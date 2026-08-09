'use client';

import { Fragment, useMemo } from 'react';
import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';
import {
  ORACLE_PLANET_HEX,
  ORACLE_SEVERITY_SPAN,
  scoreOracleSeverity,
  tokenizeOracleText,
  type OracleSeverity,
} from '@/lib/oracle-rich-text';
import { cn } from '@/lib/utils';

export interface OracleRichTextProps {
  text: string;
  className?: string;
  /** Show planetary glyphs before names */
  showGlyphs?: boolean;
  /** Soft cursor blink for streaming */
  streaming?: boolean;
}

/**
 * Colorful Oracle body copy: planet names in signature hues,
 * severity words tinted calm / caution / storm.
 */
export function OracleRichText({
  text,
  className,
  showGlyphs = true,
  streaming = false,
}: OracleRichTextProps) {
  const tokens = useMemo(() => tokenizeOracleText(text), [text]);

  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {tokens.map((token, idx) => {
        if (token.type === 'text') {
          return <Fragment key={idx}>{token.value}</Fragment>;
        }

        if (token.type === 'planet') {
          const hex = ORACLE_PLANET_HEX[token.canonical] || '#7dd3fc';
          const glyph = PLANET_GLYPHS[token.canonical];
          return (
            <span
              key={idx}
              className="inline-flex items-baseline gap-0.5 font-semibold"
              style={{
                color: hex,
                textShadow: `0 0 18px ${hex}55`,
              }}
              title={token.canonical}
            >
              {showGlyphs && glyph ? (
                <span className="text-[0.95em] leading-none opacity-90" aria-hidden>
                  {glyph}
                </span>
              ) : null}
              <span>{token.value}</span>
            </span>
          );
        }

        // severity phrase
        return (
          <span
            key={idx}
            className={cn(ORACLE_SEVERITY_SPAN[token.severity], 'underline-offset-2')}
            style={{
              textShadow:
                token.severity === 'storm'
                  ? '0 0 14px rgba(251,113,133,0.35)'
                  : token.severity === 'caution'
                    ? '0 0 12px rgba(251,191,36,0.28)'
                    : '0 0 10px rgba(52,211,153,0.22)',
            }}
          >
            {token.value}
          </span>
        );
      })}
      {streaming ? <span className="animate-pulse text-sky-300">▌</span> : null}
    </span>
  );
}

export function useOracleMessageSeverity(text: string): OracleSeverity {
  return useMemo(() => scoreOracleSeverity(text), [text]);
}
