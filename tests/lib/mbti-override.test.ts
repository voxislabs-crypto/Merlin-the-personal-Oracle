import type { DualOverlay } from '@/lib/personality/dual-overlay';
import {
  applyMbtiUserOverride,
  parseMbtiType,
  readMbtiUserOverride,
  resolveActiveCoreType,
} from '@/lib/personality/mbti-override';
import { resolveSelfMbtiType } from '@/lib/self';

function dual(core: string, mask: string): DualOverlay {
  const emptyReasoning = {
    extraversion: [],
    intuition: [],
    thinking: [],
    judging: [],
  };
  return {
    firmware: {
      label: 'Core',
      sublabel: 'inside',
      mbtiType: core,
      confidence: 72,
      archetype: 'inner',
      description: `Engine prose for ${core}`,
      breakdown: { e_i: 'I', s_n: 'N', t_f: 'F', j_p: 'P', reasoning: emptyReasoning },
    },
    hardware: {
      label: 'Mask',
      sublabel: 'present',
      mbtiType: mask,
      confidence: 64,
      archetype: 'outer',
      description: `Engine prose for ${mask}`,
      breakdown: { e_i: 'E', s_n: 'N', t_f: 'T', j_p: 'P', reasoning: emptyReasoning },
    },
    finalType: core,
    finalConfidence: 70,
  };
}

describe('mbti user override', () => {
  it('parses only real four-letter types', () => {
    expect(parseMbtiType('infj')).toBe('INFJ');
    expect(parseMbtiType('INFJ ')).toBe('INFJ');
    expect(parseMbtiType('not-a-type')).toBeNull();
    expect(parseMbtiType(12)).toBeNull();
  });

  it('reads mbtiOverrideCore and falls back to the legacy flavor key', () => {
    expect(readMbtiUserOverride({ mbtiOverrideCore: 'INFJ' }).core).toBe('INFJ');
    expect(readMbtiUserOverride({ mbtiOverride: 'INTP' }).core).toBe('INTP');
    expect(readMbtiUserOverride({ mbtiOverrideCore: 'INFJ', mbtiOverride: 'ESTP' }).core).toBe(
      'INFJ',
    );
    expect(readMbtiUserOverride({ mbtiOverrideMask: 'ENTP' }).mask).toBe('ENTP');
  });

  it('paints firmware only and does not mutate the engine overlay', () => {
    const engine = dual('INFP', 'INTP');
    const painted = applyMbtiUserOverride(engine, { core: 'INFJ' });
    expect(engine.firmware.mbtiType).toBe('INFP');
    expect(painted?.firmware.mbtiType).toBe('INFJ');
    expect(painted?.hardware.mbtiType).toBe('INTP');
    expect(painted?.finalType).toBe('INFJ');
    expect(painted?.firmware.breakdown).toEqual(engine.firmware.breakdown);
    expect(painted?.firmware.description).toBe('Engine prose for INFP');
  });

  it('leaves the engine overlay alone when there is no override', () => {
    const engine = dual('INFP', 'INTP');
    expect(applyMbtiUserOverride(engine, { core: null })).toBe(engine);
  });

  it('resolves speaking Core from the override first', () => {
    expect(
      resolveActiveCoreType({
        coreOverride: 'INFJ',
        dualOverlay: { firmware: { mbtiType: 'INFP' }, finalType: 'INFP' },
        mbtiType: 'ESTP',
      }),
    ).toBe('INFJ');
    expect(
      resolveSelfMbtiType({
        coreOverride: 'INFJ',
        dualOverlay: { firmware: { mbtiType: 'INFP' }, finalType: 'INFP' },
        mbtiType: 'ESTP',
      }),
    ).toBe('INFJ');
  });
});
