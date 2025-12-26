import { NextResponse } from 'next/server';
import { calculateAll } from '@/lib/astrology/calculate';

export async function POST(request: Request) {
  console.log('Received request to calculate birth chart');
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { birthDate, birthTime, lat, lon } = body;
    
    if (!birthDate || !birthTime || lat === undefined || lon === undefined) {
      const error = 'Missing required parameters';
      console.error(error, { birthDate, birthTime, lat, lon });
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    // Parse the birth date and time
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hours, minutes] = birthTime.split(':').map(Number);
    
    console.log('Calculating chart for:', {
      year, month, day, hours, minutes, lat, lon
    });
    
    try {
      // Calculate the birth chart
      const chartData = calculateAll({
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

      console.log('Successfully calculated chart');
      return NextResponse.json({
        success: true,
        data: chartData
      });
    } catch (calcError) {
      console.error('Error in calculateAll:', calcError);
      if (calcError instanceof Error) {
        console.error('Error stack:', calcError.stack);
      }
      throw calcError;
    }
  } catch (error) {
    console.error('Error in API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate birth chart',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
