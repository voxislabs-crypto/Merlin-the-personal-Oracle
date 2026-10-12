import { buildOracleSystemPrompt, type OracleContext } from '@/lib/oracle-service';
import { classifyDiscussionTurn } from '@/lib/discussion-controller';

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
    expect(prompt).toMatch(/Ignore the persona word cap/);
    expect(prompt).not.toMatch(/Target 40–70 words/);
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
