import { buildOracleSystemPrompt, type OracleContext } from '@/lib/oracle-service';
import { asksForSecondaryTool } from '@/lib/oracle-secondary';
import { dailyOracleOpener } from '@/lib/daily-oracle-copy';

const packet = {
  date: '2026-10-16',
  intensity: 62,
  feltIntensity: 62,
  readinessModifier: 1,
  dayRating: 'yellow',
  tone: { label: 'Caution' },
  dominantDriver: { label: 'Mars square Moon', rationale: 'Heat in the talks.', source: 'transit' },
  temporal: {
    baselineTemperature: 'warm',
    profectedSign: 'Leo',
    profectedHouse: 5,
    timeLord: 'Sun',
    themeOfYear: 'Creative risk',
    solarArcAge: 34.2,
    solarArcHits: [{ directedPlanet: 'Mars', aspect: 'square', natalPlanet: 'Venus', orb: 0.4 }],
  },
  confluence: { aligned: false, tripleHit: false, themes: [], signalCount: 0, sources: [] },
  realityCheck: {
    sentimentScore: null,
    readinessModifier: 1,
    feltIntensity: 62,
    gap: 0,
    guidanceBranch: 'neutral',
    guidanceNote: '',
    source: 'none',
  },
  patterns: { active: [], modifier: 1, tags: [], provenance: [] },
  confidence: 70,
  provenance: [],
  generatedAt: '2026-10-16T12:00:00.000Z',
} as OracleContext['atmospherePacket'];

describe('secondary tools stay out of ordinary oracle turns', () => {
  it('recognizes an explicit tool ask', () => {
    expect(asksForSecondaryTool('How heavy is today?')).toBe(false);
    expect(asksForSecondaryTool('What does my solar arc say this year?')).toBe(true);
    expect(asksForSecondaryTool('Run the numerology on my name')).toBe(true);
  });

  it('withholds profection and solar arc on an ordinary question', () => {
    const prompt = buildOracleSystemPrompt({
      currentQuestion: 'Why does today feel sharp with my partner?',
      conversationHistory: [],
      atmospherePacket: packet,
      userContext: {
        situation: 'shared apartment',
        mood: 'tight',
        goals: [],
        arcPath: 'Path of Truth',
        arcLevel: 4,
      },
      timeline: {
        lookAheadMonths: 12,
        phases: [{ theme: 'Rebuild', lifeTheme: 'Home' }],
        majorTurningPoints: [],
        yearlyNarrative: 'A long year.',
      },
    } as OracleContext);

    expect(prompt).toMatch(/Advanced timing \(profection, solar arc, returns\): withheld/);
    expect(prompt).not.toMatch(/Annual profection:/);
    expect(prompt).not.toMatch(/Active solar arc hits:/);
    expect(prompt).not.toMatch(/Arc Path:/);
    expect(prompt).not.toMatch(/TIME MACHINE CONTEXT/);
    expect(prompt).toMatch(/SECONDARY TOOLS/);
  });

  it('includes advanced timing when the user asks for it', () => {
    const prompt = buildOracleSystemPrompt({
      currentQuestion: 'What is my solar arc doing to Venus?',
      conversationHistory: [],
      atmospherePacket: packet,
      userContext: {
        situation: '',
        mood: '',
        goals: [],
        arcPath: 'Path of Truth',
        arcLevel: 2,
      },
    } as OracleContext);

    expect(prompt).toMatch(/Annual profection: Leo/);
    expect(prompt).toMatch(/Active solar arc hits: Mars square natal Venus/);
    expect(prompt).toMatch(/Arc Path: Path of Truth/);
  });
});

describe('daily oracle opener', () => {
  it('does not lead with a life-arc level', () => {
    expect(dailyOracleOpener({ clientDate: '2026-10-16' })).toBe('Daily Oracle · 2026-10-16.');
    expect(dailyOracleOpener({ truthBomb: true, clientDate: '2026-10-16' })).toMatch(/Truth Bomb/);
    expect(dailyOracleOpener({ truthBomb: true })).not.toMatch(/Level \d+|Path of/);
  });
});
