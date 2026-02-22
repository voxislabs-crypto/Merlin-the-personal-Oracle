import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine';
import { calculateBirthChart as calculateBirthChartFallback } from '@/lib/engine-fallback';
import { InterpretationEngine } from '@/lib/astrology/interpretations';
import { generateGrokInterpretation } from '@/lib/grok-service';
import { BirthChartData } from '@/types/astrology';

export async function POST(request: Request) {
  console.log('Received request for chart interpretation');
  
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon, mode = 'traditional' } = body;
    
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
      natalChart = calculateBirthChart(birthDate, birthTime, lat || 0, lon || 0) as BirthChartData;
    } catch (error) {
      source = 'mock-fallback';
      natalChart = calculateBirthChartFallback(birthDate, birthTime, lat || 0, lon || 0) as BirthChartData;
      console.warn('[Interpret API] Swiss failed, using fallback:', error);
    }

    let chartSummary = '';
    let planetInterpretations: Array<{ planet: string; interpretation: string }> = [];
    let aspectInterpretations: Array<{ planets: string; interpretation: string }> = [];
    let cacheHit = false;
    let usedGrok = false;

    // Try Grok AI if requested
    if (mode === 'grok') {
      try {
        console.log('[Interpret API] Attempting Grok interpretation...');
        const grokResult = await generateGrokInterpretation({
          planets: natalChart.positions || [],
          aspects: natalChart.aspects || [],
          houses: natalChart.houses,
          ascendant: (natalChart as any).ascendant,
          birthData: {
            date: birthDate,
            time: birthTime,
            location: `${lat},${lon}`
          }
        });

        chartSummary = grokResult.chartSummary;
        planetInterpretations = grokResult.planetInterpretations;
        aspectInterpretations = grokResult.aspectInterpretations;
        usedGrok = true;
        console.log('[Interpret API] ✅ Successfully used Grok AI');
      } catch (error) {
        console.warn('[Interpret API] Grok failed, falling back to traditional:', (error as Error).message);
        // Fall through to traditional engine
      }
    }

    // Use traditional engine if Grok wasn't used or failed
    if (!usedGrok) {
      console.log('[Interpret API] Using traditional interpretation engine');
      const engine = new InterpretationEngine();
      
      // Generate chart summary
      chartSummary = engine.generateChartSummary(
        natalChart.positions || [],
        natalChart.aspects || []
      );

      // Generate interpretations for personal planets (Sun through Mars)
      const personalPlanets = natalChart.positions?.filter(p => 
        ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.name)
      ) || [];

      planetInterpretations = personalPlanets.map(planet => ({
        planet: planet.name,
        interpretation: engine.generateInterpretation({
          planet: planet.name,
          sign: planet.sign,
          house: planet.house,
          quality: 75 // Default quality score
        })
      }));

      // Generate aspect interpretations (top 5 most significant)
      const topAspects = (natalChart.aspects || [])
        .sort((a, b) => (a.orb || 0) - (b.orb || 0))
        .slice(0, 5);

      aspectInterpretations = topAspects.map(aspect => ({
        planets: `${aspect.planet1.name} ${aspect.type} ${aspect.planet2.name}`,
        interpretation: engine.generateAspectInterpretation(aspect)
      }));
    }

    console.log(`Successfully generated ${usedGrok ? 'Grok' : 'traditional'} interpretations`);
    return NextResponse.json({
      success: true,
      cached: cacheHit,
      source,
      interpreter: usedGrok ? 'grok' : 'traditional',
      data: {
        chartSummary,
        planetInterpretations,
        aspectInterpretations,
        metadata: {
          generatedAt: new Date().toISOString(),
          birthDate,
          birthTime
        }
      }
    });
  } catch (error) {
    console.error('Error generating interpretations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

