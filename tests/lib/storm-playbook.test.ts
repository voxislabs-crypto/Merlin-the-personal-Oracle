import {
  applyDualStormPlaybook,
  buildStormPlaybook,
  classifyStormCategory,
  composeStormLead,
  computeStormConfidence,
  enrichStorms,
  groupStormsByCategory,
  isGenericStormNav,
} from '@/lib/astrology/storm-playbook';

const baseStorm = {
  date: '2026-08-08',
  dayName: 'Saturday',
  title: 'Saturn Square Venus',
  intensity: 'severe' as const,
  transitingPlanet: 'Saturn',
  natalPlanet: 'Venus',
  aspect: 'Square',
  orb: 0.6,
  lifeArea: 'Love & Relationships',
  description:
    'Saturn casts a cold square on Venus. Relationships feel heavy, transactional, or distant.',
  navigation: 'Speak from vision, not fear. If something needs to change, name it once clearly.',
  recoveryNote: 'Reconnect with one trusted person after the peak.',
  peakWindow: 'Pressure builds through afternoon, easing late evening.',
  intensityScore: 8,
  phase: 'peak' as const,
  keywords: ['relationship strain', 'financial pressure', 'love tested'],
};

describe('storm-playbook', () => {
  it('classifies Venus/Saturn into social and/or financial', () => {
    const { category, secondaryCategory } = classifyStormCategory(baseStorm);
    expect(['social', 'financial']).toContain(category);
    // secondary optional but often the other domain
    if (secondaryCategory) {
      expect(['social', 'financial', 'work', 'health']).toContain(secondaryCategory);
    }
  });

  it('classifies Mars-Sun style hits toward work', () => {
    const { category } = classifyStormCategory({
      ...baseStorm,
      title: 'Mars Square Sun',
      transitingPlanet: 'Mars',
      natalPlanet: 'Sun',
      lifeArea: 'Identity & Confidence',
      keywords: ['aggression', 'ego clash'],
      description: 'Mars fires a tense angle at your Sun. Ego collisions are likely.',
    });
    expect(category).toBe('work');
  });

  it('classifies Moon health/emotional load toward health', () => {
    const { category } = classifyStormCategory({
      ...baseStorm,
      title: 'Mars Square Moon',
      transitingPlanet: 'Mars',
      natalPlanet: 'Moon',
      lifeArea: 'Emotional Wellbeing',
      keywords: ['emotional reactivity', 'irritability'],
      description: 'Mars agitates your emotional core. Fatigue and reactivity rise.',
    });
    expect(['health', 'social']).toContain(category);
  });

  it('builds confidence, when, and actionable steps', () => {
    const playbook = buildStormPlaybook(baseStorm, new Date('2026-08-05T12:00:00'));
    expect(playbook.confidence).toBeGreaterThanOrEqual(50);
    expect(playbook.confidence).toBeLessThanOrEqual(94);
    expect(playbook.when.daysUntil).toBe(3);
    expect(playbook.when.relativeLabel).toMatch(/day/);
    expect(playbook.when.summary.length).toBeGreaterThan(10);
    expect(playbook.actionableSteps.length).toBeGreaterThanOrEqual(2);
    expect(playbook.avoidSteps.length).toBeGreaterThanOrEqual(1);
    expect(playbook.plainTitle.length).toBeGreaterThan(5);
    expect(playbook.categoryLabel.length).toBeGreaterThan(3);
  });

  it('groups enriched storms by category', () => {
    const enriched = enrichStorms([
      baseStorm,
      {
        ...baseStorm,
        id: '2',
        title: 'Mars Square Sun',
        transitingPlanet: 'Mars',
        natalPlanet: 'Sun',
        lifeArea: 'Drive & Conflict',
        keywords: ['conflict'],
        description: 'Work drive under fire.',
      },
    ] as any);
    const groups = groupStormsByCategory(enriched as any);
    const total =
      groups.social.length +
      groups.work.length +
      groups.financial.length +
      groups.health.length;
    expect(total).toBe(2);
  });

  it('does not treat the old slow-down proverb as a real move', () => {
    expect(
      isGenericStormNav(
        'When this storm approaches, slow down. Reflect on what this area of life has been asking of you, and choose one deliberate action rather than reacting.',
      ),
    ).toBe(true);
    expect(isGenericStormNav('Have one clear conversation — or none.')).toBe(false);
  });

  it('composes different Core/Mask leads for social vs health', () => {
    const social = composeStormLead({
      category: 'social',
      coreType: 'INFP',
      maskType: 'INTP',
    });
    const health = composeStormLead({
      category: 'health',
      coreType: 'INFP',
      maskType: 'INTP',
    });
    expect(social?.lead).toBeTruthy();
    expect(health?.lead).toBeTruthy();
    expect(social?.lead).not.toBe(health?.lead);
    expect(social?.lead.toLowerCase()).toMatch(/people|text|relationship|test/);
    expect(health?.lead.toLowerCase()).toMatch(/sleep|depletion|food|body/);
    expect(social?.lead.toLowerCase()).not.toMatch(/when this storm approaches/);
    expect(health?.lead.toLowerCase()).not.toMatch(/when this storm approaches/);
  });

  it('replaces cached generic navigation with dual compose', () => {
    const generic =
      'When this storm approaches, slow down. Reflect on what this area of life has been asking of you, and choose one deliberate action rather than reacting.';
    const patched = applyDualStormPlaybook(
      {
        ...baseStorm,
        category: 'social' as const,
        actionableSteps: [generic, 'Have one clear conversation — or none.'],
        avoidSteps: ['Don’t process big relationship drama over text at peak hours.'],
      },
      'INFP',
      'INTP',
    );
    expect(patched.actionableSteps[0].toLowerCase()).not.toMatch(/when this storm approaches/);
    expect(patched.actionableSteps.some((s) => isGenericStormNav(s))).toBe(false);
  });
});
