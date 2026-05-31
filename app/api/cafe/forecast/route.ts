import { NextRequest } from 'next/server';

import { requireCafeGatewayAuth } from '@/lib/cafe/gateway-auth';
import { handleCafeForecastBody } from '@/lib/cafe/forecast-handler';

export async function POST(request: NextRequest) {
  const authResponse = requireCafeGatewayAuth(request);
  if (authResponse) {
    return authResponse;
  }

  const body = await request.json();
  return handleCafeForecastBody(body);
}