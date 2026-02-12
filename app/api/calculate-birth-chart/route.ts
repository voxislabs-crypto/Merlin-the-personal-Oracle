
import { NextResponse } from 'next/server';
import { calculateAll } from '@/lib/astrology/calculate';
import { calculateAll as calculateFallback } from '@/lib/engine-fallback';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon } = body;
    
    console.log('[API] Calculate birth chart request:', { birthDate, birthTime, lat, lon });
    
    if (!birthDate || !birthTime || lat === undefined || lon === undefined) {
      console.error('[API] Missing required parameters:', { birthDate, birthTime, lat, lon });
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Parse the birth date and time
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hours, minutes] = birthTime.split(':').map(Number);
    
    console.log('[API] Parsed date/time:', { year, month, day, hours, minutes, lat, lon });

    // Try remote droplet first
    try {
      const url = `http://165.22.37.45:3001/chart?year=${year}&month=${month}&day=${day}&hour=${hours}&min=${minutes}&lat=${lat}&lon=${lon}`;
      console.log('[API] Attempting remote engine:', url);
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Engine error');
      const data = await response.json();
      console.log('[API] Remote engine success');
      return NextResponse.json({ success: true, data });
    } catch (err) {
      console.log('[API] Remote engine failed, using fallback:', err);
      // Fallback to local engine
      try {
        const chartData = calculateFallback({
          year,
          month,
          day,
          hours,
          minutes,
          latitude: lat,
          longitude: lon,
          houseSystem: 'Placidus',
          zodiac: 'Tropical',
          orb: 6
        });
        console.log('[API] Fallback engine success');
        return NextResponse.json({ success: true, data: chartData, fallback: true });
      } catch (fallbackError) {
        console.error('[API] Fallback engine failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('[API] Calculate birth chart error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate birth chart';
    return NextResponse.json({ success: false, error: errorMessage, details: String(error) }, { status: 500 });
  }
}
