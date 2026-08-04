import { explainTransitTitle, parseTransitTitle } from '@/lib/astrology/transit-plain-language';

describe('transit plain language', () => {
  it('parses standard window titles', () => {
    const p = parseTransitTitle('Uranus Opposition Uranus');
    expect(p).toEqual({
      transiting: 'Uranus',
      aspect: 'Opposition',
      natal: 'Uranus',
    });
  });

  it('explains Uranus opposition Uranus in plain English', () => {
    const e = explainTransitTitle('Uranus Opposition Uranus');
    expect(e.plain.toLowerCase()).toMatch(/wake-up|uranus/);
    expect(e.detail).toBeTruthy();
  });

  it('explains mixed planet aspects', () => {
    const e = explainTransitTitle('Neptune Trine Uranus');
    expect(e.plain.toLowerCase()).toMatch(/neptune|uranus/);
  });
});
