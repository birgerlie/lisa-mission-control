import { NextResponse } from 'next/server';
import { teamConfig } from '@/lib/data/teamConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ success: true, team: teamConfig });
}
