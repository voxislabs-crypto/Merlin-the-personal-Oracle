import { NextRequest, NextResponse } from 'next/server';

import { buildSharedAtmosphereReport } from '@/lib/astrology/shared-atmosphere';
import type { BirthChartData, SharedAtmosphereMode, SharedSignalConsent } from '@/types/astrology';
import { validateFeatureAccess } from '@/lib/subscription-validation';

interface SharedAtmosphereRequest {
  chart1: BirthChartData;
  chart2: BirthChartData;
  person1Name?: string;
  person2Name?: string;
  mode?: SharedAtmosphereMode;
  sharedConsent?: boolean;
  sources?: SharedSignalConsent[];
}

export async function POST(request: NextRequest) {
  const hasAccess = await validateFeatureAccess('canAccessSynastry');
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Shared atmosphere is not available on the free tier',
        code: 'FEATURE_NOT_AVAILABLE',
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as SharedAtmosphereRequest;
    const {
      chart1,
      chart2,
      person1Name,
      person2Name,
      mode = 'couple',
      sharedConsent = false,
      sources = [],
    } = body;

    if (!chart1 || !chart1.positions || !chart2 || !chart2.positions) {
      return NextResponse.json({ success: false, error: 'Two complete charts are required' }, { status: 400 });
    }

    if (!sharedConsent) {
      return NextResponse.json(
        { success: false, error: 'Shared atmosphere requires explicit consent from all participants.' },
        { status: 400 }
      );
    }

    const report = buildSharedAtmosphereReport({
      chart1,
      chart2,
      person1Name,
      person2Name,
      mode,
      sharedConsent,
      sources,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Shared atmosphere generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate shared atmosphere report',
      },
      { status: 500 }
    );
  }
}
