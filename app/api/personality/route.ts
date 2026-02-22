import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getMBTI } from '@/lib/personality/fusion';
import { BirthChartData } from '@/types/astrology';

function buildDualOverlay(chart: BirthChartData, mbtiType: string) {
  const sun = chart.positions?.find((p) => p.name === 'Sun');
  const moon = chart.positions?.find((p) => p.name === 'Moon');
  const mercury = chart.positions?.find((p) => p.name === 'Mercury');
  const asc = (chart as any).ascendant;

  const natalArchetype = `${sun?.sign || 'Unknown'} Sun • ${asc?.sign || 'Unknown'} Rising`;
  const firmwareArchetype = `${moon?.sign || 'Unknown'} Moon • ${mercury?.sign || 'Unknown'} Mercury`;

  const natalPoetic = `The world meets your ${sun?.sign || 'solar'} radiance through a ${asc?.sign || 'mystic'} mask—charisma first, heart later.`;
  const firmwarePoetic =
    mbtiType === 'INFJ'
      ? `Stars gave you a lion's roar, but your code runs on quiet empathy. ${firmwareArchetype} is your hidden operating system.`
      : `Under the surface, ${firmwareArchetype} powers a ${mbtiType} core that reads what others miss.`;

  return {
    natal: {
      label: 'What they see',
      archetype: natalArchetype,
      description: natalPoetic,
    },
    firmware: {
      label: "What's real",
      mbtiType,
      archetype: firmwareArchetype,
      description: firmwarePoetic,
    },
  };
}

export async function POST(request: Request) {
  console.log('[Personality] Received request for MBTI derivation');
  
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon } = body;
    
    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { success: false, error: 'Missing birth date or time' },
        { status: 400 }
      );
    }

    // Calculate natal birth chart
    let natalChart: BirthChartData;
    let source: 'swiss-real' | 'mock-fallback' = 'swiss-real';
    try {
      natalChart = calculateBirthChart(
        birthDate,
        birthTime,
        lat || 0,
        lon || 0,
        { includePatterns: false, includeTransits: false }
      ) as BirthChartData;
      console.log('[Personality] Using Swiss Ephemeris engine');
    } catch (swephError) {
      console.log('[Personality] Swiss Ephemeris failed, using fallback:', swephError);
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(
        birthDate,
        birthTime,
        lat || 0,
        lon || 0
      ) as BirthChartData;
    }

    // Derive MBTI from chart
    const mbtiType = getMBTI(natalChart);
    const dualOverlay = buildDualOverlay(natalChart, mbtiType);

    console.log('[Personality] Successfully derived MBTI:', mbtiType);
    return NextResponse.json({
      success: true,
      source,
      data: { mbtiType, dualOverlay }
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
