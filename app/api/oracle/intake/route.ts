import { NextResponse } from 'next/server';

const paid = true; // BYPASS: Always skip checkout for now

export async function POST(request: Request) {
  try {
    // real logic later — calculate chart → MBTI → whisper
    const formData = await request.formData();
    const birthDate = formData.get('birthDate') as string;
    const birthTime = formData.get('birthTime') as string;
    const birthCity = formData.get('birthCity') as string;

    console.log('Intake received:', { birthDate, birthTime, birthCity });

    // Validate required fields
    if (!birthDate || !birthTime || !birthCity) {
      console.error('Missing required fields:', { birthDate, birthTime, birthCity });
      return NextResponse.json(
        { error: 'Missing required fields: birthDate, birthTime, birthCity' },
        { status: 400 }
      );
    }

    if (!paid) {
      return NextResponse.redirect(
        new URL(
          `/checkout?birthDate=${encodeURIComponent(birthDate)}&birthTime=${encodeURIComponent(birthTime)}&birthCity=${encodeURIComponent(birthCity)}`,
          request.url
        )
      );
    }

    // if paid — go to dashboard with data
    return NextResponse.redirect(
      new URL(
        `/dashboard?date=${encodeURIComponent(birthDate)}&time=${encodeURIComponent(birthTime)}&city=${encodeURIComponent(birthCity)}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Error in intake endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}