import { NextResponse } from 'next/server';
import { FileSystemDataService } from '@/lib/data/fileSystemDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = new FileSystemDataService();
    const documents = await service.getDocuments();
    const serialized = documents.map(d => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    }));
    return NextResponse.json({ success: true, documents: serialized });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
