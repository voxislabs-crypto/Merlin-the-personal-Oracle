import {
  detectQueryMode,
  IDENTITY_DEEP_DIVE_MAX_TOKENS,
  isIdentityDualQuestion,
  oracleMaxTokensForQuestion,
  shouldSkipStructure,
} from '@/lib/chat-adapter';

describe('detectQueryMode', () => {
  it('routes life-weather and decision questions to full oracle', () => {
    expect(detectQueryMode('Is life friction high this week?')).toBe('astro');
    expect(detectQueryMode('Should I take the job?')).toBe('astro');
    expect(detectQueryMode('What do you see in my chart?')).toBe('astro');
    expect(detectQueryMode('Tell me about storms ahead')).toBe('astro');
  });

  it('routes pure small talk to casual', () => {
    expect(detectQueryMode('hey')).toBe('casual');
    expect(detectQueryMode('thanks')).toBe('casual');
    expect(detectQueryMode('how are you')).toBe('casual');
  });

  it('defaults ambiguous personal questions to full oracle', () => {
    expect(detectQueryMode('I feel off and I do not know why')).toBe('astro');
  });
});

describe('shouldSkipStructure', () => {
  it('flags raw emotional language', () => {
    expect(shouldSkipStructure('I am so scared and alone')).toBe(true);
    expect(shouldSkipStructure('What is my Venus doing?')).toBe(false);
  });
});

describe('isIdentityDualQuestion', () => {
  it('flags dual personality, Core/Mask, and misread asks', () => {
    expect(
      isIdentityDualQuestion(
        'I want to talk through my dual personality from the chart. Core INFP or INFJ. Mask INTP.',
      ),
    ).toBe(true);
    expect(isIdentityDualQuestion('How do people misread me?')).toBe(true);
    expect(isIdentityDualQuestion('Explain my Core vs Mask')).toBe(true);
    expect(isIdentityDualQuestion('What is Uranus squaring my Venus today?')).toBe(false);
  });

  it('raises the token cap for identity asks regardless of Core type', () => {
    const identity = 'Explain my Core vs Mask and how people misread me.';
    expect(oracleMaxTokensForQuestion(identity)).toBe(IDENTITY_DEEP_DIVE_MAX_TOKENS);
    expect(oracleMaxTokensForQuestion('What is Uranus squaring my Venus today?')).toBe(2200);
  });
});
