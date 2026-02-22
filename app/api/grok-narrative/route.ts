import { NextResponse } from 'next/server';
import { generateGrokInterpretation } from '@/lib/grok-service';
import { generateChartHash, serverCache } from '@/lib/cache-service';
import { validateFeatureAccess } from '@/lib/subscription-validation';

interface RequestBody {
  mode: 'grok' | 'traditional';
  birthData?: {
    date: string;
    time: string;
    latitude: number;
    longitude: number;
  };
  chartData?: any;
  lifeArc?: any;
  transits?: any;
  tone?: 'direct' | 'warm'; // "No-Bullshit Mode"
}

function buildTraditionalNarrative({ chartData, lifeArc }: RequestBody): string {
  const planets = chartData?.positions || chartData?.planets || [];
  const sun = planets.find((p: any) => p.name === 'Sun');
  const moon = planets.find((p: any) => p.name === 'Moon');
  const asc = chartData?.ascendant;

  const topEvents = (lifeArc?.events || []).slice(0, 3);
  const eventLine =
    topEvents.length > 0
      ? `Your timeline is marked by ${topEvents
          .map((e: any) => `${e.transitingPlanet} ${e.aspect} ${e.natalPlanet}`)
          .join(', ')}.`
      : 'Your timeline is still unfolding through quieter preparation cycles.';

  return [
    `Your ${sun?.sign || 'solar'} Sun and ${moon?.sign || 'lunar'} Moon reveal a public fire with private depth. ${asc?.sign ? `With ${asc.sign} rising, people meet your edge before they meet your tenderness.` : ''}`,
    eventLine,
    'The world sees your confidence first; your real power is the inner pattern-recognition that keeps rebuilding your path before others notice the turn.',
  ].join('\n\n');
}

export async function POST(request: Request) {
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessGrokNarrative');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Grok AI Narratives are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }
  
  try {
    const body = (await request.json()) as RequestBody;
    const { mode = 'traditional', birthData, chartData, lifeArc, transits, tone = 'warm' } = body;

    if (!birthData || !chartData) {
      return NextResponse.json({ success: false, error: 'Missing birthData or chartData' }, { status: 400 });
    }

    const cacheKey = generateChartHash(
      birthData.date,
      birthData.time,
      birthData.latitude || 0,
      birthData.longitude || 0,
      { useGrok: mode === 'grok', tone }
    );

    const cached = serverCache.get<{ narrative: string; interpreter: 'grok' | 'traditional' }>(`grok-narrative:${cacheKey}`);
    if (cached) {
      return NextResponse.json({ success: true, cached: true, interpreter: cached.interpreter, data: cached });
    }

    if (mode === 'grok') {
      try {
        const grokResult = await generateGrokInterpretation({
          planets: chartData.positions || chartData.planets || [],
          aspects: chartData.aspects || [],
          houses: chartData.houses || [],
          ascendant: chartData.ascendant,
          birthData: {
            date: birthData.date,
            time: birthData.time,
            location: `${birthData.latitude},${birthData.longitude}`,
          },
        });

        // Handle "Quiet day" message if no transits
        if (!transits?.significant || transits.significant.length === 0) {
          const quietDayMessage = "Quiet day. Use it to think, not react.";
          const data = { narrative: quietDayMessage, interpreter: 'grok' as const };
          serverCache.set(`grok-narrative:${cacheKey}`, data);
          return NextResponse.json({ success: true, cached: false, interpreter: 'grok', data });
        }

        const timelineEvents = (lifeArc?.events || [])
          .slice(0, 5)
          .map((e: any) => `${e.year}: ${e.transitingPlanet} ${e.aspect} ${e.natalPlanet}`)
          .join('; ');

        // Build tone-specific transit summary
        let transitSummary = '';
        if (transits?.significant && transits.significant.length > 0 && tone === 'direct') {
          // Direct/No-Bullshit tone: specific callouts
          const exactTransits = transits.significant.slice(0, 3);
          const callouts = exactTransits.map((t: any) => {
            const planet = t.transitingPlanet || 'Transiting planet';
            const aspect = t.aspect || 'aspect';
            const natalPlanet = t.natalPlanet || 'natal planet';
            return `${planet} ${aspect} ${natalPlanet}? That's creating real friction right now—acknowledge it and work with it, don't ignore it.`;
          });
          transitSummary = callouts.join('\n');
        } else if (transits?.summary) {
          // Warm tone: standard summary
          transitSummary = `Active transits now: total ${transits.summary.total}, exact ${transits.summary.exact}, approaching ${transits.summary.approaching}.`;
        }

        const narrative = [
          grokResult.chartSummary,
          transitSummary,
          timelineEvents ? `Life Arc highlights: ${timelineEvents}.` : '',
        ]
          .filter(Boolean)
          .join('\n\n');

        const data = { narrative, interpreter: 'grok' as const };
        serverCache.set(`grok-narrative:${cacheKey}`, data);

        return NextResponse.json({ success: true, cached: false, interpreter: 'grok', data });
      } catch (error) {
        console.warn('[Grok Narrative] Grok failed, falling back to traditional:', error);
      }
    }

    const narrative = buildTraditionalNarrative({ chartData, lifeArc, transits, birthData, mode });
    const data = { narrative, interpreter: 'traditional' as const };
    serverCache.set(`grok-narrative:${cacheKey}`, data);

    return NextResponse.json({ success: true, cached: false, interpreter: 'traditional', data });
  } catch (error) {
    console.error('[Grok Narrative] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
