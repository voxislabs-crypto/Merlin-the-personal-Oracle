import { NextResponse } from 'next/server';
import { validateFeatureAccess } from '@/lib/subscription-validation';
import { handleCafeForecastBody, handleLegacyForecastBody } from '@/lib/cafe/forecast-handler';

export async function POST(request: Request) {
  console.log('Received request for daily forecast');
  
  // Check subscription tier
  const hasAccess = await validateFeatureAccess('canAccessForecast');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Daily Forecasts are not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // New contract path: provider-agnostic CAFE forecast request.
    if (body?.version === 'cafe-forecast-v1') {
      return handleCafeForecastBody(body);
    }
    return handleLegacyForecastBody(body);
  } catch (error) {
    console.error('Error generating forecast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
