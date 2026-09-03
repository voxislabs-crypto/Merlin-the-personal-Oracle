'use client';

import { Fragment, useMemo, type ReactNode } from 'react';
import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';
import {
  ORACLE_PLANET_HEX,
  ORACLE_SEVERITY_SPAN,
  scoreOracleSeverity,
  tokenizeOracleText,
  type OracleSeverity,
  type OracleTextToken,
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

function PlanetSpan({
  value,
  canonical,
  showGlyphs,
}: {
  value: string;
  canonical: string;
  showGlyphs: boolean;
}) {
  const hex = ORACLE_PLANET_HEX[canonical] || '#7dd3fc';
  const glyph = PLANET_GLYPHS[canonical];
  return (
    <span
      className="whitespace-nowrap font-semibold"
      style={{
        color: hex,
        textShadow: `0 0 18px ${hex}55`,
      }}
      title={canonical}
    >
      {showGlyphs && glyph ? (
        <span className="mr-0.5 text-[0.95em] leading-none opacity-90" aria-hidden>
          {glyph}
        </span>
      ) : null}
      {value}
    </span>
  );
}

function SeveritySpan({
  value,
  severity,
}: {
  value: string;
  severity: Exclude<OracleSeverity, 'neutral'>;
}) {
  return (
    <span
      className={cn(ORACLE_SEVERITY_SPAN[severity], 'underline-offset-2')}
      style={{
        textShadow:
          severity === 'storm'
            ? '0 0 14px rgba(251,113,133,0.35)'
            : severity === 'caution'
              ? '0 0 12px rgba(251,191,36,0.28)'
              : '0 0 10px rgba(52,211,153,0.22)',
      }}
    >
      {value}
    </span>
  );
}

function renderTokens(tokens: OracleTextToken[], showGlyphs: boolean): ReactNode {
  return tokens.map((token, idx) => {
    if (token.type === 'text') {
      return <Fragment key={idx}>{token.value}</Fragment>;
    }

    if (token.type === 'planet') {
      return (
        <PlanetSpan
          key={idx}
          value={token.value}
          canonical={token.canonical}
          showGlyphs={showGlyphs}
        />
      );
    }

    if (token.type === 'severity') {
      return <SeveritySpan key={idx} value={token.value} severity={token.severity} />;
    }

    if (token.type === 'bold') {
      return (
        <span
          key={idx}
          className={
            token.heading
              ? 'mt-3 mb-0.5 block font-semibold tracking-wide text-sky-200 underline decoration-sky-400/45 underline-offset-[5px] first:mt-0'
              : 'font-semibold text-violet-200'
          }
        >
          {renderTokens(token.children, showGlyphs)}
        </span>
      );
    }

    if (token.type === 'italic') {
      return (
        <span key={idx} className="italic text-sky-100/90">
          {renderTokens(token.children, showGlyphs)}
        </span>
      );
    }

    return (
      <span
        key={idx}
        className="mt-3 block rounded-md border-l-2 border-sky-400/55 bg-sky-950/30 px-3 py-2"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
          Shareable closer
        </span>
        <span className="mt-1 block italic text-sky-100/90">
          {renderTokens(token.children, showGlyphs)}
        </span>
      </span>
    );
  });
}

/**
 * Colorful Oracle body copy: markdown emphasis, planet names in signature hues,
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
      {renderTokens(tokens, showGlyphs)}
      {streaming ? <span className="animate-pulse text-sky-300">▌</span> : null}
    </span>
  );
}

export function useOracleMessageSeverity(text: string): OracleSeverity {
  return useMemo(() => scoreOracleSeverity(text), [text]);
}
