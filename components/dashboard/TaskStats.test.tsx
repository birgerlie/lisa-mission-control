import { render, screen } from '@testing-library/react';
import { TaskStats } from './TaskStats';
import { Task } from '@/lib/types';

describe('TaskStats', () => {
  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', status: 'backlog', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
    { id: '2', title: 'Task 2', status: 'in-progress', assignee: 'Lisa', priority: 'medium', createdAt: '2025-01-15' },
    { id: '3', title: 'Task 3', status: 'done', assignee: 'Bob', priority: 'low', createdAt: '2025-01-15' },
  ];

  it('renders active tasks count', () => {
    render(<TaskStats tasks={mockTasks} />);
    expect(screen.getByText('Active Tasks')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 non-done tasks
  });

  it('renders total tasks count', () => {
    render(<TaskStats tasks={mockTasks} />);
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles empty tasks array', () => {
    render(<TaskStats tasks={[]} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
  });
});
