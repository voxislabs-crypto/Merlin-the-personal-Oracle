import { adaptMessage } from '@/lib/personality/adapter';
import { extractChartVoiceFacts, chartVoiceNotes } from '@/lib/personality/chart-source';
import {
  fallbackWrite,
  heuristicVoiceScore,
  needsLlmConsistencyPass,
} from '@/lib/personality/fallback';
import { classifyIntent } from '@/lib/personality/intent';
import { getPersonaSpec, PERSONA_SPECS } from '@/lib/personality/persona-spec';
import {
  buildVoiceProfile,
  buildVoiceStrategyBlock,
  clearVoiceProfileCache,
  voiceProfileCacheSize,
} from '@/lib/personality/profile';
import { applyMBTIOverlay } from '@/lib/mbti-overlay';
import { buildOracleSystemPrompt, type OracleContext } from '@/lib/oracle-service';

function leoChart(moon: string) {
  return {
    sunSign: 'Leo' as const,
    moonSign: moon,
    risingSign: 'Aries' as const,
    planets: [
      { name: 'Sun', sign: 'Leo' },
      { name: 'Moon', sign: moon },
      { name: 'Mars', sign: 'Aries' },
    ],
    ascendant: { sign: 'Aries' },
    aspects: [
      {
        type: 'Square',
        planet1: { name: 'Sun' },
        planet2: { name: 'Saturn' },
      },
    ],
  };
}

describe('persona specs', () => {
  it('covers all 16 types with stack, never-say, and a word budget', () => {
    const types = Object.keys(PERSONA_SPECS);
    expect(types).toHaveLength(16);
    for (const type of types) {
      const spec = getPersonaSpec(type);
      expect(spec?.cognitiveStack.dominant.code).toBeTruthy();
      expect(spec?.communicationStyle.length).toBeGreaterThan(20);
      expect(spec?.neverSay.length).toBeGreaterThan(2);
      expect(spec?.length.minWords).toBeGreaterThan(10);
      expect(spec?.length.maxWords).toBeGreaterThan(spec!.length.minWords);
      expect(spec?.intent.comfort.how).toBeTruthy();
      expect(spec?.intent.warning.how).not.toBe(spec?.intent.comfort.how);
    }
  });

  it('does not default a missing type to INFJ', () => {
    expect(getPersonaSpec(undefined)).toBeNull();
    expect(getPersonaSpec('not-a-type')).toBeNull();
    const profile = buildVoiceProfile({});
    expect(profile.coreType).toBeUndefined();
    expect(profile.persona).toBeNull();
  });
});

describe('chart as source of truth', () => {
  it('gives two Leo Suns different voice notes when the Moon differs', () => {
    const cancer = extractChartVoiceFacts(leoChart('Cancer'));
    const aquarius = extractChartVoiceFacts(leoChart('Aquarius'));
    expect(cancer.sunSign).toBe('Leo');
    expect(aquarius.sunSign).toBe('Leo');
    expect(cancer.moonSign).toBe('Cancer');
    expect(aquarius.moonSign).toBe('Aquarius');
    expect(cancer.fingerprint).not.toBe(aquarius.fingerprint);

    const cancerNotes = chartVoiceNotes(cancer).join(' ');
    const aquariusNotes = chartVoiceNotes(aquarius).join(' ');
    expect(cancerNotes).toMatch(/Moon in Cancer/);
    expect(aquariusNotes).toMatch(/Moon in Aquarius/);
    expect(cancerNotes).not.toBe(aquariusNotes);
    expect(cancerNotes).toMatch(/generic Leo/);
  });

  it('includes chart ruler from rising, not a Sun-sign switch', () => {
    const facts = extractChartVoiceFacts(leoChart('Cancer'));
    expect(facts.risingSign).toBe('Aries');
    expect(facts.chartRuler).toBe('Mars');
    expect(facts.keyAspects.join(' ')).toMatch(/Sun Square Saturn/i);
  });
});

describe('message intent', () => {
  it('classifies comfort, warning, celebration, instruction, reflection', () => {
    expect(classifyIntent('I feel so alone and scared')).toBe('comfort');
    expect(classifyIntent('Careful — this storm is a real risk')).toBe('warning');
    expect(classifyIntent('We got the job. It landed.')).toBe('celebration');
    expect(classifyIntent('Should I send the email? What do I do next?')).toBe('instruction');
    expect(classifyIntent('Why do I always run this loop?')).toBe('reflection');
  });

  it('honors an explicit intent over the raw text', () => {
    expect(classifyIntent('I feel sad', 'instruction')).toBe('instruction');
  });
});

describe('adapter is not a string filter', () => {
  it('does not infuse motivators, uppercase, or slice a corpse sentence', () => {
    const raw = 'Send the draft today and skip the argument.';
    const adapted = adaptMessage('ENTJ', raw);
    expect(adapted).not.toMatch(/infused with/i);
    expect(adapted).not.toBe(raw.toUpperCase() + '!');
    expect(adapted).not.toMatch(/^Do this: .* Now\.$/);
    expect(adapted).not.toMatch(/^You know, deep down,/i);
    expect(adapted.toLowerCase()).not.toContain(raw.slice(0, Math.floor(raw.length / 2)).toLowerCase() + ', infused');
  });

  it('writes INFJ comfort differently from INFJ warning', () => {
    const profile = buildVoiceProfile({ coreType: 'INFJ', maskType: 'INTP', chart: leoChart('Scorpio') });
    const comfort = fallbackWrite(profile, 'comfort', 'The day felt heavy and I almost cancelled.');
    const warning = fallbackWrite(profile, 'warning', 'The day felt heavy and I almost cancelled.');
    expect(comfort).not.toBe(warning);
    expect(comfort.toLowerCase()).toMatch(/quiet|true|neat|allowed/);
    expect(warning.toLowerCase()).toMatch(/flagged|no|split|talk yourself/);
    expect(comfort).not.toMatch(/as an INFJ/i);
  });

  it('puts Core/Mask tension and chart notes into the generation strategy, not a four-field config', () => {
    const profile = buildVoiceProfile({
      coreType: 'INFJ',
      maskType: 'INTP',
      chart: leoChart('Cancer'),
    });
    const block = buildVoiceStrategyBlock(profile, 'reflection');
    expect(block).toMatch(/VOICE STRATEGY/);
    expect(block).toMatch(/40 to 70 words/);
    expect(block).toMatch(/Moon in Cancer/);
    expect(block).toMatch(/SPEAKING VOICE: Core INFJ/);
    expect(block).toMatch(/MASK TINT \(surface only\): INTP/);
    expect(block).toMatch(/One writer/);
    expect(block).not.toMatch(/lengthMultiplier/);
    expect(block).not.toMatch(/infuse/i);
  });
});

describe('Core vs Mask speaking rule', () => {
  it('picks Core as the only speaking voice and Mask as surface tint', () => {
    const profile = buildVoiceProfile({ coreType: 'INFJ', maskType: 'INTP' });
    expect(profile.speakingLayer).toBe('core');
    expect(profile.speakingType).toBe('INFJ');
    expect(profile.persona?.type).toBe('INFJ');
    expect(profile.maskType).toBe('INTP');
    expect(profile.maskPersona?.type).toBe('INTP');
  });

  it('does not invent a speaker when no type is on file', () => {
    const profile = buildVoiceProfile({});
    expect(profile.speakingLayer).toBe('chart');
    expect(profile.speakingType).toBeUndefined();
    expect(profile.persona).toBeNull();
  });
});

describe('voice profile cache', () => {
  it('reuses the same profile object for the same chart + types', () => {
    clearVoiceProfileCache();
    const chart = leoChart('Pisces');
    const a = buildVoiceProfile({ chart, coreType: 'INFJ', maskType: 'INTP' });
    const b = buildVoiceProfile({ chart, coreType: 'INFJ', maskType: 'INTP' });
    expect(a).toBe(b);
    expect(voiceProfileCacheSize()).toBe(1);
  });
});

describe('consistency heuristic', () => {
  it('penalizes generic assistant-speak and INFJ self-address', () => {
    const profile = buildVoiceProfile({ coreType: 'INFJ' });
    const bad = heuristicVoiceScore("I'd be happy to help, as an INFJ, with cosmic energies.", profile);
    const good = heuristicVoiceScore(
      'You already know which layer is true. The rest is costume. One honest sentence, then stop.',
      profile,
    );
    expect(bad).toBeLessThan(0.4);
    expect(good).toBeGreaterThan(bad);
  });

  it('only requests a second model on never-say or a low heuristic — not on every draft', () => {
    const profile = buildVoiceProfile({ coreType: 'INFJ' });
    const native =
      'You already know which layer is true. The rest is costume. Name the pattern under the day, then one honest sentence from the inner room. Implication over announcement. What this is really about is the split you keep performing past. One honest sentence, then stop.';
    expect(needsLlmConsistencyPass(native, profile)).toBe(false);
    expect(needsLlmConsistencyPass("I'd be happy to help, as an INFJ.", profile)).toBe(true);
    expect(needsLlmConsistencyPass('Hope that helps with cosmic energies today.', profile)).toBe(true);
  });
});

describe('MBTI overlay', () => {
  it('does not lead with As an INFJ and differs by type', () => {
    const infj = applyMBTIOverlay('Career', 'INFJ');
    const estp = applyMBTIOverlay('Career', 'ESTP');
    expect(infj).not.toMatch(/as an INFJ/i);
    expect(estp).not.toMatch(/as an ESTP/i);
    expect(infj).not.toBe(estp);
  });
});

describe('Oracle prompt uses the strategy, not a type label', () => {
  it('injects voice strategy from chart + core/mask + intent', () => {
    const prompt = buildOracleSystemPrompt({
      conversationHistory: [],
      currentQuestion: 'I feel overwhelmed and alone',
      birthChart: {
        planets: [
          { name: 'Sun', sign: 'Leo' },
          { name: 'Moon', sign: 'Cancer' },
        ],
        ascendant: { sign: 'Scorpio' },
        aspects: [],
      } as OracleContext['birthChart'],
      dualPersonality: { core: 'INFJ', mask: 'INTP', final: 'INFJ' },
      mbtiType: 'INFJ',
    });
    expect(prompt).toMatch(/VOICE STRATEGY/);
    expect(prompt).toMatch(/Intent: COMFORT/);
    expect(prompt).toMatch(/Moon in Cancer/);
    expect(prompt).toMatch(/SPEAKING VOICE: Core INFJ/);
    expect(prompt).not.toMatch(/PERSONALITY LENS: INFJ\n/);
  });

  it('injects Core/Mask/Integrated and a 400–700 word identity brief when asked about dual type', () => {
    const prompt = buildOracleSystemPrompt({
      conversationHistory: [],
      currentQuestion:
        'I want to talk through my dual personality from the chart. Core INFP or INFJ. Mask INTP. Explain what each means, how they work together when they differ, how people might misread me, and how this should shape my life-weather guidance. Ask if anything doesn’t fit.',
      birthChart: {
        planets: [
          { name: 'Sun', sign: 'Leo' },
          { name: 'Moon', sign: 'Scorpio' },
          { name: 'Mercury', sign: 'Virgo' },
        ],
        ascendant: { sign: 'Libra' },
        aspects: [],
        personalitySnapshot: { firmware: 'INFP', hardware: 'INTP', finalType: 'INFP' },
      } as OracleContext['birthChart'],
      dualPersonality: { core: 'INFP', mask: 'INTP', final: 'INFP' },
      mbtiType: 'INFP',
      plainEnglish: true,
    });
    expect(prompt).toMatch(/USER DUAL TYPE/);
    expect(prompt).toMatch(/Core: INFP/);
    expect(prompt).toMatch(/Mask: INTP/);
    expect(prompt).toMatch(/Integrated: INFP/);
    expect(prompt).toMatch(/IDENTITY DEEP DIVE/);
    expect(prompt).toMatch(/400–700 words/);
    expect(prompt).toMatch(/Ignore the persona min\/max word budget/);
    expect(prompt).toMatch(/regardless of Core type/);
    expect(prompt).not.toMatch(/Target 40–75 words/);
    expect(prompt).toMatch(/Do not use Now \/ Near Future \/ Week Ahead/);
    expect(prompt).toMatch(/tug-of-war/);
    expect(prompt).toMatch(/interpret threat through Core, symptoms through Mask/);
    expect(prompt).toMatch(/Sun in Leo/);
    expect(prompt).toMatch(/Moon in Scorpio/);
  });

  it('keeps the 400–700 word identity budget for INFJ and ESTP cores, not the persona cap', () => {
    const ask = 'Explain my Core vs Mask and how people misread me.';
    const infj = buildOracleSystemPrompt({
      conversationHistory: [],
      currentQuestion: ask,
      dualPersonality: { core: 'INFJ', mask: 'INTP', final: 'INFJ' },
      mbtiType: 'INFJ',
    });
    const estp = buildOracleSystemPrompt({
      conversationHistory: [],
      currentQuestion: ask,
      dualPersonality: { core: 'ESTP', mask: 'ENTP', final: 'ESTP' },
      mbtiType: 'ESTP',
    });
    for (const prompt of [infj, estp]) {
      expect(prompt).toMatch(/IDENTITY ASK: 400–700 words/);
      expect(prompt).not.toMatch(/Target \d+–\d+ words/);
      expect(prompt).toMatch(/400–700 words/);
    }
  });
});
