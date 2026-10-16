import { buildOracleSystemPrompt, type OracleContext } from '@/lib/oracle-service';
import {
  classifyDiscussionTurn,
  formatRejectedReplyRewrite,
  questionAskedToCapture,
  replyBreaksConversation,
  replyDefaultsToCapture,
  scrubPriorAssistantReply,
  stripWeatherCardShape,
} from '@/lib/discussion-controller';

describe('classifyDiscussionTurn', () => {
  it('treats a meter question as a reading and allows percentages', () => {
    const turn = classifyDiscussionTurn({ question: 'How bad is today?' });
    expect(turn.register).toBe('reading');
    expect(turn.allowPercentages).toBe(true);
    expect(turn.reason).toBe('meter');
    expect(turn.loosenLength).toBe(false);
  });

  it('treats chart mechanics as a reading', () => {
    const turn = classifyDiscussionTurn({
      question: 'What is Venus doing to my chart this week?',
    });
    expect(turn.register).toBe('reading');
    expect(turn.reason).toBe('mechanics');
    expect(turn.allowPercentages).toBe(true);
  });

  it('treats a general in-scope question as conversation with no percentages', () => {
    const turn = classifyDiscussionTurn({
      question: 'Why do I keep having the same fight with my partner?',
    });
    expect(turn.register).toBe('discussion');
    expect(turn.allowPercentages).toBe(false);
    expect(turn.loosenLength).toBe(true);
    expect(turn.reason).toBe('conversation');
  });

  it('keeps an elaborate or step-away ask off the scale', () => {
    const elaborate = classifyDiscussionTurn({
      question: 'Can you elaborate on that?',
    });
    expect(elaborate.register).toBe('discussion');
    expect(elaborate.allowPercentages).toBe(false);
    expect(elaborate.reason).toBe('elaborate');
    expect(elaborate.minWords).toBeGreaterThanOrEqual(200);

    const stepAway = classifyDiscussionTurn({
      question: 'Talk to me about this without the percentages.',
      oracleMode: 'detailed',
    });
    expect(stepAway.register).toBe('discussion');
    expect(stepAway.allowPercentages).toBe(false);
    expect(stepAway.reason).toBe('step-away');
  });

  it('lets a short follow-up stay in conversation', () => {
    const turn = classifyDiscussionTurn({ question: 'go on' });
    expect(turn.register).toBe('discussion');
    expect(turn.allowPercentages).toBe(false);
    expect(turn.reason).toBe('elaborate');
  });

  it('hides percentages on a reading when the preference is off', () => {
    const turn = classifyDiscussionTurn({
      question: 'How bad is today?',
      includeLikelihood: false,
    });
    expect(turn.register).toBe('reading');
    expect(turn.allowPercentages).toBe(false);
  });

  it('uses detailed mode for a general question, unless they step off the scale', () => {
    const detailed = classifyDiscussionTurn({
      question: 'What should I be thinking about with work?',
      oracleMode: 'detailed',
    });
    expect(detailed.register).toBe('reading');
    expect(detailed.reason).toBe('detailed');
  });
});

describe('weather card replies', () => {
  const card = `Headline:
 Build an ADHD-anxiety system, but start with one steady habit today.
Why:
 Storm Watch 90 alarm flags the day's intensity, and friction 71 means a big push will knot your chest.
Move:
 Set a 10-minute timer, finish one work task before 2 pm, then pause.`;

  it('rejects the headline card and score cites on a conversation turn', () => {
    expect(replyBreaksConversation(card, false)).toBe(true);
    expect(replyBreaksConversation('Talk this through with me in plain paragraphs.', false)).toBe(false);
    expect(replyBreaksConversation('Friction is up, but here is the call.', true)).toBe(false);
  });

  it('stops a prior card from teaching the next reply', () => {
    expect(scrubPriorAssistantReply(card)).toMatch(/Ignore the previous weather-card/);
    expect(scrubPriorAssistantReply('You already know the call. Keep the boundary.')).toBe(
      'You already know the call. Keep the boundary.',
    );
  });

  it('strips labels and meter figures when a rewrite still comes back as a card', () => {
    const stripped = stripWeatherCardShape(card);
    expect(stripped).not.toMatch(/Headline:/);
    expect(stripped).not.toMatch(/Why:/);
    expect(stripped).not.toMatch(/Move:/);
    expect(stripped).not.toMatch(/Storm Watch 90/);
    expect(stripped).not.toMatch(/friction 71/);
  });

  it('strips the renamed meters on a conversation rewrite', () => {
    const renamed =
      'Symbolic intensity 85 (heuristic) is loud today. Friction load 71 means the push will knot. Reading confidence 64 is just how clean the read is.';
    expect(replyBreaksConversation(renamed, false)).toBe(true);
    expect(replyBreaksConversation(renamed, true)).toBe(false);
    const stripped = stripWeatherCardShape(renamed);
    expect(stripped).not.toMatch(/Symbolic intensity 85/);
    expect(stripped).not.toMatch(/Friction load 71/);
    expect(stripped).not.toMatch(/Reading confidence 64/);
  });
});

describe('capture-default replies', () => {
  const note =
    'Write a brief, private note that states exactly what you value, then jot a "done" line in a notebook.';

  it('flags a private-note resolution and ignores a complaint that mentions writing', () => {
    expect(replyDefaultsToCapture(note)).toBe(true);
    expect(
      questionAskedToCapture(
        'you see where it always suggests to write something down? I do not want that.',
      ),
    ).toBe(false);
    expect(questionAskedToCapture('Help me draft a short note to them.')).toBe(true);
  });

  it('does not treat a spoken difference as a writing task', () => {
    expect(
      replyDefaultsToCapture(
        'Say the difference once, then stop. You do not have to agree with their frame.',
      ),
    ).toBe(false);
  });

  it('tells a rejected writing card to keep the stance', () => {
    const prompt = formatRejectedReplyRewrite('I do not agree, and doing it sends the wrong message.', [
      'You resolved the turn by telling them to write something down.',
    ]);
    expect(prompt).toMatch(/Keep their stance/);
    expect(prompt).toMatch(/do not assign that step again/i);
    expect(prompt).toMatch(/No line may be Headline/);
  });
});

describe('oracle prompt discussion controller', () => {
  const base = {
    conversationHistory: [],
    birthChart: {
      planets: [
        { name: 'Sun', sign: 'Leo' },
        { name: 'Moon', sign: 'Cancer' },
      ],
      ascendant: { sign: 'Scorpio' },
      aspects: [],
    },
    dualPersonality: { core: 'INFJ', mask: 'INTP', final: 'INFJ' },
    mbtiType: 'INFJ',
  } as OracleContext;

  it('tells a general question to stay off the scale and drop the persona cap', () => {
    const prompt = buildOracleSystemPrompt({
      ...base,
      currentQuestion: 'Why do I keep having the same fight with my partner?',
    });
    expect(prompt).toMatch(/DISCUSSION CONTROLLER: conversation/);
    expect(prompt).toMatch(/No percentages/);
    expect(prompt).toMatch(/three-part card is a failed answer/);
    expect(prompt).toMatch(/write it down/);
    expect(prompt).toMatch(/do not repackage that move as a private note/i);
    expect(prompt).toMatch(/Ignore the persona word cap/);
    expect(prompt).not.toMatch(/Target 40–70 words/);
  });

  it('hides storm and friction figures when the question is not a meter', () => {
    const prompt = buildOracleSystemPrompt({
      ...base,
      currentQuestion:
        'should I say fuck the world and do me, or should I submit? I need to manage my ADHD and anxiety from here on.',
      atmospherePacket: {
        date: '2026-10-12',
        intensity: 90,
        feltIntensity: 90,
        readinessModifier: 1,
        dayRating: 'red',
        tone: { label: 'Storm Watch' },
        dominantDriver: { label: 'Saturn square Moon', rationale: 'Pressure is elevated.', source: 'transit' },
        risk: {
          date: '2026-10-12',
          windowDays: 7,
          overallFriction: 71,
          level: 'friction',
          elevatedDisruption: true,
          confidence: 70,
          headline: 'Hard window',
          move: 'Finish one work task before 2 pm.',
          topDrivers: [],
          frictionWindows: [],
          supportWindows: [],
          horizon: [],
          nextFrictionPeak: null,
          nextSupportPeak: null,
          domains: [],
          provenance: [],
          generatedAt: '2026-10-12T12:00:00.000Z',
        },
        temporal: { baselineTemperature: 'neutral' },
        confluence: { aligned: false, tripleHit: false, themes: [], signalCount: 0, sources: [] },
        realityCheck: {
          sentimentScore: null,
          readinessModifier: 1,
          feltIntensity: 90,
          gap: 0,
          guidanceBranch: 'neutral',
          guidanceNote: '',
          source: 'none',
        },
        patterns: { active: [], modifier: 1, tags: [], provenance: [] },
        confidence: 70,
        provenance: [],
        generatedAt: '2026-10-12T12:00:00.000Z',
      } as OracleContext['atmospherePacket'],
    });

    expect(prompt).toMatch(/SCORE PAIR: hidden/);
    expect(prompt).toMatch(/Never print a line that is Headline, Why, or Move/);
    expect(prompt).not.toMatch(/Storm Watch 90/);
    expect(prompt).not.toMatch(/friction 71\/100/);
    expect(prompt).not.toMatch(/Finish one work task before 2 pm/);
  });

  it('keeps a meter question on the reading path', () => {
    const prompt = buildOracleSystemPrompt({
      ...base,
      currentQuestion: 'How bad is today?',
    });
    expect(prompt).toMatch(/DISCUSSION CONTROLLER: reading/);
    expect(prompt).toMatch(/name the meter/);
  });

  it('does not let conversation length fight an identity deep dive', () => {
    const prompt = buildOracleSystemPrompt({
      ...base,
      currentQuestion: 'Explain my Core vs Mask and how people misread me.',
    });
    expect(prompt).toMatch(/IDENTITY ASK: 400–1200 words/);
    expect(prompt).toMatch(/DISCUSSION CONTROLLER: identity deep dive/);
    expect(prompt).not.toMatch(/Write 160–\d+ words/);
    expect(prompt).not.toMatch(/Target \d+–\d+ words/);
  });
});
