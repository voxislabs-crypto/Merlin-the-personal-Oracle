/** @jest-environment node */

import {
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
});
