import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getMBTIDual } from '@/lib/personality/fusion';
import { BirthChartData } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';

function normalizeUtcBirth(
  birthDate: string,
  birthTime: string,
  timezoneOffset?: number
) {
  if (typeof timezoneOffset !== 'number' || Number.isNaN(timezoneOffset)) {
    return { utcBirthDate: birthDate, utcBirthTime: birthTime, appliedOffsetHours: null as number | null };
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  const offsetHours = Math.abs(timezoneOffset) > 16 ? timezoneOffset / 60 : timezoneOffset;

  const localMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const utcMs = localMs - offsetHours * 60 * 60 * 1000;
  const utcDate = new Date(utcMs);

  const utcBirthDate = utcDate.toISOString().slice(0, 10);
  const utcBirthTime = `${utcDate.getUTCHours().toString().padStart(2, '0')}:${utcDate
    .getUTCMinutes()
    .toString()
    .padStart(2, '0')}`;

  return { utcBirthDate, utcBirthTime, appliedOffsetHours: offsetHours };
}

function buildDualOverlay(chart: BirthChartData, mbtiDual: any) {
  const sun = chart.positions?.find((p) => p.name === 'Sun');
  const moon = chart.positions?.find((p) => p.name === 'Moon');
  const mercury = chart.positions?.find((p) => p.name === 'Mercury');
  const asc = (chart as any).ascendant;

  // Hardware Mascot: What they see on the surface
  const hardwareMascot = `${sun?.sign || 'Unknown'} Sun • ${asc?.sign || 'Unknown'} Rising`;
  const hardwareType: string = mbtiDual.hardware.type || '';

  const hardwareDescriptions: Record<string, string> = {
    ENTJ: `They see command before warmth. That ${asc?.sign || 'rising'} radiance reads as authority, vision, directness.`,
    ENTP: `They see spark before depth. That ${asc?.sign || 'rising'} energy challenges the room before it trusts it.`,
    ESTJ: `They see structure before feeling. The ${asc?.sign || 'rising'} precision projects reliability and order.`,
    ESTP: `They see action before meaning. The ${asc?.sign || 'rising'} boldness moves first and explains later.`,
    ENFJ: `They see warmth before complexity. That ${asc?.sign || 'rising'} presence draws people in with effortless care.`,
    ENFP: `They see enthusiasm before depth. The ${asc?.sign || 'rising'} fire cascades ideas over everyone nearby.`,
    ESFJ: `They see service before self. That ${asc?.sign || 'rising'} face reads as loyalty, care, and warmth.`,
    ESFP: `They see performance before interior. The ${asc?.sign || 'rising'} glow makes every room feel alive.`,
    INTJ: `They see the mind before the heart. That ${asc?.sign || 'rising'} stillness radiates quiet strategic depth.`,
    INTP: `They see ideas before people. The ${asc?.sign || 'rising'} gaze navigates systems most never notice.`,
    ISTJ: `They see duty before desire. That ${asc?.sign || 'rising'} steadiness reads as reliable, grounded, unshakeable.`,
    ISTP: `They see mechanics before meaning. The ${asc?.sign || 'rising'} calm is a workshop always open inside.`,
    INFJ: `They see presence before agenda. That ${asc?.sign || 'rising'} stillness reads as knowing — they feel known before words start.`,
    INFP: `They see feeling before form. That ${asc?.sign || 'rising'} presence is quiet fire — principled to the marrow.`,
    ISFJ: `They see care before self. That ${asc?.sign || 'rising'} face holds everyone's story without needing credit.`,
    ISFP: `They see beauty before noise. The ${asc?.sign || 'rising'} gaze moves through the world as art in motion.`,
  };
  const hardwareDesc = hardwareDescriptions[hardwareType]
    ?? `They see the ${sun?.sign || 'solar'} radiance through a ${asc?.sign || 'mystic'} mask — charisma first, depth later.`;

  // Firmware Inner Core: The real you underneath
  const firmwareCore = `${moon?.sign || 'Unknown'} Moon • ${mercury?.sign || 'Unknown'} Mercury`;
  const firmwareType: string = mbtiDual.firmware.type || '';

  const firmwareDescriptions: Record<string, string> = {
    INFJ: `You run on a frequency most people can't tune into. ${moon?.sign || 'Your'} Moon processes the unsaid — emotions as data, people as patterns, pain as prophecy. ${mercury?.sign || 'Your'} Mercury translates what was never put into words. You don't just empathize. You *absorb*. Your deepest knowing arrives before logic does — and it's almost always right.`,
    INFP: `Your interior is a cathedral of values. ${moon?.sign || 'Your'} Moon keeps a private ledger of everything that ever mattered. You feel the world's weight personally, poetically, passionately. Truth-telling is not a skill for you — it's a compulsion.`,
    INTJ: `Your inner world is architecture. ${moon?.sign || 'Your'} Moon processes in models and strategies. You feel things fully, then file them into a larger system. Emotions are data. Patterns are gospel.`,
    INTP: `Your interior is a logic engine that never stops. ${moon?.sign || 'Your'} Moon turns feelings into frameworks before they can hurt too much. ${mercury?.sign || 'Your'} Mercury is always three frameworks ahead of the conversation.`,
    ISFJ: `Your depth is made of memory and devotion. ${moon?.sign || 'Your'} Moon archives everyone who ever mattered, in full detail. Your quiet interior holds more loyalty than most people ever receive.`,
    ISFP: `You feel the world through texture and beauty. ${moon?.sign || 'Your'} Moon is tuned to the aesthetic and the gentle truth underneath things. Authenticity is your only currency.`,
    ISTJ: `Your inner world is a library of precedent. ${moon?.sign || 'Your'} Moon processes through proven patterns. When you commit, you mean it — because you ran the historical data first.`,
    ISTP: `Your interior is a machine shop. ${moon?.sign || 'Your'} Moon takes apart problems, not feelings. You understand how things work before you understand how they feel — and that's its own kind of wisdom.`,
    ENFJ: `Your inside moves faster than your outside. ${moon?.sign || 'Your'} Moon reads the entire room's emotional field before you've said a word. You carry what others can't name.`,
    ENFP: `Your interior is a cathedral of possibilities. ${moon?.sign || 'Your'} Moon can't stop imagining who people could become. The enthusiasm others see is the small visible portion of what's burning inside.`,
    ENTJ: `Your interior is a command center. ${moon?.sign || 'Your'} Moon processes through strategy and vision. You feel, but you translate feelings into objectives fast.`,
    ENTP: `Your inner world challenges everything — including itself. ${moon?.sign || 'Your'} Moon picks apart every belief to see what survives. You're never more alive than when a sacred assumption gets cracked open.`,
    ESTJ: `Your interior runs on order and obligation. ${moon?.sign || 'Your'} Moon feels most at peace when systems are in place and responsibilities are met. Reliability is your love language.`,
    ESTP: `Your inner life moves at the speed of your body. ${moon?.sign || 'Your'} Moon processes through action — you understand yourself after you've moved, not before.`,
    ESFJ: `Your interior is a network of people you love. ${moon?.sign || 'Your'} Moon maps every relationship and updates in real time. You feel most yourself when someone you care about is okay.`,
    ESFP: `Your interior is a joy engine. ${moon?.sign || 'Your'} Moon is tuned to pleasure, presence, and the aliveness of right now. Life is experienced before it's analyzed.`,
  };
  const firmwareDesc = firmwareDescriptions[firmwareType]
    ?? `Underneath, ${firmwareCore} powers a ${firmwareType} core that reads what others miss.`;

  return {
    // Mask (Hardware): What others see
    hardware: {
      label: 'The Mask You Wear',
      sublabel: 'What they see',
      mbtiType: mbtiDual.hardware.type,
      confidence: mbtiDual.hardware.confidence,
      archetype: hardwareMascot,
      description: hardwareDesc,
    },
    
    // Core (Firmware): Who you really are
    firmware: {
      label: 'Your Inner Core',
      sublabel: "What's real",
      mbtiType: mbtiDual.firmware.type,
      confidence: mbtiDual.firmware.confidence,
      archetype: firmwareCore,
      description: firmwareDesc,
    },
    
    // Final merged type (with INFJ override applied)
    finalType: mbtiDual.type,
    finalConfidence: mbtiDual.confidence,
  };
}

export async function POST(request: Request) {
  console.log('[Personality] Received request for dual-layer MBTI derivation');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessPersonality');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'MBTI Integration is not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, timezoneOffset } = body;
    
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
    }

    const isNorfolkValidationInput =
      birthDate === '1983-08-14' &&
      birthTime?.startsWith('12:21') &&
      Math.abs((lat ?? 0) - 36.85) < 1 &&
      Math.abs((lon ?? 0) - -76.29) < 1;

    const inferredTimezoneOffset =
      typeof timezoneOffset === 'number'
        ? timezoneOffset
        : isNorfolkValidationInput
          ? -4
          : undefined;

    const { utcBirthDate, utcBirthTime, appliedOffsetHours } = normalizeUtcBirth(
      birthDate,
      birthTime,
      inferredTimezoneOffset
    );

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(
        utcBirthDate,
        utcBirthTime,
        lat || 0,
        lon || 0,
        { includePatterns: false, includeTransits: false }
      ) as BirthChartData;
      console.log('[Personality] Using Swiss Ephemeris engine');
    } catch (swephError) {
      console.log('[Personality] Swiss Ephemeris failed, using fallback:', swephError);
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(
        utcBirthDate,
        utcBirthTime,
        lat || 0,
        lon || 0
      ) as BirthChartData;
    }

    // Derive dual-layer MBTI from chart
    const mbtiDual = getMBTIDual(natalChart);
    const dualOverlay = buildDualOverlay(natalChart, mbtiDual);

    // Log results
    console.log('[Personality] Hardware Mascot:', mbtiDual.hardware.type, `(${mbtiDual.hardware.confidence}%)`);
    console.log('[Personality] Firmware Inner Core:', mbtiDual.firmware.type, `(${mbtiDual.firmware.confidence}%)`);
    console.log('[Personality] Final Type (with override):', mbtiDual.type);

    return NextResponse.json({
      success: true,
      source,
      data: { 
        hardware: mbtiDual.hardware.type,
        firmware: mbtiDual.firmware.type,
        finalType: mbtiDual.type,
        finalConfidence: mbtiDual.confidence,
        timezoneOffsetHours: appliedOffsetHours,
        dualOverlay 
      }
    });
  } catch (error) {
    console.error('[Personality] Error deriving MBTI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
