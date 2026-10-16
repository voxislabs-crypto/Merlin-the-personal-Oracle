import { buildOracleSystemPrompt, type OracleContext } from '@/lib/oracle-service';

const packet = {
  date: '2026-10-16',
  intensity: 62,
  feltIntensity: 62,
  readinessModifier: 1,
  dayRating: 'yellow',
  tone: { label: 'Caution' },
  dominantDriver: { label: 'Mars square Moon', rationale: 'Heat in the talks.', source: 'transit' },
  risk: {
    date: '2026-10-16',
    windowDays: 7,
    overallFriction: 62,
    level: 'friction',
    elevatedDisruption: true,
    confidence: 60,
    headline: 'Hard window',
    move: 'One priority.',
    topDrivers: [],
    frictionWindows: [
      {
        id: '1',
        kind: 'friction',
        label: 'Uranus square Venus',
        domains: ['love'],
        daysToPeak: 0,
        friction: 70,
        confidence: 60,
        source: 'transit',
      },
      {
        id: '2',
        kind: 'friction',
        label: 'Mars square Moon',
        domains: ['love'],
        daysToPeak: 0,
        friction: 62,
        confidence: 60,
        source: 'transit',
      },
    ],
    supportWindows: [],
    horizon: [],
    nextFrictionPeak: null,
    nextSupportPeak: null,
    domains: [],
    provenance: [],
    generatedAt: '2026-10-16T12:00:00.000Z',
  },
  temporal: { baselineTemperature: 'warm' },
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

function sightBlock(prompt: string): string {
  const start = prompt.indexOf('FUTURE SIGHT (possible');
  const end = prompt.indexOf('VOICE STRATEGY');
  return prompt.slice(start, end === -1 ? undefined : end);
}

describe('oracle future sight', () => {
  it('loads the structured object and leaves it unsaid on an ordinary question', () => {
    const prompt = buildOracleSystemPrompt({
      currentQuestion: 'Why does today feel sharp with my partner?',
      conversationHistory: [],
      atmospherePacket: packet,
      mbtiType: 'INFP',
    } as OracleContext);

    const block = sightBlock(prompt);
    expect(block).toContain('evidence: Uranus square Venus; Mars square Moon');
    expect(block).toContain('uncertainty: low');
    expect(block).toMatch(/leave this block unsaid/);
    expect(block).not.toMatch(/%/);
    expect(block).not.toMatch(/INFP/);
    expect(prompt).toMatch(/FUTURE SIGHT —/);
    expect(prompt).toMatch(/Advanced timing \(profection, solar arc, returns\): withheld/);
  });

  it('tells Merlin to explain the object when the person asks what to watch', () => {
    const prompt = buildOracleSystemPrompt({
      currentQuestion: 'What should I watch over the next few days?',
      conversationHistory: [],
      atmospherePacket: packet,
    } as OracleContext);

    const block = sightBlock(prompt);
    expect(block).toMatch(/asked about the near term/);
    expect(block).toContain('horizon: today');
    expect(block).not.toMatch(/leave this block unsaid/);
    expect(prompt).not.toMatch(/Annual profection:/);
  });
});
