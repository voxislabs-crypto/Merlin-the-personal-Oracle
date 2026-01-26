
import { NextResponse } from 'next/server';
import { calculateAll } from '@/lib/astrology/calculate';
import { calculateAll as calculateFallback } from '@/lib/engine-fallback';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lon } = body;
    if (!birthDate || !birthTime || lat === undefined || lon === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Parse the birth date and time
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hours, minutes] = birthTime.split(':').map(Number);

    // Try remote droplet first
    try {
      const url = `http://165.22.37.45:3001/chart?year=${year}&month=${month}&day=${day}&hour=${hours}&min=${minutes}&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error('Engine error');
      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } catch (err) {
      // Fallback to local engine
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
      return NextResponse.json({ success: true, data: chartData, fallback: true });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to calculate birth chart' }, { status: 500 });
  }
}
