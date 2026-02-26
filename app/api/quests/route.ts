import { NextResponse } from 'next/server';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'mind' | 'heart' | 'body' | 'spirit' | 'shadow';
  difficulty: 1 | 2 | 3; // 1=daily, 2=weekly, 3=deep work
  xp: number;
  cosmicSource: string; // which transit/placement drives it
  completed?: boolean;
}

// Quest templates keyed by transit pattern
const TRANSIT_QUEST_TEMPLATES: Record<string, Quest[]> = {
  'moon': [
    { id: '', title: 'Track your emotional weather', description: 'For the next three days, write one sentence each morning about what you feel — before you check your phone.', category: 'mind', difficulty: 1, xp: 30, cosmicSource: 'Moon transit' },
    { id: '', title: 'One honest conversation', description: 'Tell someone something you\'ve been holding. Not to fix anything — just to let it exist outside you.', category: 'heart', difficulty: 2, xp: 60, cosmicSource: 'Lunar activation' },
  ],
  'mercury': [
    { id: '', title: 'Write the unsent letter', description: 'Write a letter you will never send. Say everything. Then decide what matters.', category: 'mind', difficulty: 1, xp: 40, cosmicSource: 'Mercury transit' },
    { id: '', title: 'Digital silence for 2 hours', description: 'Pick a 2-hour window today and operate without screens. Notice what thoughts arise in the quiet.', category: 'mind', difficulty: 1, xp: 35, cosmicSource: 'Mercury activation' },
  ],
  'venus': [
    { id: '', title: 'Beauty inventory', description: 'List five things you find beautiful right now — one for each sense. Then create or obtain one of them deliberately.', category: 'heart', difficulty: 1, xp: 30, cosmicSource: 'Venus transit' },
    { id: '', title: 'Repair one relationship', description: 'Reach out to someone you\'ve let drift. No agenda — just presence.', category: 'heart', difficulty: 2, xp: 80, cosmicSource: 'Venus activation' },
  ],
  'mars': [
    { id: '', title: 'Do the hard thing first', description: 'Identify the task you\'ve been avoiding. Do it within the hour — before anything else.', category: 'body', difficulty: 1, xp: 50, cosmicSource: 'Mars transit' },
    { id: '', title: 'Set one clear boundary', description: 'Identify something you\'ve been tolerating. Say no to it today — clearly, without apology.', category: 'shadow', difficulty: 2, xp: 90, cosmicSource: 'Mars activation' },
  ],
  'jupiter': [
    { id: '', title: 'Expand your map', description: 'Learn about one topic you know nothing about. Read for 30 minutes without goal or utility — pure curiosity.', category: 'mind', difficulty: 1, xp: 40, cosmicSource: 'Jupiter transit' },
    { id: '', title: 'Ask for more', description: 'Identify one area where you\'ve been settling. Make one move toward what you actually want this week.', category: 'spirit', difficulty: 2, xp: 70, cosmicSource: 'Jupiter expansion' },
  ],
  'saturn': [
    { id: '', title: 'The 30-day commitment', description: 'Choose one discipline — physical, mental, or creative — and commit to a small daily practice for 30 days. Write it down and track day 1 today.', category: 'body', difficulty: 3, xp: 150, cosmicSource: 'Saturn transit' },
    { id: '', title: 'Audit what costs you', description: 'List your three biggest time or energy drains. Pick one and remove it — or reduce it by 50% — this week.', category: 'shadow', difficulty: 2, xp: 80, cosmicSource: 'Saturn structure' },
  ],
  'uranus': [
    { id: '', title: 'Break one pattern', description: 'Identify a routine you run on autopilot. Change it deliberately today — take a different route, eat something unfamiliar, speak to someone new.', category: 'spirit', difficulty: 1, xp: 45, cosmicSource: 'Uranus transit' },
  ],
  'neptune': [
    { id: '', title: 'Dream record for 3 days', description: 'Keep a notebook by your bed. Write down anything you remember upon waking — fragments, feelings, colors. Don\'t analyze, just capture.', category: 'spirit', difficulty: 2, xp: 60, cosmicSource: 'Neptune activation' },
    { id: '', title: 'Create without purpose', description: 'Make something today — draw, write, arrange, build — with no audience and no goal. Let it be ugly.', category: 'spirit', difficulty: 1, xp: 40, cosmicSource: 'Neptune transit' },
  ],
  'pluto': [
    { id: '', title: 'The shadow interview', description: 'Write about a trait in others that irritates you the most. Then ask: where does that live in me? Sit with the answer for 24 hours before writing again.', category: 'shadow', difficulty: 3, xp: 120, cosmicSource: 'Pluto transit' },
    { id: '', title: 'Release one possession', description: 'Let go of one physical thing that represents an old identity or chapter. Donate, destroy, or meaningfully release it.', category: 'shadow', difficulty: 2, xp: 75, cosmicSource: 'Pluto transformation' },
  ],
};

// MBTI-tuned bonus quests
const MBTI_QUEST_OVERRIDES: Partial<Record<string, Quest>> = {
  INFJ: { id: '', title: 'Surface one prophetic knowing', description: 'Something you\'ve sensed but not said out loud — write it down. Not to do anything with it. Just to acknowledge you already know.', category: 'spirit', difficulty: 2, xp: 90, cosmicSource: 'INFJ inner sight' },
  INFP: { id: '', title: 'Write your personal myth', description: 'In 200 words, describe your life as a story of becoming. Who are you becoming, and at what cost?', category: 'spirit', difficulty: 2, xp: 85, cosmicSource: 'INFP inner world' },
  INTJ: { id: '', title: 'Stress-test one belief', description: 'Pick a conviction you haven\'t questioned in a while. Find one compelling argument against it. Sit with the discomfort.', category: 'mind', difficulty: 2, xp: 80, cosmicSource: 'INTJ precision' },
  ENFJ: { id: '', title: 'Receive without deflecting', description: 'Ask someone what they appreciate about you. Receive it fully — don\'t minimize, redirect, or return the compliment.', category: 'heart', difficulty: 2, xp: 75, cosmicSource: 'ENFJ relational depth' },
};

function pickQuestsFromTransits(planets: string[], mbtiType?: string): Quest[] {
  const selected: Quest[] = [];
  const usedCategories = new Set<string>();

  // 1. Pull one quest per active planet (max 4 planets)
  for (const planet of planets.slice(0, 4)) {
    const key = planet.toLowerCase();
    const pool = TRANSIT_QUEST_TEMPLATES[key];
    if (!pool) continue;
    // Prefer uncovered category
    const quest = pool.find(q => !usedCategories.has(q.category)) || pool[0];
    const withId: Quest = { ...quest, id: `quest_${key}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    selected.push(withId);
    usedCategories.add(quest.category);
  }

  // 2. Add MBTI bonus quest if type is known and category not yet covered
  if (mbtiType && MBTI_QUEST_OVERRIDES[mbtiType]) {
    const bonus = MBTI_QUEST_OVERRIDES[mbtiType]!;
    if (!usedCategories.has(bonus.category)) {
      selected.push({ ...bonus, id: `quest_mbti_${Date.now()}` });
    }
  }

  // 3. Fallback: always return at least 3 quests
  if (selected.length < 3) {
    const fallbackPlanets = ['moon', 'mars', 'saturn'];
    for (const fp of fallbackPlanets) {
      if (selected.length >= 3) break;
      const pool = TRANSIT_QUEST_TEMPLATES[fp];
      if (!pool) continue;
      const q = pool[0];
      if (!selected.find(s => s.title === q.title)) {
        selected.push({ ...q, id: `quest_fb_${fp}_${Date.now()}` });
      }
    }
  }

  return selected.slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chartData, transits, mbtiType } = body;

    // Extract active transit planets
    const transitPlanets: string[] = [];
    if (transits?.significant?.length) {
      for (const t of transits.significant) {
        if (t.transitingPlanet && !transitPlanets.includes(t.transitingPlanet.toLowerCase())) {
          transitPlanets.push(t.transitingPlanet.toLowerCase());
        }
      }
    }

    // Fallback: use planets from forecast
    if (transitPlanets.length === 0 && body.forecast?.planetaryHighlights?.length) {
      for (const h of body.forecast.planetaryHighlights as string[]) {
        const match = h.match(/^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)/i);
        if (match) transitPlanets.push(match[1].toLowerCase());
      }
    }

    // Ultimate fallback
    if (transitPlanets.length === 0) {
      transitPlanets.push('moon', 'mars', 'saturn');
    }

    const quests = pickQuestsFromTransits(transitPlanets, mbtiType);

    return NextResponse.json({
      success: true,
      data: { quests, generatedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Quests] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate quests' }, { status: 500 });
  }
}
