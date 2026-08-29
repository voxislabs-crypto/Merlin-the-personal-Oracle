// Oracle Service - Chat-based astrological guidance with chart context
// Handles chart-aware system prompts, conversation context, and tactical suggestions
import "server-only";

import { BirthChartData } from '@/types/astrology';
import { Timeline } from '@/lib/timeline-service';
import { DailyForecast } from '@/lib/astrology/ephemeris';
import type { AtmospherePacket } from '@/lib/atmosphere/types';
import type { PersistentUserContextSnapshot } from '@/lib/user-context';
import { MERLIN_VOICE_SYSTEM_BLOCK } from '@/lib/voice/merlin-voice';
import { classifyIntent } from '@/lib/personality/intent';
import { buildVoiceProfile, buildVoiceStrategyBlock } from '@/lib/personality/profile';
import oraclePhrases from '@/data/oracle-phrases.json';
import type { MentionWorthySet } from '@/lib/astrology/mention-worthy';
import type { LivedThemePacket } from '@/lib/astrology/lived-themes';
import type { LivedMeaningPacket, ReflectionPacket } from '@/lib/astrology/meaning-synthesis';

export interface OracleMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TransitData {
  all: Array<{
    transitingPlanet: string;
    transitingSign?: string;
    natalPlanet: string;
    natalSign?: string;
    aspect: string;
    orb: number;
    exact: boolean;
    shortDescription?: string;
    description?: string;
  }>;
  significant: Array<any>;
  approaching: Array<any>;
  mentionWorthy?: MentionWorthySet;
  livedThemes?: LivedMeaningPacket;
  summary: {
    total: number;
    exact: number;
    approaching: number;
  };
}

export interface OracleContext {
  birthChart?: BirthChartData;
  timeline?: Timeline; // Long-range forecast context
  progressedChart?: any;
  transits?: TransitData; // Current transits vs natal
  dailyForecast?: DailyForecast; // Today's ephemeris forecast
  atmospherePacket?: AtmospherePacket; // Unified sky tone from Atmosphere Engine
  userContext?: PersistentUserContextSnapshot | null;
  stormsReport?: {
    storms: Array<{
      date: string;
      title: string;
      intensity: 'severe' | 'moderate' | 'mild';
      lifeArea: string;
      navigation: string;
      category?: string;
      categoryLabel?: string;
      confidence?: number;
      plainTitle?: string;
      plainExpect?: string;
      when?: {
        summary?: string;
        dateLabel?: string;
        relativeLabel?: string;
        daysUntil?: number;
      };
      actionableSteps?: string[];
      avoidSteps?: string[];
    }>;
    clearDays: string[];
    weekSummary: string;
    mbtiType?: string;
    horizonDays?: number;
  };
  conversationHistory: OracleMessage[];
  /** Latest user ask — used to pick voice intent before the model writes. */
  currentQuestion?: string;
  userId?: string;
  currentDate?: Date;
  plainEnglish?: boolean; // "Clarity Mode" - strip astro jargon
  mbtiType?: string; // MBTI personality type for storm cross-reference (prefer core / final)
  /** Dual chart personality — Core (inner) + Mask (outer) */
  dualPersonality?: {
    core?: string;
    mask?: string;
    final?: string;
  } | null;
  tonePreset?: 'warm' | 'direct' | 'mystic' | 'strategic';
  patternMirror?: {
    dominant?: {
      pattern: string;
      label: string;
      count: number;
      summary: string;
      trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
      delta?: number;
    } | null;
    trends?: Array<{
      pattern: string;
      label: string;
      count: number;
      previousCount?: number;
      delta?: number;
      status?: 'rising' | 'stable' | 'fading' | 'new';
    }>;
    mirrorInsight?: {
      pattern: string;
      label: string;
      count: number;
      lastSeen?: string;
      message: string;
    } | null;
    totalEvents?: number;
  } | null;
}

export interface OracleResponse {
  message: string;
  tactics?: string[]; // Actionable items
  forecast?: {
    timeframe: string;
    themes: string[];
  };
  nextLevel?: {
    current: string;
    challenge: string;
    reward: string;
  };
}

// Physical-domain meanings for each planet
const PLANET_PHYSICAL_DOMAINS: Record<string, string> = {
  Sun:     'Vitality, physical constitution, heart & spine health, immune system resilience',
  Moon:    'Gut health, hormonal cycles, water retention, sleep quality, body rhythms',
  Mercury: 'Nervous system, lungs, hands/arms, cognitive sharpness, cortisol spikes',
  Venus:   'Kidneys & skin, blood sugar, sensory pleasure, physical comfort, body weight',
  Mars:    'Muscular energy, sex drive, inflammation, adrenaline, accident/injury risk',
  Jupiter: 'Liver & digestion, physical expansion, weight fluctuations, circulation',
  Saturn:  'Bones/joints/teeth, chronic fatigue, skin conditions, chronic restrictions',
  Uranus:  'Nervous tension, spasms, unexpected illness, circadian disruption',
  Neptune: 'Immune confusion, substance sensitivity, adrenal fog, boundary dissolution',
  Pluto:   'Toxin processing, reproductive organs, total regeneration, deep cellular change',
};

// Sign physical tendencies (brief)
const SIGN_BODY_AREAS: Record<string, string> = {
  Aries: 'head/face, adrenals', Taurus: 'neck/throat, thyroid',
  Gemini: 'lungs/arms/shoulders', Cancer: 'stomach/breasts, lymph',
  Leo: 'heart/back/spine', Virgo: 'intestines, nervous system',
  Libra: 'kidneys/lower back', Scorpio: 'reproductive organs/colon',
  Sagittarius: 'hips/thighs/liver', Capricorn: 'knees/bones/skin',
  Aquarius: 'shins/ankles/circulation', Pisces: 'feet/lymphatic, immune',
};

// Aspect physical impact types
const ASPECT_PHYSICAL_IMPACT: Record<string, string> = {
  Conjunction: 'intensified/merged energy — amplified physical output',
  Square:      'friction/stress — tension, overexertion or blockage',
  Opposition:  'oscillating extremes — drain/surge cycles likely',
  Trine:       'flowing ease — physical energy channels smoothly',
  Sextile:     'cooperative support — moderate energetic boost',
};

/**
 * Build a full planetary-combination analysis for a chart
 * Covers physical, material, financial, and emotional domains
 */
export function formatFullPlanetaryAnalysis(chart: BirthChartData | undefined): string {
  if (!chart) return '';

  const planets = chart.planets || [];
  const aspects = chart.aspects || [];

  if (planets.length === 0) return '';

  // Per-planet physical profile
  const planetLines = planets.map((p: any) => {
    const domain = PLANET_PHYSICAL_DOMAINS[p.name] || 'general vitality';
    const bodyArea = SIGN_BODY_AREAS[p.sign] || 'general body';
    const retro = p.retrograde ? ' [RETROGRADE — internalized, slower expression]' : '';
    const housePart = p.house ? ` | House ${p.house}` : '';
    return `  ${p.name} in ${p.sign} (${p.degree}°)${housePart}${retro}\n    Physical: ${domain} → expressed through ${bodyArea}`;
  }).join('\n');

  // Key aspect physical combinations
  const physicalAspects = aspects
    .filter((a: any) => ['Conjunction', 'Square', 'Opposition', 'Trine', 'Sextile'].includes(a.type))
    .slice(0, 10)
    .map((a: any) => {
      const p1 = a.planet1?.name || a.planet1 || '?';
      const p2 = a.planet2?.name || a.planet2 || '?';
      const impact = ASPECT_PHYSICAL_IMPACT[a.type] || 'modified energy';
      const orb = a.orb !== undefined ? ` (${Number(a.orb).toFixed(1)}° orb)` : '';
      const exact = a.exact ? ' ★exact' : '';
      return `  ${p1} ${a.type} ${p2}${orb}${exact} — ${impact}`;
    }).join('\n');

  // Element/modality physical signature
  const elementMap: Record<string, string> = {
    Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water',
    Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water',
    Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water',
  };
  const modalityMap: Record<string, string> = {
    Aries:'Cardinal', Taurus:'Fixed', Gemini:'Mutable', Cancer:'Cardinal',
    Leo:'Fixed', Virgo:'Mutable', Libra:'Cardinal', Scorpio:'Fixed',
    Sagittarius:'Mutable', Capricorn:'Cardinal', Aquarius:'Fixed', Pisces:'Mutable',
  };
  const elCounts: Record<string, number> = { Fire:0, Earth:0, Air:0, Water:0 };
  const modCounts: Record<string, number> = { Cardinal:0, Fixed:0, Mutable:0 };
  planets.forEach((p: any) => {
    if (elementMap[p.sign]) elCounts[elementMap[p.sign]]++;
    if (modalityMap[p.sign]) modCounts[modalityMap[p.sign]]++;
  });
  const dominantElement = Object.entries(elCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || 'balanced';
  const dominantModality = Object.entries(modCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || 'balanced';
  const elementPhysical: Record<string, string> = {
    Fire: 'high metabolic rate, inflammation risk, burnout when overextended',
    Earth: 'strong endurance, slow to mobilize healing, chronic tension patterns',
    Air: 'nervous system sensitivity, respiratory vulnerability, mental-physical link',
    Water: 'hormonal sensitivity, lymphatic reactivity, emotional digestion affects gut',
  };
  const modalityPhysical: Record<string, string> = {
    Cardinal: 'initiates quickly, prone to stress injury from rushing',
    Fixed: 'persistent stamina, but physical blocks or stagnation when stuck',
    Mutable: 'adaptable recovery, but scattered energy, hard to build baseline',
  };

  return `
FULL PLANETARY ANALYSIS (physical + material domains):
${planetLines}

KEY ASPECT PHYSICAL COMBINATIONS:
${physicalAspects || '  No major aspects in dataset'}

CHART PHYSICAL SIGNATURE:
  Dominant Element: ${dominantElement} — ${elementPhysical[dominantElement] || 'balanced'}
  Dominant Modality: ${dominantModality} — ${modalityPhysical[dominantModality] || 'balanced'}
  `.trim();
}

/**
 * Format birth chart data into a readable context string for Grok
 */
export function formatChartContext(chart: BirthChartData | undefined): string {
  if (!chart) return '';

  const sun = chart.planets?.find((p: any) => p.name === 'Sun');
  const moon = chart.planets?.find((p: any) => p.name === 'Moon');
  const mercury = chart.planets?.find((p: any) => p.name === 'Mercury');
  const venus = chart.planets?.find((p: any) => p.name === 'Venus');
  const mars = chart.planets?.find((p: any) => p.name === 'Mars');
  const jupiter = chart.planets?.find((p: any) => p.name === 'Jupiter');
  const saturn = chart.planets?.find((p: any) => p.name === 'Saturn');
  const ascendant = chart.ascendant;
  const planets = chart.planets || [];
  const aspects = chart.aspects || [];

  const majorAspects = aspects
    .filter((a: any) => ['Conjunction', 'Square', 'Opposition', 'Trine', 'Sextile'].includes(a.type))
    .slice(0, 12)
    .map((a: any) => {
      const p1 = a.planet1?.name || a.planet1 || '?';
      const p2 = a.planet2?.name || a.planet2 || '?';
      const orb = a.orb !== undefined ? ` (${Number(a.orb).toFixed(1)}°)` : '';
      return `${p1} ${a.type} ${p2}${orb}`;
    })
    .join(', ');

  const planetSummary = planets.map((p: any) => {
    const retro = p.retrograde ? ' ℞' : '';
    const house = p.house ? ` H${p.house}` : '';
    return `${p.name} ${p.degree}°${p.sign}${house}${retro}`;
  }).join(' | ');

  return `
NATAL CHART CONTEXT:
- Sun: ${sun?.sign || 'unknown'} ${sun?.house ? `H${sun.house}` : ''} (identity, vitality, heart, willpower)
- Moon: ${moon?.sign || 'unknown'} ${moon?.house ? `H${moon.house}` : ''} (emotions, gut health, hormones, cycles)
- Mercury: ${mercury?.sign || 'unknown'} ${mercury?.house ? `H${mercury.house}` : ''} (nervous system, communication, cognition)
- Venus: ${venus?.sign || 'unknown'} ${venus?.house ? `H${venus.house}` : ''} (love, money, skin/kidneys, pleasure)
- Mars: ${mars?.sign || 'unknown'} ${mars?.house ? `H${mars.house}` : ''} (physical energy, drive, inflammation, sex)
- Jupiter: ${jupiter?.sign || 'unknown'} ${jupiter?.house ? `H${jupiter.house}` : ''} (growth, liver, expansion, abundance)
- Saturn: ${saturn?.sign || 'unknown'} ${saturn?.house ? `H${saturn.house}` : ''} (structure, bones, discipline, chronic patterns)
- Ascendant: ${ascendant?.sign || 'unknown'} (body type, physical presentation, first response)
- All Planets: ${planetSummary}
- Key Aspects: ${majorAspects || 'none detected'}
- Chart Signature: ${detectChartSignature(chart)}
  `.trim();
}

/**
 * Detect chart "signature" - dominant elements, patterns, etc.
 */
function detectChartSignature(chart: BirthChartData): string {
  const planets = chart.planets || [];
  
  // Count elements
  const elements: { [key: string]: number } = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const elementMap: { [key: string]: string } = {
    Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
    Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
    Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
  };

  planets.forEach((p: any) => {
    const element = elementMap[p.sign];
    if (element) elements[element]++;
  });

  const dominant = Object.entries(elements).sort(([, a], [, b]) => b - a)[0];
  const signature = dominant ? `${dominant[0]}-heavy` : 'balanced';
  
  return signature;
}

// Physical domain meaning per planet when transiting
const TRANSIT_PLANET_PHYSICAL: Record<string, string> = {
  Sun:     'stamina & immune activation',
  Moon:    'gut/hormonal fluctuation, sleep quality',
  Mercury: 'nervous system tension, cortisol, cognitive load',
  Venus:   'blood sugar, skin, appetite, libido ease',
  Mars:    'physical drive, inflammation, injury risk, sex',
  Jupiter: 'liver/digestion, physical expansion, energy surge or excess',
  Saturn:  'joint/bone pressure, fatigue, chronic symptoms activating',
  Uranus:  'sudden nervous spasm, erratic energy, disrupted sleep',
  Neptune: 'immune fog, sensitivity spikes, confused body signals',
  Pluto:   'deep cellular/regenerative pressure, toxin clearing',
};

// Aspect physical action type for transits
const TRANSIT_ASPECT_ACTION: Record<string, string> = {
  Conjunction: 'direct hit — maximal physical activation',
  Square:      'conflict/stress peak — most likely physical tension point',
  Opposition:  'pull in two directions — drain cycle, push/pull on energy',
  Trine:       'energy flows freely — easy regeneration window',
  Sextile:     'mild support — take advantage, physical tasks go smoothly',
};

/**
 * Format current transits into readable context for oracle
 * Includes physical domain interpretation per transit
 */
function formatReflectionContext(reflection: ReflectionPacket): string {
  const interactions = reflection.interactions
    .map((item) => `${item.themeA} × ${item.themeB} → ${item.interaction}`)
    .join('; ');
  const supporting = reflection.supportingThemes
    .map((item) => `${item.theme} (${item.meaningDensity})`)
    .join(' · ');

  return `
REFLECTION (THE STORYLINE — AUTHORITATIVE over isolated themes and transits):
- Framing: one coherent symbolic story. NOT a forecast. No timeline, outcome, or event claims.
- Meta-theme: ${reflection.metaTheme}
- Theme: ${reflection.hierarchy.theme}
- Subthemes: ${reflection.subThemes.join(', ')}
- Core tension (speak this, not a plot): ${reflection.coreTension}
- Developmental process: ${reflection.developmentalStage} · archetype for language only: ${reflection.archetype}
- Meaning density ${reflection.meaningDensity} (strength × coherence ${reflection.themeCoherence}) · signal ${reflection.signalStrength} · interpretation confidence ${reflection.interpretationConfidence}%
- Interior intensity ${reflection.internalIntensity} · external visibility ${reflection.externalVisibility} · persistence ${reflection.persistence}
${interactions ? `- Theme interaction (often the real meaning): ${interactions}` : ''}
${supporting ? `- Supporting currents: ${supporting}` : ''}
- Reflective question (from the tension, not from an aspect): ${reflection.reflectivePrompt}
- Use rule: Open with the tension. Ask the question. Do not announce a period, predict an event, or list transits unless asked. Archetype is diction, not destiny.
  `.trim();
}

function formatLivedThemesContext(packet: LivedThemePacket | undefined): string {
  if (!packet || packet.themes.length === 0) return '';

  const reflection =
    'reflection' in packet && packet.reflection
      ? formatReflectionContext(packet.reflection as ReflectionPacket)
      : '';

  const themeLines = packet.themes.slice(0, 4).map((theme, index) => {
    const contributors = theme.contributors.map((c) => c.label).join(' + ');
    return `  ${index + 1}. ${theme.theme}
     impact ${theme.impact} · pressure ${theme.pressure} · growth ${theme.growth} · instability ${theme.instability} · visibility ${theme.visibility}
     signal ${theme.signalStrength} · interpretation confidence ${theme.interpretationConfidence}% · natal resonance ${theme.natalResonance} · tension ${theme.internalTension}
     contributors: ${contributors}`;
  });
  const domains = Object.entries(packet.domains)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => `${name} ${value}`)
    .join(' · ');

  return `
${reflection ? `${reflection}\n\n` : ''}SYMBOLIC THEMES (supporting evidence under the storyline — do not lead with these):
- Framing: areas of emphasis. NOT event prediction.
- Top themes:
${themeLines.join('\n')}
${domains ? `- Life-area density: ${domains}` : ''}
  `.trim();
}

function formatTransitsContext(transits: TransitData | undefined): string {
  if (!transits || transits.all.length === 0) return '';

  const mention = transits.mentionWorthy;
  if (mention && mention.mentioned.length > 0) {
    const line = (item: (typeof mention.mentioned)[number]) => {
      const when =
        item.daysToPeak > 0
          ? `peaks in ${item.daysToPeak}d`
          : item.phase === 'releasing'
            ? 'separating'
            : 'active now';
      const pass = item.pass
        ? ` · ${item.pass.kind} pass (${item.pass.meaning})`
        : '';
      return `  • ${item.label} — ${item.orb.toFixed(1)}° · ${when} · impact ${item.impact}/100 · valence ${item.valence} · certainty ${item.certainty}%${pass}\n    why: ${item.why}`;
    };
    const headline = mention.headline ? line(mention.headline) : '  (none)';
    const now = mention.now
      .filter((item) => item.eventId !== mention.headline?.eventId)
      .map(line)
      .join('\n');
    const upcoming = mention.upcoming
      .filter((item) => item.eventId !== mention.headline?.eventId)
      .map(line)
      .join('\n');
    const cluster = mention.headlineCluster
      ? `  • ${mention.headlineCluster.theme} (natal ${mention.headlineCluster.target}) — strength ${mention.headlineCluster.strength} · valence ${mention.headlineCluster.valence} · certainty ${mention.headlineCluster.certainty}%\n    members: ${mention.headlineCluster.members.map((m) => m.label).join(' + ')}\n    ${mention.headlineCluster.why}`
      : '';
    const domains = mention.domains
      ? Object.entries(mention.domains)
          .filter(([, value]) => value > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => `${name} ${value}`)
          .join(' · ')
      : '';

    return `
MENTION-WORTHY TRANSITS (AUTHORITATIVE for what to say out loud — do NOT list the rest):
- ~${transits.summary.total} contacts are in detection orb. Only the ones below are worth a sentence.
- Impact ≠ positivity. High impact + valence 0 is transformation, not "good" or "bad."
- Humans experience THEMES (clusters on one natal point), not isolated aspects.
${cluster ? `- Headline theme (lead with this, not aspect soup):\n${cluster}` : ''}
- Headline contact:
${headline}
${now ? `- Also now:\n${now}` : '- Also now: none'}
${upcoming ? `- Upcoming this week:\n${upcoming}` : '- Upcoming this week: none'}
${domains ? `- Domain pressure: ${domains}` : ''}
- Use rule: If a theme cluster exists, narrate the cluster. Mention at most one supporting now-hit and one upcoming peak. Include pass meaning when it is retrograde or final. Ignore Moon weather unless it is the headline. Soft outer-to-outer is background — do not mention. MBTI may change coping advice only — never the forecast itself.
  `.trim();
  }

  const exactTransits = transits.significant.slice(0, 6);
  const approachingTransits = transits.approaching.slice(0, 4);

  const exactStr = exactTransits.length > 0
    ? exactTransits.map((t: any) => {
        const physDomain = TRANSIT_PLANET_PHYSICAL[t.transitingPlanet] || 'general energy';
        const aspectAction = TRANSIT_ASPECT_ACTION[t.aspect] || 'active';
        const natalPhys = PLANET_PHYSICAL_DOMAINS[t.natalPlanet]
          ? ` (natal ${t.natalPlanet}: ${PLANET_PHYSICAL_DOMAINS[t.natalPlanet].split(',')[0]})`
          : '';
        return `  • ${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}° orb)\n    → Physical: ${physDomain} | ${aspectAction}${natalPhys}`;
      }).join('\n')
    : '  None exact right now';

  const approachingStr = approachingTransits.length > 0
    ? approachingTransits.map((t: any) => {
        const physDomain = TRANSIT_PLANET_PHYSICAL[t.transitingPlanet] || 'general energy';
        return `  • ${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet} (${t.orb.toFixed(1)}° orb) — approaching: ${physDomain}`;
      }).join('\n')
    : '';

  return `
CURRENT TRANSITS (What's happening in the sky RIGHT NOW vs natal chart):
Exact/Significant — Physical Impact:
${exactStr}${approachingStr ? `\n\nApproaching (within 3°):\n${approachingStr}` : ''}

Total active transits: ${transits.summary.total} | Exact: ${transits.summary.exact} | Approaching: ${transits.summary.approaching}
  `.trim();
}

/**
 * Format LifeRiskPacket — score-first transit impact (authoritative for "is life friction elevated?")
 */
function formatLifeRiskContext(packet: AtmospherePacket | undefined): string {
  const risk = packet?.risk;
  if (!risk) return '';

  const drivers = risk.topDrivers
    .slice(0, 5)
    .map(
      (d) =>
        `  • ${d.label} — friction ${d.friction}/100 · ${d.kind}${d.phase ? ` · ${d.phase}` : ''}${
          d.domains?.length ? ` · domains: ${d.domains.join(', ')}` : ''
        }`
    )
    .join('\n');

  const frictionWindows = risk.frictionWindows
    .slice(0, 6)
    .map((w) => {
      const when =
        typeof w.daysToPeak === 'number'
          ? `~${w.daysToPeak}d to peak`
          : w.peakAt
            ? w.peakAt.slice(0, 10)
            : 'timing TBD';
      return `  • ${w.label} — ${w.friction}/100 · ${when}`;
    })
    .join('\n');

  const supportWindows = risk.supportWindows
    .slice(0, 3)
    .map((w) => `  • ${w.label} — support opening`)
    .join('\n');

  const domains = risk.domains
    .filter((d) => d.friction >= 40 || d.support >= 40)
    .slice(0, 6)
    .map((d) => `  • ${d.label}: friction ${d.friction} / support ${d.support}`)
    .join('\n');

  const peak = risk.nextFrictionPeak
    ? `${risk.nextFrictionPeak.label} (friction ${risk.nextFrictionPeak.friction}${
        typeof risk.nextFrictionPeak.daysToPeak === 'number'
          ? `, ~${risk.nextFrictionPeak.daysToPeak}d`
          : ''
      })`
    : 'none scored';

  return `
LIFE RISK / TRANSIT IMPACT (AUTHORITATIVE — answer "is disruption risk / friction elevated?" from THIS first):
- Horizon: ${risk.windowDays} days · Date anchor: ${risk.date}
- Level: ${risk.level.toUpperCase()}
- Overall friction: ${risk.overallFriction}/100
- Elevated disruption risk: ${risk.elevatedDisruption ? 'YES' : 'NO'}
- Confidence: ${risk.confidence}%
- Headline: ${risk.headline}
- One move: ${risk.move}
- Next hard peak: ${peak}
- Top drivers:
${drivers || '  (none)'}
- Friction windows:
${frictionWindows || '  (none major)'}
- Support openings:
${supportWindows || '  (none major)'}
- Domain pressure:
${domains || '  (balanced / quiet)'}
- Provenance: ${risk.provenance.join(', ')}
- Use rule: Lead with risk level, elevated disruption flag, next peak, and one concrete move in human language. Translate drivers into felt life stakes. Do NOT open with aspect soup. Story is optional depth after the risk read.
  `.trim();
}

/**
 * Format Atmosphere Engine packet into oracle context
 */
function formatAtmosphereContext(packet: AtmospherePacket | undefined): string {
  if (!packet) return '';

  const riskBlock = formatLifeRiskContext(packet);

  const confluenceLine = packet.confluence.aligned
    ? `- Signal alignment: YES${packet.confluence.tripleHit ? ' · TRIPLE HIT' : ''} (${packet.confluence.themes.slice(0, 3).join(', ') || 'multiple layers converging'})`
    : '- Signal alignment: mixed layers';

  const realityLine =
    packet.realityCheck.source !== 'none'
      ? `- Reality check: felt ${packet.feltIntensity}% vs sky ${packet.intensity}% (mood signal ${packet.realityCheck.sentimentScore ?? 'n/a'}%, readiness ×${packet.readinessModifier.toFixed(2)}, branch ${packet.realityCheck.guidanceBranch})`
      : '- Reality check: no check-in or journal signal yet';

  const patternLine =
    packet.patterns.active.length > 0
      ? `- Learned patterns: ${packet.patterns.active
          .slice(0, 3)
          .map((match) => `${match.patternKey} (${match.sensitivityScore.toFixed(2)})`)
          .join('; ')}`
      : '- Learned patterns: none matched today';

  return `
${riskBlock ? `${riskBlock}\n\n` : ''}LIFE WEATHER / ATMOSPHERE (secondary tone for today — after life risk):
- Date: ${packet.date}
- Life weather tone: ${packet.tone.label} (${packet.intensity}% intensity)
- Felt intensity: ${packet.feltIntensity}% (readiness modifier ×${packet.readinessModifier.toFixed(2)})
- Day rating: ${packet.dayRating}
- Dominant driver (engine label — translate for the user): ${packet.dominantDriver.label}
- Why this tone: ${packet.dominantDriver.rationale}
- Driver source: ${packet.dominantDriver.source}
- Voice rule: explain what this means for *them* (energy, talks, work, money). Never lead with bare planet lists.
${realityLine}
${patternLine}
${confluenceLine}
- Lunar context: ${packet.temporal.lunarPhase || 'n/a'}${packet.temporal.lunarSign ? ` in ${packet.temporal.lunarSign}` : ''}
- Progressed Moon baseline: ${packet.temporal.baselineTemperature}
- Annual profection: ${packet.temporal.profectedSign || 'n/a'} (house ${packet.temporal.profectedHouse || 'n/a'}, time lord ${packet.temporal.timeLord || 'n/a'})
- Profection theme: ${packet.temporal.themeOfYear || 'n/a'}
- Solar arc age: ${typeof packet.temporal.solarArcAge === 'number' ? packet.temporal.solarArcAge.toFixed(1) : 'n/a'}
- Active solar arc hits: ${
    packet.temporal.solarArcHits?.length
      ? packet.temporal.solarArcHits
          .map((hit) => `${hit.directedPlanet} ${hit.aspect} natal ${hit.natalPlanet} (${hit.orb.toFixed(2)}°)`)
          .join('; ')
      : 'none within 1°'
  }
- Confidence: ${packet.confidence}%
- Use rule: Life RISK block above is primary for friction / timing. Atmosphere tone fills mood texture only — do not contradict the risk level.
  `.trim();
}

/**
 * Format daily forecast into context
 */
function formatDailyForecastContext(forecast: DailyForecast | undefined): string {
  if (!forecast) return '';

  const highlights = forecast.planetaryHighlights.slice(0, 4).join('\n  ');
  const futureSignals = (forecast.futureSignals || [])
    .slice(0, 4)
    .map((s) => `- ${s.domain}: ${s.signal} (${s.probability}% in ${s.timeframe}) | Move: ${s.action}`)
    .join('\n');
  const timingWindows = forecast.timingWindows
    ? `\n- Next 24h: ${forecast.timingWindows.next24Hours}\n- Next 72h: ${forecast.timingWindows.next72Hours}\n- Week Ahead: ${forecast.timingWindows.weekAhead}`
    : '';
  const focusAreas = forecast.focusAreas
    ? `\n- Love: ${forecast.focusAreas.love}\n- Career: ${forecast.focusAreas.career}\n- Mind: ${forecast.focusAreas.mind}\n- Mood: ${forecast.focusAreas.mood}`
    : '';

  return `
TODAY'S COSMIC WEATHER (${forecast.date}):
- Moon Phase: ${forecast.moonPhase}${forecast.moonSign ? ` in ${forecast.moonSign}` : ''}
- Day Rating: ${forecast.day_rating}
- Energy Summary: ${forecast.summary}

Key Planetary Movements:
  ${highlights}${focusAreas}${timingWindows}

Future Signals:
${futureSignals || '- No strong signal clusters detected'}
  `.trim();
}

/**
 * Format timeline data into context for oracle response
 */
function formatTimelineContext(timeline: Timeline | undefined): string {
  if (!timeline) return '';

  const nextTurningPoints = timeline.majorTurningPoints.slice(0, 3);
  const upcomingPhase = timeline.phases[0];

  const turningPointsStr = nextTurningPoints
    .map(tp => `- ${tp.title} (${tp.month}): ${tp.guidance}`)
    .join('\n');

  return `
TIME MACHINE CONTEXT (Next ${timeline.lookAheadMonths} months):
- Current Phase: ${upcomingPhase?.theme || 'unknown'}
- Life Theme: ${upcomingPhase?.lifeTheme || 'unknown'}
- Key Turning Points:
${turningPointsStr || 'None in immediate timeframe'}
- Year Outlook: ${timeline.yearlyNarrative.split('\n')[0]}
  `.trim();
}

/**
 * Format storms report into tactical context for oracle response
 */
function formatStormsContext(report: OracleContext['stormsReport']): string {
  if (!report) return '';

  const horizon = report.horizonDays ?? 30;
  const topStorms = report.storms.slice(0, 6);
  const topStormsStr = topStorms
    .map((s) => {
      const cat = s.categoryLabel || s.category || s.lifeArea;
      const conf = typeof s.confidence === 'number' ? `${s.confidence}% conf` : 'conf n/a';
      const when = s.when?.summary || s.date;
      const title = s.plainTitle || s.title;
      const steps = s.actionableSteps?.slice(0, 2).join(' | ');
      return `- [${cat}] ${title} · ${s.intensity} · ${conf}\n  When: ${when}\n  Expect: ${s.plainExpect || s.navigation}\n  Steps: ${steps || s.navigation}`;
    })
    .join('\n');

  return `
STORM PLAYBOOK (from app — live life-friction windows):
- Horizon: ${horizon} days · Storm count: ${report.storms.length}
- MBTI navigation lens: ${report.mbtiType || 'not available'}
- Summary: ${report.weekSummary}
- Clear / quieter days: ${(report.clearDays || []).slice(0, 8).join(', ') || 'n/a'}
- Storms (category · confidence · when · navigate):
${topStormsStr || '- No major storms scored'}
- Use rule: when user asks about storms, pressure, or disruption risk, answer from this playbook first. Cite category + when + confidence in plain language.
  `.trim();
}

/**
 * Inventory of live app signals Merlin can honestly claim to "see"
 */
function formatAppSightInventory(context: OracleContext): string {
  const risk = context.atmospherePacket?.risk;
  const chart = Boolean(context.birthChart);
  const dual = context.dualPersonality;
  const storms = context.stormsReport?.storms?.length ?? 0;
  const transitExact = context.transits?.summary?.exact ?? 0;
  const transitTotal = context.transits?.summary?.total ?? 0;
  const forecast = context.dailyForecast;
  const hasUserCtx = Boolean(context.userContext);
  const hasPatterns = Boolean(context.patternMirror?.dominant);

  const lines = [
    `- Birth chart loaded: ${chart ? 'YES' : 'NO'}`,
    `- Dual personality: ${
      dual?.core
        ? `Core ${dual.core}${dual.mask && dual.mask !== dual.core ? ` / Mask ${dual.mask}` : ''}`
        : context.mbtiType
          ? `Type ${context.mbtiType}`
          : 'not loaded'
    }`,
    `- Life risk: ${
      risk
        ? `level=${risk.level}, friction=${risk.overallFriction}/100, elevatedDisruption=${risk.elevatedDisruption}, conf=${risk.confidence}%`
        : 'not loaded (do not invent risk scores)'
    }`,
    `- Atmosphere tone: ${
      context.atmospherePacket
        ? `${context.atmospherePacket.tone.label} · intensity ${context.atmospherePacket.intensity}% · driver: ${context.atmospherePacket.dominantDriver.label}`
        : 'not loaded'
    }`,
    `- Storm playbook: ${storms > 0 ? `${storms} storm window(s)` : 'none or not loaded'}`,
    `- Active transits: ${transitTotal > 0 ? `${transitTotal} total (${transitExact} exact/significant)` : 'not loaded'}`,
    `- Daily forecast: ${forecast ? `${forecast.day_rating} · ${forecast.moonPhase}` : 'not loaded'}`,
    `- Persistent life context: ${hasUserCtx ? 'YES' : 'NO'}`,
    `- Pattern mirror: ${hasPatterns ? `dominant=${context.patternMirror?.dominant?.label}` : 'none'}`,
  ];

  return `
APP SIGHT (what you can truthfully see right now — do not claim otherwise):
${lines.join('\n')}
- If the user asks "what do you see" or "do you have my chart", answer from this inventory.
- Never invent placements, storms, scores, or life details not listed here or in the data blocks below.
  `.trim();
}

function formatUserContext(userContext: OracleContext['userContext']): string {
  if (!userContext) return '';

  const goals = userContext.goals.length > 0 ? userContext.goals.join(', ') : 'none saved';
  const situation = userContext.situation || 'not provided';
  const mood = userContext.mood || 'not provided';
  const lastFeedback = userContext.lastFeedbackNotes || 'none recorded';

  return `
PERSISTENT LIFE CONTEXT:
- Current situation: ${situation}
- Current mood: ${mood}
- Active goals: ${goals}
- Last feedback note: ${lastFeedback}
- Archetype Name: ${userContext.archetypeName || 'not set'}
- Pattern Signature: ${userContext.patternSignature || 'not set'}
- Core Contradiction: ${userContext.coreContradiction || 'not set'}
- Arc Path: ${userContext.arcPath || 'not set'}
- Arc Level: ${userContext.arcLevel || 1} (XP: ${userContext.arcXp || 0})
- Interaction Count: ${userContext.interactionCount || 0}
- Context rule: treat this as real-world terrain, not background flavor. If the user asks about jobs, money, housing, relationships, health, or safety, weight this context heavily.
  `.trim();
}

function formatPatternMirrorContext(patternMirror: OracleContext['patternMirror']): string {
  if (!patternMirror?.dominant) return '';

  const dominant = patternMirror.dominant;
  const trendLanguage = dominant.trendStatus ? ` (${dominant.trendStatus})` : '';
  const trendLines = (patternMirror.trends || [])
    .slice(0, 3)
    .map((trend) => `- ${trend.label}: ${trend.count} recent hits vs ${trend.previousCount || 0} prior (${trend.status || 'stable'})`)
    .join('\n');
  const mirrorInsight = patternMirror.mirrorInsight;

  const phraseBank = {
    avoidance_loop: [
      'This is your avoidance loop wearing smarter clothes.',
      'The same delay pattern is back, just with a cleaner excuse.',
      'You are close to calling stalling strategy again.',
    ],
    overthinking_loop: [
      'This is the part where thinking keeps trying to replace movement.',
      'Your mind is trying to turn uncertainty into a full-time job.',
      'This loop usually shows up when analysis starts crowding out action.',
    ],
    inconsistency: [
      'This is the familiar drop-off point, not a brand new crisis.',
      'The pattern here is not starting. It is staying with the thing.',
      'You are approaching one of your old exit ramps.',
    ],
    validation_seeking: [
      'This is the moment your conviction tries to borrow someone else’s voice.',
      'You may be tempted to ask for permission instead of making a call.',
      'This loop usually appears when your own read suddenly feels insufficient.',
    ],
    control_friction: [
      'This is the grip-tightening pattern, not just a tough week.',
      'The loop here is trying to over-manage what timing needs to breathe through.',
      'You may mistake control for safety if you are not careful.',
    ],
    self_trust_gap: [
      'This is the part where your clear knowing gets negotiated downward.',
      'The repeat pattern is doubting yourself after the signal already arrived.',
      'You are near one of those moments where self-trust gets quietly traded away.',
    ],
  } as const;

  const dominantPhrases = phraseBank[dominant.pattern as keyof typeof phraseBank] || phraseBank.self_trust_gap;

  return `
PATTERN MIRROR EVIDENCE:
- Dominant loop: ${dominant.label}${trendLanguage}
- Repeat count: ${dominant.count}
- Meaning: ${dominant.summary}
${trendLines ? `- Recent trend stack:\n${trendLines}` : ''}
  - Reference styles you may rotate through if relevant:\n  - ${dominantPhrases[0]}\n  - ${dominantPhrases[1]}\n  - ${dominantPhrases[2]}
${mirrorInsight ? `- Confrontation note: ${mirrorInsight.message}` : ''}
- Use rule: if the current question touches this loop, name it plainly once and explain how it is showing up now. Rotate your phrasing. Do not sound like a surveillance system; sound like a wise pattern witness.
  `.trim();
}

/**
 * Build system prompt for Merlin — intellectual companion with live app sight.
 * Voice: formal-direct + conversational; risk/storm data first; guardrails always on.
 */
export function buildOracleSystemPrompt(context: OracleContext): string {
  const chartContext = context.birthChart ? formatChartContext(context.birthChart) : '';
  const fullPlanetaryAnalysis = context.birthChart ? formatFullPlanetaryAnalysis(context.birthChart) : '';
  const livedThemesContext = formatLivedThemesContext(context.transits?.livedThemes);
  const transitsContext = context.transits ? formatTransitsContext(context.transits) : '';
  const atmosphereContext = context.atmospherePacket
    ? formatAtmosphereContext(context.atmospherePacket)
    : '';
  const forecastContext = context.dailyForecast ? formatDailyForecastContext(context.dailyForecast) : '';
  const timelineContext = context.timeline ? formatTimelineContext(context.timeline) : '';
  const userContextBlock = context.userContext ? formatUserContext(context.userContext) : '';
  const patternMirrorBlock = context.patternMirror ? formatPatternMirrorContext(context.patternMirror) : '';
  const stormsContext = context.stormsReport ? formatStormsContext(context.stormsReport) : '';
  const appSight = formatAppSightInventory(context);
  const recentContext = context.conversationHistory
    .slice(-8)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');
  const plainEnglish = context.plainEnglish !== false;
  const tonePreset = context.tonePreset || 'warm';
  const stanceMode = (context.userContext?.arcLevel || 1) > 3 ? 'direct' : 'soft';
  const chartMbti = (context.birthChart as any)?.personalitySnapshot?.finalType;
  const dual = context.dualPersonality;
  const lastUserAsk =
    context.currentQuestion ||
    [...context.conversationHistory].reverse().find((m) => m.role === 'user')?.content ||
    '';
  const voiceProfile = buildVoiceProfile({
    chart: context.birthChart,
    coreType: dual?.core || context.mbtiType || chartMbti,
    maskType: dual?.mask,
  });
  const voiceIntent = classifyIntent(lastUserAsk);
  // One writer: this block is the voice. Do not run generateMessage on the stream.
  const voiceStrategy = buildVoiceStrategyBlock(voiceProfile, voiceIntent);

  const languageRule = plainEnglish
    ? `LANGUAGE (Clarity ON):
- Prefer plain English over jargon. Translate symbols into lived experience first.
- You may use planet names sparingly when they help precision; never dump aspect lists.
- Specific over vague: "irritability with your partner after 8pm" beats "emotional energy."`
    : `LANGUAGE (Full mode ON):
- You may use technical astrology (planets, aspects, orbs, houses) when it adds precision.
- Always translate into lived stakes in the same breath — never leave the user with jargon alone.`;

  const toneRules: Record<string, string> = {
    warm: `TONE PRESET: WARM — formal enough to feel competent, warm enough to feel human. Candor without cruelty.`,
    direct: `TONE PRESET: DIRECT — spare, precise, no padding. Lead with the answer, then the reason.`,
    strategic: `TONE PRESET: STRATEGIC — advisor mode: trade-offs, sequencing, leverage, timing.`,
    mystic: `TONE PRESET: MYSTIC — measured poetic cadence allowed; never vague. Every image must earn a practical implication.`,
  };

  return `You are MERLIN — the intelligence inside this app: a sharp, literate companion who can see this person's chart, life weather, storm playbook, and risk scores when those packets are loaded.

${MERLIN_VOICE_SYSTEM_BLOCK}

═══════════════════════════════════════
WHO YOU ARE (voice — companion)
═══════════════════════════════════════
- Intellectual, composed, and conversational — like a trusted strategist who also understands the psyche.
- Direct and somewhat formal, never stiff. No corporate filler, no horoscope clichés, no "dear seeker" theatrics.
- You *see* people: reflect the real question under their words, name the tension accurately, give one clean move.
- Interactive: answer what they asked; if the ask is vague, ask ONE precise clarifying question after a useful first pass.
- Match length to the question: short for simple checks, deeper for complex life questions. Default ~120–280 words unless they ask for more.
- Explain *them* and their day — not the ephemeris. Astrology stays infrastructure.

═══════════════════════════════════════
GUARDRAILS (non-negotiable)
═══════════════════════════════════════
1. PROBABILITY, NOT FATE — Use "may / likely / elevated odds." Never guarantee outcomes, death, destiny, or inevitable betrayal.
2. NO FABRICATION — Only use placements, storms, risk scores, and life details present in APP SIGHT / data blocks. If missing, say you don't have that packet loaded yet.
3. NOT A CLINICIAN / LAWYER / FINANCIAL ADVISOR — No diagnosis, no trading advice, no "you must leave them now" legal framing. For self-harm or crisis: urge real-world help / emergency services, stay calm, do not dramatize.
4. AGENCY — Always leave the user with a reversible next step they control. Timing informs choice; it does not replace choice.
5. NO SCARE TACTICS — Hard windows are named clearly without catastrophizing. "Elevated friction" not "your life will fall apart."
6. PRIVACY OF CLAIM — Do not invent childhood trauma, secret enemies, or medical conditions.
7. SAFETY LANGUAGE — Prefer "you might notice" / "pressure is elevated in" over absolute prophecies.

═══════════════════════════════════════
HOW TO ANSWER (interaction model)
═══════════════════════════════════════
A. Address *their* question first in the opening sentence — not a weather monologue if they asked something else.
B. When the topic is timing / friction / "is life going to suck": lead with LIFE RISK + STORM PLAYBOOK (level, when, confidence, one move).
C. When the topic is identity / patterns / "why am I like this": use chart + dual personality + pattern mirror; still one practical implication.
D. When the topic is purely conversational: stay human and present; lightly use weather only if it honestly helps.
E. End with either a concrete next move OR a single intelligent question that deepens the thread — not both stacked every time.
F. Do not default to rigid [BODY]/[MONEY] report templates unless they explicitly want a full domain scan.

═══════════════════════════════════════
DATA PRIORITY
═══════════════════════════════════════
1. REFLECTION packet (meta-theme, core tension, question — the storyline)
2. SYMBOLIC THEMES (supporting currents under the storyline)
3. LIFE RISK packet (elevatedDisruption, friction, peaks, domains)
4. STORM PLAYBOOK (category · when · confidence · steps)
5. Active transits as evidence under a theme (only if asked for the catalog)
6. Personality / dual type (response style + blind spots)
7. Persistent life context + pattern mirror
8. Full chart analysis (depth on demand)

${appSight}

${languageRule}
${toneRules[tonePreset] || toneRules.warm}

STANCE: ${stanceMode.toUpperCase()}
- SOFT: honest, room to self-recognize; no cornering.
- DIRECT: challenge avoidance when pattern evidence is strong; still respectful.

${livedThemesContext ? `\n${livedThemesContext}` : ''}
${atmosphereContext ? `\n${atmosphereContext}` : ''}
${stormsContext ? `\n${stormsContext}` : ''}
${transitsContext ? `\n${transitsContext}` : ''}
${forecastContext ? `\n${forecastContext}` : ''}
${chartContext}
${fullPlanetaryAnalysis ? `\n${fullPlanetaryAnalysis}` : ''}
${voiceStrategy}
${timelineContext ? `\n${timelineContext}` : ''}
${userContextBlock ? `\n${userContextBlock}` : ''}
${patternMirrorBlock ? `\n${patternMirrorBlock}` : ''}

CONVERSATION HISTORY (recent):
${recentContext || "[First session — introduce yourself briefly as Merlin if needed, then answer.]"}`;
}


const IMPERATIVE_START =
  /^(Do|Try|Consider|Spend|Call|Write|Take|Make|Start|Focus|Choose|Set|Keep|Give|Ask|Show|Practice|Reach|Record|Ship|Finish|Stop|Pick|Build|Send|Book|Schedule)\b/i;

function cleanTacticLine(raw: string): string {
  return raw
    .replace(/^[\s\-*•→–—]+/, '')
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate tactical suggestions based on chart context.
 * Uses word-boundary / sentence extraction — never mid-word matches
 * (old regex matched "call" inside "practically" → "cally and…").
 */
export function generateTacticalSuggestions(
  response: string,
  chart: BirthChartData | undefined,
  context: OracleContext
): string[] {
  void context;
  const tactics: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (raw: string) => {
    const line = cleanTacticLine(raw);
    if (line.length < 12 || line.length > 160) return;
    const key = line.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tactics.push(line);
  };

  // 1) Explicit bullets / numbered steps from Merlin's reply
  for (const line of response.split(/\r?\n/)) {
    if (/^\s*(?:[-*•→]|\d+[.)])\s+\S/.test(line)) {
      pushUnique(line);
    }
  }

  // 2) Imperative sentences (Do / Try / Take one step…)
  const sentences = response.match(/[A-Za-z][^.!?\n]{10,140}[.!?]/g) || [];
  for (const sentence of sentences) {
    if (IMPERATIVE_START.test(sentence.trim())) {
      pushUnique(sentence);
    }
  }

  // 3) Fallback: one clear chart-grounded move (not mid-word scrapes)
  if (tactics.length === 0 && chart?.planets?.length) {
    if (chart.planets.find((p: any) => p.name === 'Mars')) {
      pushUnique('Take one bold action today — small is fine, stuck is not');
    }
    if (chart.planets.find((p: any) => p.name === 'Venus')) {
      pushUnique('Reach one person who matters and say the true thing');
    }
    if (chart.planets.find((p: any) => p.name === 'Saturn')) {
      pushUnique('Finish one open loop before you open another');
    }
  }

  if (tactics.length === 0) {
    pushUnique('Name one next move for the next 24 hours and do only that');
  }

  return tactics.slice(0, 4);
}

/**
 * Generate a micro-forecast based on current transits or date
 * Now uses real transit data when available
 */
export function generateMicroForecast(
  currentDate: Date,
  chart: BirthChartData | undefined,
  transits?: TransitData
): { timeframe: string; themes: string[] } {
  const pickBySeed = <T,>(items: T[], seed: number): T => {
    if (!items || items.length === 0) {
      throw new Error('Template list cannot be empty');
    }
    return items[Math.abs(seed) % items.length];
  };

  const buildOracleLine = (seed: number, transitLabel?: string): string => {
    const intro = pickBySeed(oraclePhrases.intro, seed);
    const close = pickBySeed(oraclePhrases.close, seed + 1);
    const bodyFromAspect = transitLabel
      ? (oraclePhrases.aspectTemplates as Record<string, string[]>)?.[transitLabel]
      : undefined;
    const body = bodyFromAspect && bodyFromAspect.length > 0
      ? pickBySeed(bodyFromAspect, seed + 2)
      : pickBySeed(oraclePhrases.genericBody, seed + 2);
    return `${intro} ${body} ${close}`;
  };

  // If we have real transit data, use it!
  const mentionList =
    transits?.mentionWorthy?.mentioned?.length
      ? transits.mentionWorthy.mentioned
      : transits?.significant || [];
  if (mentionList.length > 0) {
    const themes: string[] = [];
    
    // Analyze mention-worthy transits for themes
    mentionList.slice(0, 3).forEach((t: any) => {
      const transitPlanet = t.transitingPlanet;
      const aspect = t.aspect;
      const natalPlanet = t.natalPlanet;
      const transitLabel = `${transitPlanet} ${aspect} ${natalPlanet}`;
      const seed = `${transitPlanet}-${aspect}-${natalPlanet}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0);
      
      // Map planets to themes
      const planetThemes: { [key: string]: string } = {
        'Sun': 'Identity & Purpose',
        'Moon': 'Emotions & Comfort',
        'Mercury': 'Communication & Ideas',
        'Venus': 'Love & Values',
        'Mars': 'Action & Drive',
        'Jupiter': 'Growth & Opportunity',
        'Saturn': 'Structure & Lessons',
        'Uranus': 'Change & Innovation',
        'Neptune': 'Dreams & Intuition',
        'Pluto': 'Transformation & Power'
      };
      
      const theme = planetThemes[transitPlanet];
      if (theme) {
        const nature = aspect === 'Square' || aspect === 'Opposition' ? 'challenges' : 'supports';
        themes.push(`${theme} (${transitPlanet} ${nature})`);
      }

      if (themes.length < 3) {
        themes.push(buildOracleLine(seed, transitLabel));
      }
    });
    
    // Add moon phase theme if available
    if (themes.length < 3) {
      const day = currentDate.getDay();
      const dayThemes = ['Reflection', 'Action', 'Choice', 'Emotion', 'Expression', 'Service', 'Balance'];
      themes.push(dayThemes[day]);
    }
    
    return {
      timeframe: 'Right now',
      themes: themes.slice(0, 3)
    };
  }
  
  // Fallback to simple cycle-based forecast
  const day = currentDate.getDay();
  const dayThemes: { [key: number]: string[] } = {
    0: ['Reflection', 'Rest', 'Integration'],
    1: ['Communication', 'Beginnings', 'Movement'],
    2: ['Duality', 'Choices', 'Information'],
    3: ['Emotion', 'Comfort', 'Roots'],
    4: ['Pride', 'Creativity', 'Performance'],
    5: ['Service', 'Health', 'Precision'],
    6: ['Balance', 'Partnership', 'Harmony'],
  };

  return {
    timeframe: 'This week',
    themes: [
      buildOracleLine(day * 97),
      ...(dayThemes[day] || ['Transition', 'Growth', 'Testing']),
    ].slice(0, 3),
  };
}

/**
 * Identify current "level" based on patterns in conversation
 */
export function identifyCurrentLevel(context: OracleContext): {
  current: string;
  challenge: string;
  reward: string;
} {
  const history = context.conversationHistory;
  const allText = history.map(m => m.content.toLowerCase()).join(' ');

  // Pattern detection
  const themes = {
    'survival': allText.includes('danger') || allText.includes('safe') || allText.includes('money'),
    'identity': allText.includes('who am i') || allText.includes('purpose') || allText.includes('path'),
    'relationships': allText.includes('love') || allText.includes('partner') || allText.includes('connection'),
    'power': allText.includes('authority') || allText.includes('control') || allText.includes('boss'),
    'integration': allText.includes('balance') || allText.includes('harmonize') || allText.includes('blend'),
  };

  const detectedTheme = Object.entries(themes).find(([, detected]) => detected)?.[0] || 'growth';

  const levelMap: { [key: string]: { current: string; challenge: string; reward: string } } = {
    survival: {
      current: 'Level 1: Survival & Grounding',
      challenge: 'Stabilize your foundation (health, money, safety)',
      reward: 'Solid ground to build from; clarity on what matters',
    },
    identity: {
      current: 'Level 2: Self-Definition',
      challenge: 'Discover who you actually are vs who you think you should be',
      reward: 'Authentic self; freedom from others\' expectations',
    },
    relationships: {
      current: 'Level 3: Connection & Intimacy',
      challenge: 'Learn to love without losing yourself; accept being seen',
      reward: 'Deep bonds that mirror your growth',
    },
    power: {
      current: 'Level 4: Authority & Mastery',
      challenge: 'Master your power; know when to lead, when to yield',
      reward: 'Sustainable influence; respect earned, not demanded',
    },
    integration: {
      current: 'Level 5: Integration & Legacy',
      challenge: 'Harmonize all parts of yourself; leave something lasting',
      reward: 'Coherent life; wisdom to pass on',
    },
    growth: {
      current: 'Level (Unfolding)',
      challenge: 'Embrace the next test; the universe is nudging you forward',
      reward: 'Expansion; the version of yourself on the other side',
    },
  };

  return levelMap[detectedTheme];
}

/**
 * Maintain conversation history (in-memory; can be swapped for database)
 */
export class OracleMemory {
  private conversations: Map<string, OracleMessage[]> = new Map();
  private maxMessages = 50; // Keep last 50 messages per user

  addMessage(userId: string, message: OracleMessage) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    const history = this.conversations.get(userId)!;
    history.push(message);

    // Trim if too long
    if (history.length > this.maxMessages) {
      history.splice(0, history.length - this.maxMessages);
    }
  }

  getHistory(userId: string): OracleMessage[] {
    return this.conversations.get(userId) || [];
  }

  clearHistory(userId: string) {
    this.conversations.delete(userId);
  }
}

export const oracleMemory = new OracleMemory();
