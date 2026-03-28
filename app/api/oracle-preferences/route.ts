import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

type InterpretationMode = 'grok' | 'traditional';
type OracleTonePreset = 'warm' | 'direct' | 'mystic' | 'strategic';
type OracleMode = 'auto' | 'casual' | 'detailed';
type ProphecyPolishMode = 'engine' | 'groq';

type OraclePreferences = {
  clarityMode?: boolean;
  interpretationMode?: InterpretationMode;
  noBullshitMode?: boolean;
  questLogEnabled?: boolean;
  oracleTonePreset?: OracleTonePreset;
  oracleMode?: OracleMode;
  includeLikelihood?: boolean;
  ancientLayer?: boolean;
  prophecyPolishMode?: ProphecyPolishMode;
  updatedAt?: number;
};

function sanitizePreferences(input: unknown): OraclePreferences {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const value = input as Record<string, unknown>;
  const preferences: OraclePreferences = {};

  if (typeof value.clarityMode === 'boolean') {
    preferences.clarityMode = value.clarityMode;
  }
  if (value.interpretationMode === 'grok' || value.interpretationMode === 'traditional') {
    preferences.interpretationMode = value.interpretationMode;
  }
  if (typeof value.noBullshitMode === 'boolean') {
    preferences.noBullshitMode = value.noBullshitMode;
  }
  if (typeof value.questLogEnabled === 'boolean') {
    preferences.questLogEnabled = value.questLogEnabled;
  }
  if (
    value.oracleTonePreset === 'warm' ||
    value.oracleTonePreset === 'direct' ||
    value.oracleTonePreset === 'mystic' ||
    value.oracleTonePreset === 'strategic'
  ) {
    preferences.oracleTonePreset = value.oracleTonePreset;
  }
  if (value.oracleMode === 'auto' || value.oracleMode === 'casual' || value.oracleMode === 'detailed') {
    preferences.oracleMode = value.oracleMode;
  }
  if (typeof value.includeLikelihood === 'boolean') {
    preferences.includeLikelihood = value.includeLikelihood;
  }
  if (typeof value.ancientLayer === 'boolean') {
    preferences.ancientLayer = value.ancientLayer;
  }
  if (value.prophecyPolishMode === 'engine' || value.prophecyPolishMode === 'groq') {
    preferences.prophecyPolishMode = value.prophecyPolishMode;
  }
  if (typeof value.updatedAt === 'number') {
    preferences.updatedAt = value.updatedAt;
  }

  return preferences;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const preferences = sanitizePreferences((user.publicMetadata as Record<string, unknown> | undefined)?.oraclePreferences);

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const incoming = sanitizePreferences(body);
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existingMetadata = (user.publicMetadata as Record<string, unknown> | undefined) || {};
    const existingPreferences = sanitizePreferences(existingMetadata.oraclePreferences);
    const mergedPreferences: OraclePreferences = {
      ...existingPreferences,
      ...incoming,
      updatedAt: Date.now(),
    };

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existingMetadata,
        oraclePreferences: mergedPreferences,
      },
    });

    return NextResponse.json({ success: true, data: mergedPreferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}