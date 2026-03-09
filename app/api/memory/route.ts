import { NextResponse } from 'next/server';
import { FileSystemDataService } from '@/lib/data/fileSystemDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = new FileSystemDataService();
    const memories = await service.getMemoryFiles();

    // Serialize Date objects
    const serialized = memories.map(m => ({
      ...m,
      lastModified: m.lastModified.toISOString(),
    }));

    return NextResponse.json({ success: true, memories: serialized });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}
