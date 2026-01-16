import { NextResponse } from 'next/server';

// In-memory state for demo; replace with database/KV store in production
let spotsLeft = 47;

export async function GET() {
  return NextResponse.json({ spotsLeft });
}

export async function POST() {
  spotsLeft = Math.max(spotsLeft - 1, 0);
  return NextResponse.json({ spotsLeft });
}
