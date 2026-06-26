import { computeAtmosphere, computeAtmosphereConfluence } from '@/lib/atmosphere';

describe('atmosphere confluence v2', () => {
  it('detects triple hit when transit, solar arc, and profection share a theme', () => {
    const confluence = computeAtmosphereConfluence(
      {
        events: [
          {
            eventId: 'evt-saturn-moon',
            scores: { intensity: 72 },
            transit: {
              transitingPlanet: 'Saturn',
              aspect: 'Square',
              natalPlanet: 'Moon',
            },
          },
          {
            eventId: 'evt-pluto-moon',
            scores: { intensity: 68 },
            transit: {
              transitingPlanet: 'Pluto',
              aspect: 'Opposition',
              natalPlanet: 'Moon',
            },
          },
          {
            eventId: 'evt-mars-moon',
            scores: { intensity: 66 },
            transit: {
              transitingPlanet: 'Mars',
              aspect: 'Square',
              natalPlanet: 'Moon',
            },
          },
        ],
      },
      {
        profection: {
          age: 42,
          profectedHouse: 7,
          profectedSign: 'Aquarius',
          timeLord: 'Saturn',
          themeOfYear: 'Age 42: Aquarius profection year with Saturn as time lord.',
        },
        solarArc: {
          ageYears: 42,
          arcDegrees: 42,
          activeHits: [
            {
              directedPlanet: 'Saturn',
              natalPlanet: 'Moon',
              aspect: 'Square',
              orb: 0.4,
              score: 74,
            },
          ],
        },
      }
    );

    expect(confluence.tripleHit).toBe(true);
    expect(confluence.aligned).toBe(true);
    expect(confluence.sources).toEqual(
      expect.arrayContaining(['transit', 'solar-arc', 'profection'])
    );
  });

  it('amplifies intensity and confidence when triple hit is active', () => {
    const packet = computeAtmosphere({
      predictive: {
        events: [
          {
            scores: { intensity: 0.6, confidence: 0.7 },
            transit: { transitingPlanet: 'Saturn', aspect: 'Square', natalPlanet: 'Moon' },
          },
          {
            scores: { intensity: 0.58, confidence: 0.68 },
            transit: { transitingPlanet: 'Pluto', aspect: 'Opposition', natalPlanet: 'Moon' },
          },
          {
            scores: { intensity: 0.56, confidence: 0.66 },
            transit: { transitingPlanet: 'Mars', aspect: 'Square', natalPlanet: 'Moon' },
          },
        ],
      },
      temporal: {
        profection: {
          age: 42,
          profectedHouse: 7,
          profectedSign: 'Aquarius',
          timeLord: 'Saturn',
          themeOfYear: 'Saturn year.',
        },
        solarArc: {
          ageYears: 42,
          arcDegrees: 42,
          activeHits: [
            {
              directedPlanet: 'Saturn',
              natalPlanet: 'Moon',
              aspect: 'Square',
              orb: 0.3,
              score: 76,
            },
          ],
        },
      },
      forecast: { day_rating: 'red' },
    });

    expect(packet.confluence.tripleHit).toBe(true);
    expect(packet.provenance).toContain('triple-hit-amplification');
    expect(packet.temporal.timeLord).toBe('Saturn');
    expect(packet.temporal.solarArcHits?.length).toBe(1);
  });
});