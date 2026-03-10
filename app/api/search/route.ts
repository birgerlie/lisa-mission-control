import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SILICONDB_URL = 'https://silver-plums-hear.loca.lt';

// POST /api/search - Proxy search to SiliconDB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const endpoint = body._endpoint || '/api/search';
    delete body._endpoint;

    const res = await fetch(`${SILICONDB_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': '1'
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('SiliconDB search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to SiliconDB' },
      { status: 502 }
    );
  }
}

// GET /api/search/status - Check SiliconDB connection
export async function GET() {
  try {
    const res = await fetch(`${SILICONDB_URL}/api/status`, {
      headers: { 'bypass-tunnel-reminder': '1' }
    });
    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'SiliconDB is not reachable' },
      { status: 502 }
    );
  }
}
