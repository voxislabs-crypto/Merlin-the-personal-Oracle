jest.mock('@/lib/llm-config', () => ({
  chatCompletion: jest.fn(),
  isLlmConfigured: () => true,
}));

import { chatCompletion } from '@/lib/llm-config';
import { serverCache } from '@/lib/cache-service';
import { hotDomainLabels, supportingFactLines } from '@/lib/atmosphere/today-brief-evidence';
import {
  polishTodayBrief,
  todayBriefCacheKey,
  type TodayBriefPolishInput,
} from '@/lib/atmosphere/today-oracle/personal-ai';

const MEANING =
  'Career pressure and a Gemini Moon make the private read move faster than the public face can close it.';
const WATCH =
  'Between 2 and 4, the public face answers before the private read is finished.';
const TENSION =
  'The private read wants one more pass while the public face wants the step closed.';

function sample(overrides: Partial<TodayBriefPolishInput> = {}): TodayBriefPolishInput {
  return {
    date: '2026-11-12',
    leadFact: 'Moon squares natal Mars',
    leadFactDisplay: 'Moon square Mars',
    chartWhy: 'The deterministic why names the hour the pace splits from the private read.',
    move: 'Say the difference once, then stop.',
    watchFor: 'Between 2 and 4, notice the snap.',
    operationalTension: 'The private standard and the public pace are asking for different speeds.',
    doNot: 'Do not reopen the finished thread.',
    coreType: 'infp',
    maskType: 'INTJ',
    sunSign: 'Scorpio',
    moonSign: 'Gemini',
    moonPhase: 'Waxing',
    domains: ['Work', 'Money'],
    supportingFacts: ['Work: a decision is waiting', 'Give the work domain the hour and leave money alone.'],
    heldFromYesterday: false,
    yesterdayRestless: true,
    streak: 4,
    ...overrides,
  };
}

function reply(fields: Record<string, unknown>): string {
  return JSON.stringify(fields);
}

function goodReply(): string {
  return reply({ chartWhy: MEANING, watchFor: WATCH, operationalTension: TENSION });
}

describe('today brief evidence packet', () => {
  it('keeps only hot domains, loudest first', () => {
    expect(
      hotDomainLabels([
        { name: 'love', label: 'Bonds', friction: 20 },
        { name: 'money', label: 'Money', friction: 60 },
        { name: 'career', label: 'Work', friction: 81 },
        { name: 'health', label: 'Body', friction: 48 },
        { name: 'self', label: 'Self', friction: 70 },
        { name: 'family', label: 'Home', friction: 55 },
      ]),
    ).toEqual(['Work', 'Self', 'Money', 'Home']);
  });

  it('sends up to three supporting signals plus the domain job', () => {
    expect(
      supportingFactLines(
        [
          { label: 'Work', hint: 'a decision is waiting' },
          { label: 'Money', hint: 'a number needs a night' },
          { label: 'Home', hint: 'mood in the room' },
          { label: 'Body', hint: 'left out' },
        ],
        'Give the work domain the hour.',
      ),
    ).toEqual([
      'Work: a decision is waiting',
      'Money: a number needs a night',
      'Home: mood in the room',
      'Give the work domain the hour.',
    ]);
  });

  it('changes the cache key when the evidence changes and ignores whitespace', () => {
    const base = todayBriefCacheKey(sample());
    expect(todayBriefCacheKey(sample({ move: '  Say the difference once, then stop.  ' }))).toBe(base);
    expect(todayBriefCacheKey(sample({ coreType: 'INFP' }))).toBe(base);
    expect(todayBriefCacheKey(sample({ move: 'Wait until the window closes.' }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ domains: ['Home'] }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ moonPhase: 'Full' }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ moonSign: 'Cancer' }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ supportingFacts: ['Home: mood in the room'] }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ chartWhy: 'A different calculated explanation of the same sky.' }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ watchFor: 'After 6, notice the snap.' }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ maskType: 'ENTJ' }))).not.toBe(base);
    expect(todayBriefCacheKey(sample({ coreType: 'ENTP' }))).not.toBe(base);
    expect(base.startsWith('today-brief|evidence-v2|three-lines-v1|')).toBe(true);
  });
});

describe('polishTodayBrief', () => {
  const previousEnabled = process.env.TODAY_BRIEF_LLM_ENABLED;
  const previousTimeout = process.env.TODAY_BRIEF_LLM_TIMEOUT_MS;

  beforeEach(() => {
    process.env.TODAY_BRIEF_LLM_ENABLED = 'true';
    delete process.env.TODAY_BRIEF_LLM_TIMEOUT_MS;
    serverCache.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (previousEnabled === undefined) delete process.env.TODAY_BRIEF_LLM_ENABLED;
    else process.env.TODAY_BRIEF_LLM_ENABLED = previousEnabled;
    if (previousTimeout === undefined) delete process.env.TODAY_BRIEF_LLM_TIMEOUT_MS;
    else process.env.TODAY_BRIEF_LLM_TIMEOUT_MS = previousTimeout;
  });

  it('asks for meaning and guidance from the supplied evidence', async () => {
    (chatCompletion as jest.Mock).mockResolvedValue(goodReply());

    const result = await polishTodayBrief(sample());

    expect(result).toEqual({
      chartWhy: MEANING,
      watchFor: WATCH,
      operationalTension: TENSION,
      source: 'llm',
    });
    const call = (chatCompletion as jest.Mock).mock.calls[0][0];
    expect(call.maxTokens).toBe(1600);
    expect(call.messages[0].content).toMatch(/What the chart says/);
    expect(call.messages[0].content).toMatch(/What that evidence may mean/);
    expect(call.messages[0].content).toMatch(/What to do with it/);
    expect(call.messages[0].content).toMatch(/Style for this Core: prefer flowing, open-ended phrasing/);
    expect(call.messages[0].content).toMatch(/Style for the action sentence: prefer numbered steps/);
    expect(call.messages[0].content).toMatch(/Never print MBTI type codes/);
    expect(call.messages[0].content).toMatch(/Max 420 characters for chartWhy/);
    expect(call.messages[0].content).not.toMatch(/return it unchanged/i);
    expect(call.messages[0].content).not.toMatch(/rewrite pass|second pass|chatCompletion/i);
    expect(call.messages[1].content).toContain('Hot domains: Work, Money');
    expect(call.messages[1].content).toContain('Moon: Waxing Gemini');
    expect(call.messages[1].content).toContain('Work: a decision is waiting');
    expect(call.messages[1].content).toContain('Core: INFP');
    expect(call.messages[1].content).toContain('Mask: INTJ');
    expect(call.messages[1].content).toContain('Move (keep this action): Say the difference once, then stop.');
    expect(call.messages[1].content).toContain('Watch window (keep this window): Between 2 and 4, notice the snap.');
    expect(call.messages[1].content).toContain('User flagged restlessness yesterday.');
  });

  it('feeds contrasting packets different hits, domains, moons, and watch windows', async () => {
    (chatCompletion as jest.Mock).mockResolvedValue(goodReply());

    await polishTodayBrief(
      sample({
        leadFact: 'Mars squares natal Saturn',
        domains: ['Work'],
        moonPhase: 'Full',
        moonSign: 'Capricorn',
        watchFor: 'Between 2 and 4, notice the snap.',
        coreType: 'INTJ',
        maskType: 'INTJ',
      }),
    );
    await polishTodayBrief(
      sample({
        leadFact: 'Venus trines natal Moon',
        domains: ['Bonds', 'Home', 'Money'],
        moonPhase: 'New',
        moonSign: 'Pisces',
        watchFor: 'After 8, notice the pull.',
        coreType: 'INFP',
        maskType: 'ENTJ',
      }),
    );

    const prompts = (chatCompletion as jest.Mock).mock.calls.map(
      (call) => call[0].messages[1].content as string,
    );
    expect(prompts[0]).toContain('Chart hit: Mars squares natal Saturn');
    expect(prompts[0]).toContain('Hot domains: Work');
    expect(prompts[0]).toContain('Moon: Full Capricorn');
    expect(prompts[0]).toContain('Watch window (keep this window): Between 2 and 4, notice the snap.');
    expect(prompts[0]).not.toContain('Venus trines natal Moon');
    expect(prompts[1]).toContain('Chart hit: Venus trines natal Moon');
    expect(prompts[1]).toContain('Hot domains: Bonds, Home, Money');
    expect(prompts[1]).toContain('Moon: New Pisces');
    expect(prompts[1]).toContain('Watch window (keep this window): After 8, notice the pull.');
    expect(prompts[1]).not.toContain('Mars squares natal Saturn');
    expect(prompts[0]).toContain('Core: INTJ');
    expect(prompts[0]).toContain('Mask: INTJ');
    expect(prompts[1]).toContain('Core: INFP');
    expect(prompts[1]).toContain('Mask: ENTJ');
  });

  it('reuses the cache for the same packet and misses when move, domains, or the Moon change', async () => {
    (chatCompletion as jest.Mock).mockResolvedValue(goodReply());

    await polishTodayBrief(sample());
    await polishTodayBrief(sample({ move: '  Say the difference once, then stop. ' }));
    expect(chatCompletion).toHaveBeenCalledTimes(1);

    await polishTodayBrief(sample({ move: 'Wait until the window closes.' }));
    await polishTodayBrief(sample({ domains: ['Home'] }));
    await polishTodayBrief(sample({ moonPhase: 'Full', moonSign: 'Cancer' }));
    expect(chatCompletion).toHaveBeenCalledTimes(4);
  });

  it('does not cache a malformed response, so the next packet can still polish', async () => {
    (chatCompletion as jest.Mock)
      .mockResolvedValueOnce('not json')
      .mockResolvedValueOnce('{ "chartWhy": ')
      .mockResolvedValueOnce(goodReply());

    await expect(polishTodayBrief(sample())).resolves.toBeNull();
    await expect(polishTodayBrief(sample())).resolves.toBeNull();
    await expect(polishTodayBrief(sample())).resolves.toMatchObject({ chartWhy: MEANING, source: 'llm' });
    expect(chatCompletion).toHaveBeenCalledTimes(3);
  });

  it('returns null on timeout and does not cache the miss', async () => {
    jest.useFakeTimers();
    process.env.TODAY_BRIEF_LLM_TIMEOUT_MS = '50';
    let release: (value: string) => void = () => {};
    (chatCompletion as jest.Mock).mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );

    const pending = polishTodayBrief(sample());
    await jest.advanceTimersByTimeAsync(50);
    await expect(pending).resolves.toBeNull();
    expect(serverCache.get(todayBriefCacheKey(sample()))).toBeNull();

    release(goodReply());
    jest.useRealTimers();
    (chatCompletion as jest.Mock).mockResolvedValue(goodReply());
    await expect(polishTodayBrief(sample())).resolves.toMatchObject({ chartWhy: MEANING });
    expect(chatCompletion).toHaveBeenCalledTimes(2);
  });

  it('keeps the deterministic brief when the model echoes it or fails the voice test', async () => {
    const input = sample();
    (chatCompletion as jest.Mock).mockResolvedValueOnce(
      reply({
        chartWhy: `  ${input.chartWhy} `,
        watchFor: input.watchFor,
        operationalTension: input.operationalTension,
      }),
    );

    await expect(polishTodayBrief(input)).resolves.toBeNull();
    expect(serverCache.get(todayBriefCacheKey(input))).toBeNull();

    (chatCompletion as jest.Mock).mockResolvedValueOnce(
      reply({
        chartWhy: 'You will meet someone important before the day ends and money is coming with them.',
        watchFor: 'Fate has decided the afternoon and your soulmate arrives then.',
        operationalTension: TENSION,
      }),
    );
    await expect(polishTodayBrief(input)).resolves.toBeNull();
    expect(chatCompletion).toHaveBeenCalledTimes(2);

    (chatCompletion as jest.Mock).mockResolvedValueOnce(
      reply({
        chartWhy: 'The INFP private read feels the work pressure before the public face admits the split today.',
        watchFor: 'You will find the answer between 2 and 4 if you trust the universe.',
        operationalTension: null,
      }),
    );
    await expect(polishTodayBrief(input)).resolves.toBeNull();

    (chatCompletion as jest.Mock).mockResolvedValueOnce(
      reply({
        chartWhy: MEANING,
        watchFor: input.watchFor,
        operationalTension: 'INFP wants the private read to stay gentle while the public face closes it now.',
      }),
    );
    const partial = await polishTodayBrief(input);
    expect(partial).toEqual({
      chartWhy: MEANING,
      watchFor: input.watchFor,
      operationalTension: input.operationalTension,
      source: 'llm',
    });
    expect(JSON.stringify(partial)).not.toMatch(/\bINFP\b/);
    expect(JSON.stringify(partial)).not.toMatch(/soulmate|you will/i);

    await expect(polishTodayBrief(input)).resolves.toEqual(partial);
    expect(chatCompletion).toHaveBeenCalledTimes(4);
  });

  it('returns null when the model throws and does not cache the failure', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    (chatCompletion as jest.Mock).mockRejectedValueOnce(new Error('provider down'));

    await expect(polishTodayBrief(sample())).resolves.toBeNull();
    expect(serverCache.get(todayBriefCacheKey(sample()))).toBeNull();

    (chatCompletion as jest.Mock).mockResolvedValueOnce(goodReply());
    await expect(polishTodayBrief(sample())).resolves.toMatchObject({ chartWhy: MEANING });
    expect(chatCompletion).toHaveBeenCalledTimes(2);
    jest.restoreAllMocks();
  });
});
