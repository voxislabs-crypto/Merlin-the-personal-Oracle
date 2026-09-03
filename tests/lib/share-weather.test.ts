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
    expect(text).toMatch(/Hard friction window|Elevated disruption/i);
    expect(text).toMatch(/One priority max/);
    expect(text).toMatch(/https:\/\/example\.com/);
    expect(text).toMatch(/Not a horoscope|clear read/i);
  });

  it('labels Storm Watch alarm and friction when they differ', () => {
    const text = buildShareWeatherText({
      date: 'Thu, Sep 3',
      levelLabel: 'Storm risk',
      intensity: 85,
      friction: 71,
      siteUrl: 'https://example.com',
    });
    expect(text).toMatch(/Storm Watch 85, friction 71/);
    expect(text).not.toMatch(/Intensity 85%/);
  });
});
