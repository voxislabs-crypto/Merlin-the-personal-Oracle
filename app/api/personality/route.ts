import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { getMBTIDual } from '@/lib/personality/fusion';
import { BirthChartData } from '@/types/astrology';

function buildDualOverlay(chart: BirthChartData, mbtiDual: any) {
  const sun = chart.positions?.find((p) => p.name === 'Sun');
  const moon = chart.positions?.find((p) => p.name === 'Moon');
  const mercury = chart.positions?.find((p) => p.name === 'Mercury');
  const asc = (chart as any).ascendant;

  // Hardware Mascot: What they see on the surface
  const hardwareMascot = `${sun?.sign || 'Unknown'} Sun • ${asc?.sign || 'Unknown'} Rising`;
  const hardwareDesc = `They see the ${sun?.sign || 'solar'} radiance through a ${asc?.sign || 'mystic'} mask—charisma first, heart later.`;

  // Firmware Inner Core: The real you underneath
  const firmwareCore = `${moon?.sign || 'Unknown'} Moon • ${mercury?.sign || 'Unknown'} Mercury`;
  const firmwareDesc =
    mbtiDual.firmware.type === 'INFJ'
      ? `Your code runs on quiet empathy and deep knowing. ${firmwareCore} is your hidden operating system.`
      : `Underneath, ${firmwareCore} powers a ${mbtiDual.firmware.type} core that reads what others miss.`;

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
