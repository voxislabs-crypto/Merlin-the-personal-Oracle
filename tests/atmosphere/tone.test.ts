import { clampIntensity, resolveAtmosphereIntensity, resolveTone } from '@/lib/atmosphere/tone';

describe('atmosphere tone', () => {
  it('clamps intensity to 0-100', () => {
    expect(clampIntensity(-5)).toBe(0);
    expect(clampIntensity(150)).toBe(100);
    expect(clampIntensity(61.6)).toBe(62);
  });

  it('maps low intensity to Smooth Flow', () => {
    const tone = resolveTone(28);
    expect(tone.label).toBe('Smooth Flow');
    expect(tone.icon).toBe('clear');
  });

  it('maps mid intensity to Mixed Skies at 40', () => {
    expect(resolveTone(40).label).toBe('Mixed Skies');
    expect(resolveTone(39).label).toBe('Smooth Flow');
  });

  it('maps elevated intensity to Caution at 60', () => {
    expect(resolveTone(60).label).toBe('Caution');
    expect(resolveTone(59).label).toBe('Mixed Skies');
  });

  it('maps high intensity to Storm Watch at 80', () => {
    expect(resolveTone(80).label).toBe('Storm Watch');
    expect(resolveTone(79).label).toBe('Caution');
  });

  it('derives intensity from day rating when intensity is missing', () => {
    expect(resolveAtmosphereIntensity(undefined, 'yellow')).toBe(55);
    expect(resolveAtmosphereIntensity(72, 'green')).toBe(72);
  });

  it('includes shell background tokens for card chrome', () => {
    expect(resolveTone(55).shellBg).toContain('slate-900');
  });
});