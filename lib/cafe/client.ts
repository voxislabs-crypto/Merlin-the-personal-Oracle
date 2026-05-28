import 'server-only';

import type { CafeForecastRequest, CafeForecastResponse } from '@/shared/cafe-contracts';

export interface CafeGatewayClientOptions {
  baseUrl?: string;
  gatewayKey?: string;
  fetchImpl?: typeof fetch;
}

function getDefaultBaseUrl(): string {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

function getDefaultGatewayKey(): string | undefined {
  return process.env.MERLIN_GATEWAY_KEY;
}

function resolveCafeForecastUrl(baseUrl?: string): string {
  return new URL('/api/cafe/forecast', baseUrl || getDefaultBaseUrl()).toString();
}

export function createCafeForecastRequest(
  payload: CafeForecastRequest,
  options: CafeGatewayClientOptions = {}
): RequestInit {
  const gatewayKey = options.gatewayKey || getDefaultGatewayKey();

  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(gatewayKey ? { Authorization: `Bearer ${gatewayKey}` } : {}),
    },
    body: JSON.stringify(payload),
  };
}

export async function postCafeForecast(
  payload: CafeForecastRequest,
  options: CafeGatewayClientOptions = {}
): Promise<CafeForecastResponse> {
  const fetchImpl = options.fetchImpl || fetch;
  const response = await fetchImpl(resolveCafeForecastUrl(options.baseUrl), createCafeForecastRequest(payload, options));

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as CafeForecastResponse;
}