import { buildShareWeatherText } from '@/lib/share-weather';

describe('buildShareWeatherText', () => {
  it('builds a shareable life-weather blurb with CTA', () => {
    const text = buildShareWeatherText({
      date: 'Wed, Aug 5',
      levelLabel: 'Friction elevated',
      friction: 73,
      elevatedDisruption: true,
      confidence: 77,
      story: 'Pressure is real but workable.',
      move: 'One priority max.',
      driver: 'Mars Square Sun',
      siteUrl: 'https://example.com',
    });

    expect(text).toMatch(/MY LIFE WEATHER/);
    expect(text).toMatch(/Friction elevated/);
    expect(text).toMatch(/73/);
    expect(text).toMatch(/Elevated disruption risk/);
    expect(text).toMatch(/One priority max/);
    expect(text).toMatch(/https:\/\/example\.com/);
    expect(text).toMatch(/Not a horoscope|clear read/i);
  });
});
