import Link from 'next/link';
import { MemoryFile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/cards/Card';
import { Brain, ArrowRight } from 'lucide-react';

interface RecentMemoryProps {
  memories: MemoryFile[];
}

/**
 * Displays the most recent memory file content preview.
 */
export function RecentMemory({ memories }: RecentMemoryProps) {
  const latestMemory = memories[0];

  return (
    <Card>
      <CardHeader>
        <SectionHeader />
      </CardHeader>
      <CardContent>
        {latestMemory ? (
          <MemoryPreview memory={latestMemory} />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-[#f2c94c]" />
        Recent Memory
      </CardTitle>
      <Link 
        href="/memory" 
        className="text-sm text-[#5e6ad2] hover:underline flex items-center gap-1"
      >
        Browse <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-[#8a8f98] text-sm">No memory files found</p>
  );
}

interface MemoryPreviewProps {
  memory: MemoryFile;
}

function MemoryPreview({ memory }: MemoryPreviewProps) {
  const preview = extractPreview(memory.content);

  return (
    <div className="bg-[#0f1115] rounded-lg p-4">
      <MemoryHeader date={memory.date} />
      <PreviewContent content={preview} />
    </div>
  );
}

interface MemoryHeaderProps {
  date: string;
}

function MemoryHeader({ date }: MemoryHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-[#f7f8f8]">{date}</span>
    </div>
  );
}

interface PreviewContentProps {
  content: string;
}

function PreviewContent({ content }: PreviewContentProps) {
  return (
    <div className="text-sm text-[#8a8f98] line-clamp-4 font-mono">
      {content}
    </div>
  );
}

const PREVIEW_MAX_LENGTH = 300;

function extractPreview(content: string): string {
  if (content.length <= PREVIEW_MAX_LENGTH) {
    return content;
  }
  return content.substring(0, PREVIEW_MAX_LENGTH) + '...';
}
