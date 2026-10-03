import {
  clampIntensity,
  resolveAtmosphereIntensity,
  resolveScreenTone,
  resolveTone,
  screenToneHeadline,
} from '@/lib/atmosphere/tone';

describe('atmosphere tone', () => {
  it('clamps intensity to 0-100', () => {
    expect(clampIntensity(-5)).toBe(0);
    expect(clampIntensity(150)).toBe(100);
    expect(clampIntensity(61.6)).toBe(62);
  });

  it('maps low intensity to Clear Flow', () => {
    const tone = resolveTone(28);
    expect(tone.label).toBe('Clear Flow');
    expect(tone.icon).toBe('clear');
  });

  it('maps mid intensity to Mixed Weather at 40', () => {
    expect(resolveTone(40).label).toBe('Mixed Weather');
    expect(resolveTone(39).label).toBe('Clear Flow');
  });

  it('maps elevated intensity to Caution at 60', () => {
    expect(resolveTone(60).label).toBe('Caution');
    expect(resolveTone(59).label).toBe('Mixed Weather');
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

  it('keeps a green day off the red Storm Watch screen', () => {
    const tone = resolveScreenTone(80, 'green');
    expect(tone.label).toBe('Clear Flow');
    expect(tone.icon).toBe('clear');
    expect(tone.shellBg).toContain('emerald');
    expect(tone.text).toContain('emerald');
    expect(screenToneHeadline(80, 'green')).toBe('Green Day');
  });

  it('keeps the alarm meter when the day is green', () => {
    expect(resolveAtmosphereIntensity(80, 'green')).toBe(80);
    expect(resolveAtmosphereIntensity(67, 'green')).toBe(67);
  });

  it('leaves a red high-alarm day on Storm Watch', () => {
    expect(resolveScreenTone(80, 'red').label).toBe('Storm Watch');
    expect(screenToneHeadline(80, 'red')).toBe('Storm Watch');
  });

  it('names an already-clear green day Clear Flow', () => {
    expect(screenToneHeadline(28, 'green')).toBe('Clear Flow');
  });
});
