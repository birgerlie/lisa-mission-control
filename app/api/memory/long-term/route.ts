import { NextResponse } from 'next/server';
import { FileSystemDataService } from '@/lib/data/fileSystemDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = new FileSystemDataService();
    const content = await service.getLongTermMemory();

    return NextResponse.json({ success: true, content });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch long-term memory' },
      { status: 500 }
    );
  }
}
