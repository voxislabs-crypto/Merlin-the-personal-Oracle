import {
  parseTransitPhrase,
  resolveAspectGlyph,
  resolvePlanetStyle,
} from '@/lib/astrology/planet-style';

describe('planet-style', () => {
  it('maps classical planetary elements', () => {
    expect(resolvePlanetStyle('Saturn')?.element).toBe('Earth');
    expect(resolvePlanetStyle('Mars')?.element).toBe('Fire');
    expect(resolvePlanetStyle('Moon')?.element).toBe('Water');
    expect(resolvePlanetStyle('Mercury')?.element).toBe('Air');
  });

  it('returns glyph, element color tokens, solid popup, and tooltip', () => {
    const saturn = resolvePlanetStyle('Saturn');
    expect(saturn?.glyph).toBe('♄');
    expect(saturn?.tooltip).toMatch(/Saturn/);
    expect(saturn?.tooltip).toMatch(/Earth/);
    expect(saturn?.hex).toMatch(/^#/);
    expect(saturn?.textClass).toContain('emerald');
    expect(saturn?.popupBg).toMatch(/^#/);
    // Opaque solid fill (no alpha channel)
    expect(saturn?.popupBg).not.toMatch(/rgba|transparent/i);
    expect(saturn?.popupBorder).toMatch(/^#/);
  });

  it('parses transit phrases and aspect glyphs', () => {
    const parsed = parseTransitPhrase('Saturn Square Moon');
    expect(parsed).toEqual({
      transiting: 'Saturn',
      aspect: 'Square',
      natal: 'Moon',
    });
    expect(resolveAspectGlyph('Square')).toBe('□');
    expect(resolveAspectGlyph('Trine')).toBe('△');
  });
});
