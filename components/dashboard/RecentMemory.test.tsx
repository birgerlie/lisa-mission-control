import { render, screen } from '@testing-library/react';
import { RecentMemory } from './RecentMemory';
import { MemoryFile } from '@/lib/types';

describe('RecentMemory', () => {
  const mockMemories: MemoryFile[] = [
    {
      date: '2025-01-15',
      filename: '2025-01-15.md',
      content: '# Daily Notes\n\nToday was productive.',
      lastModified: new Date('2025-01-15T10:00:00Z'),
    },
    {
      date: '2025-01-14',
      filename: '2025-01-14.md',
      content: 'Older notes from yesterday.',
      lastModified: new Date('2025-01-14T10:00:00Z'),
    },
  ];

  it('renders section title', () => {
    render(<RecentMemory memories={mockMemories} />);
    expect(screen.getByText('Recent Memory')).toBeInTheDocument();
  });

  it('renders browse link', () => {
    render(<RecentMemory memories={mockMemories} />);
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  it('renders latest memory date', () => {
    render(<RecentMemory memories={mockMemories} />);
    expect(screen.getByText('2025-01-15')).toBeInTheDocument();
  });

  it('renders memory content preview', () => {
    render(<RecentMemory memories={mockMemories} />);
    expect(screen.getByText(/Daily Notes/)).toBeInTheDocument();
  });

  it('renders empty state when no memories', () => {
    render(<RecentMemory memories={[]} />);
    expect(screen.getByText('No memory files found')).toBeInTheDocument();
  });
});
