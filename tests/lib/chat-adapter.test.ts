import { detectQueryMode, shouldSkipStructure } from '@/lib/chat-adapter';

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
