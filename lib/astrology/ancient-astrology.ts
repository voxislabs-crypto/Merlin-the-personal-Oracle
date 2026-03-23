import 'server-only';

import type { BirthChartData } from '@/types/astrology';

type AncientTransitLite = {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb?: number;
};

type UserSettings = {
  ancientLayer?: boolean;
};

type AncientPassage = {
  babylonian?: string;
  ptolemy?: string;
  vedic?: string;
  hermetic?: string;
};

const REGULUS_LONGITUDE = 149.9;
const REGULUS_ORB = 2;

const ANCIENT_PASSAGES: Record<string, AncientPassage> = {
  venus_retrograde: {
    babylonian:
      'When Venus is hidden or turns backward, Ishtar veils her face — unions delay and desire turns inward (Enuma Anu Enlil tradition).',
    ptolemy:
      'Venus under difficult influence can indicate affection tested through restraint and timing (Tetrabiblos spirit).',
    vedic:
      'Shukra vakri points to revisiting relationship karma before clarity returns (Surya Siddhanta lineage).',
  },
  sun_conjunct_regulus: {
    babylonian:
      'The king star in the Lion marks authority reflected back to the native; pride must be governed by discipline.',
    ptolemy:
      'Sun with Regulus: noble ambition and command, with risk of downfall when excess overrules judgment.',
    hermetic:
      'The lion-heart reflects divine sovereignty — ascend through humility, not ego (Hermetic framing).',
  },
  saturn_hard_venus: {
    babylonian:
      'When the benefic is under the cold eye, warmth withdraws and bonds are tested by time.',
    ptolemy:
      'Saturn’s difficult contact to Venus signifies delay, sobriety, and commitment trials.',
    vedic:
      'Shani over Shukra can manifest distance first, maturity later.',
  },
  default: {
    hermetic:
      'As above, so below — the sky mirrors process, not punishment. The stars describe the weather; you choose your movement.',
  },
};

const ANCIENT_KEYWORDS = ['deeper', 'expand', 'ancient layer', 'ancient', 'old story', 'tell me the old story'];

export function wantsAncientLayer(query: string, settings: UserSettings = {}): boolean {
  const q = query.toLowerCase();
  return Boolean(settings.ancientLayer) || ANCIENT_KEYWORDS.some((keyword) => q.includes(keyword));
}

export async function getAncientLayer(
  transits: AncientTransitLite[],
  natal: BirthChartData,
  query: string,
  userSettings: UserSettings = { ancientLayer: false }
): Promise<string | null> {
  if (!wantsAncientLayer(query, userSettings)) return null;

  const lines: string[] = [];
  const lowerQuery = query.toLowerCase();

  const natalSun = (natal.positions || natal.planets || []).find((p) => p.name === 'Sun');
  const hasRegulus = Boolean(
    natalSun && Math.abs((((natalSun.longitude - REGULUS_LONGITUDE + 180) % 360) - 180)) <= REGULUS_ORB
  );

  if (hasRegulus) {
    const source = ANCIENT_PASSAGES.sun_conjunct_regulus;
    lines.push(
      `Child… your Sun rests on Regulus, the lion’s heart. ${source.babylonian} ${source.ptolemy}`
    );
    if (source.hermetic) lines.push(source.hermetic);
  }

  const hasVenusRetrogradeByQuery = lowerQuery.includes('venus') && lowerQuery.includes('retrograde');
  const hasVenusSaturnHard = transits.some(
    (t) =>
      (t.transitingPlanet === 'Venus' && t.natalPlanet === 'Saturn') ||
      (t.transitingPlanet === 'Saturn' && t.natalPlanet === 'Venus')
  );

  if (hasVenusRetrogradeByQuery) {
    const source = ANCIENT_PASSAGES.venus_retrograde;
    lines.push(`Venus turning back… ${source.babylonian} ${source.ptolemy} ${source.vedic}`);
  }

  if (hasVenusSaturnHard) {
    const source = ANCIENT_PASSAGES.saturn_hard_venus;
    lines.push(`Love on ice… ${source.babylonian} ${source.ptolemy} ${source.vedic}`);
  }

  if (!lines.length) {
    lines.push(
      'Child… the stars remember, even if you do not. The old sky and this sky are one mirror.',
      ANCIENT_PASSAGES.default.hermetic || ''
    );
  }

  return lines.filter(Boolean).join('\n\n').trim();
}

export async function enhanceResponse(params: {
  baseResponse: string;
  transits: AncientTransitLite[];
  natal: BirthChartData;
  query: string;
  settings: UserSettings;
}): Promise<{ text: string; ancientLayer: string | null; enabled: boolean }> {
  const ancientLayer = await getAncientLayer(params.transits, params.natal, params.query, params.settings);

  if (!ancientLayer) {
    return {
      text: params.baseResponse,
      ancientLayer: null,
      enabled: false,
    };
  }

  return {
    text: `${params.baseResponse}\n\n${ancientLayer}`,
    ancientLayer,
    enabled: true,
  };
}
