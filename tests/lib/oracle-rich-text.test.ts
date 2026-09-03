/** @jest-environment node */

import {
  oracleVisibleText,
  scoreOracleSeverity,
  tokenizeOracleText,
} from '@/lib/oracle-rich-text';

describe('oracle-rich-text', () => {
  it('tokenizes planet names with canonical keys', () => {
    const tokens = tokenizeOracleText('When Mars squares your Moon, stay grounded.');
    const planets = tokens.filter((t) => t.type === 'planet');
    expect(planets.map((p) => (p.type === 'planet' ? p.canonical : ''))).toEqual([
      'Mars',
      'Moon',
    ]);
  });

  it('scores storm language higher than calm', () => {
    expect(
      scoreOracleSeverity('A severe storm and crisis window — dangerous pressure.')
    ).toBe('storm');
    expect(scoreOracleSeverity('There is ease, flow, and a soft landing today.')).toBe(
      'calm'
    );
  });

  it('highlights severity phrases without swallowing planets', () => {
    const tokens = tokenizeOracleText('Saturn brings tension; avoid a crisis.');
    expect(tokens.some((t) => t.type === 'planet' && t.canonical === 'Saturn')).toBe(
      true
    );
    expect(tokens.some((t) => t.type === 'severity' && t.severity === 'caution')).toBe(
      true
    );
    expect(tokens.some((t) => t.type === 'severity' && t.severity === 'storm')).toBe(true);
  });

  it('renders markdown bold/italic instead of leftover asterisks', () => {
    const tokens = tokenizeOracleText(
      '**Headline:** The sky.\n*quiet aside*\n**Uranus square Venus** is loud.',
    );
    expect(oracleVisibleText(tokens)).toBe(
      'Headline: The sky.\nquiet aside\nUranus square Venus is loud.',
    );
    expect(oracleVisibleText(tokens)).not.toMatch(/\*/);

    const heading = tokens.find((t) => t.type === 'bold' && t.heading);
    expect(heading).toBeTruthy();

    const inlineBold = tokens.find((t) => t.type === 'bold' && !t.heading);
    expect(inlineBold?.type).toBe('bold');
    if (inlineBold?.type === 'bold') {
      expect(inlineBold.children.some((c) => c.type === 'planet' && c.canonical === 'Uranus')).toBe(
        true,
      );
      expect(inlineBold.children.some((c) => c.type === 'planet' && c.canonical === 'Venus')).toBe(
        true,
      );
    }

    expect(tokens.some((t) => t.type === 'italic')).toBe(true);
  });

  it('lifts Shareable closer out of asterisks into a labeled block', () => {
    const tokens = tokenizeOracleText(
      '*Shareable closer:* When the square\'s peak passes, the storm clears.',
    );
    const closer = tokens.find((t) => t.type === 'closer');
    expect(closer).toBeTruthy();
    expect(oracleVisibleText(tokens)).toBe(
      'When the square\'s peak passes, the storm clears.',
    );
    expect(oracleVisibleText(tokens)).not.toMatch(/\*/);
  });
});
