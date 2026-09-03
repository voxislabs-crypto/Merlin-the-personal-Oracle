import {
  MERLIN_PRODUCT_CLAIM,
  MERLIN_VOICE_SYSTEM_BLOCK,
  failsMerlinVoiceTest,
  lintMerlinVoice,
  softRewriteMerlinVoice,
} from '@/lib/voice/merlin-voice';

describe('merlin-voice', () => {
  it('exports a product claim and system block', () => {
    expect(MERLIN_PRODUCT_CLAIM).toMatch(/Not a horoscope/i);
    expect(MERLIN_VOICE_SYSTEM_BLOCK).toMatch(/Merlin Test/i);
    expect(MERLIN_VOICE_SYSTEM_BLOCK).toMatch(/What does this actually mean for me/i);
    expect(MERLIN_VOICE_SYSTEM_BLOCK).toMatch(/Storm Watch 85, friction 71/);
  });

  it('flags fluff and fortunes', () => {
    expect(failsMerlinVoiceTest('Stay mindful of cosmic energies')).toBe(true);
    expect(failsMerlinVoiceTest('Money is coming your way soon')).toBe(true);
    expect(failsMerlinVoiceTest('One work priority only. Leave slack for a reset.')).toBe(
      false,
    );
  });

  it('soft-rewrites common failures', () => {
    const out = softRewriteMerlinVoice('Stay mindful of cosmic energies');
    expect(out).not.toMatch(/cosmic energies/i);
    expect(lintMerlinVoice(out).failsMerlinTest).toBe(false);
  });
});
