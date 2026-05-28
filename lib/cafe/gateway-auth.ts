import { NextResponse } from 'next/server';

function readBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null;

  const [scheme, ...rest] = headerValue.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || rest.length === 0) {
    return null;
  }

  const token = rest.join(' ').trim();
  return token.length > 0 ? token : null;
}

export function requireCafeGatewayAuth(request: Request): NextResponse | null {
  const configuredKey = process.env.MERLIN_GATEWAY_KEY;

  if (!configuredKey) {
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'MERLIN_GATEWAY_KEY is not configured',
      },
      { status: 500 }
    );
  }

  const token = readBearerToken(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Missing bearer token',
      },
      { status: 401 }
    );
  }

  if (token !== configuredKey) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN',
        message: 'Invalid gateway credentials',
      },
      { status: 403 }
    );
  }

  return null;
}