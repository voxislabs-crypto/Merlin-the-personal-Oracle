import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/engine-fallback';
import { InterpretationEngine } from '@/lib/astrology/interpretations';
import { BirthChartData } from '@/types/astrology';

export async function POST(request: Request) {
  console.log('Received request for chart interpretation');
  
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
    const natalChart = calculateBirthChart(
      birthDate,
      birthTime,
      lat || 0,
      lon || 0
    ) as BirthChartData;

    const engine = new InterpretationEngine();
    
    // Generate chart summary
    const chartSummary = engine.generateChartSummary(
      natalChart.positions || [],
      natalChart.aspects || []
    );

    // Generate interpretations for personal planets (Sun through Mars)
    const personalPlanets = natalChart.positions?.filter(p => 
      ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.name)
    ) || [];

    const planetInterpretations = personalPlanets.map(planet => ({
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

    const aspectInterpretations = topAspects.map(aspect => ({
      planets: `${aspect.planet1.name} ${aspect.type} ${aspect.planet2.name}`,
      interpretation: engine.generateAspectInterpretation(aspect)
    }));

    console.log('Successfully generated interpretations');
    return NextResponse.json({
      success: true,
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
