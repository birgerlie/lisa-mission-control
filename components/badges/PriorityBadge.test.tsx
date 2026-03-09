import { render, screen } from '@testing-library/react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '@/lib/types';

describe('PriorityBadge', () => {
  it.each(['high', 'medium', 'low'] as Priority[])('renders %s priority badge', (priority) => {
    render(<PriorityBadge priority={priority} />);
    
    const badge = screen.getByText(priority, { exact: false });
    expect(badge).toBeInTheDocument();
    expect(badge.tagName.toLowerCase()).toBe('span');
  });

  it('renders high priority with correct styling', () => {
    render(<PriorityBadge priority="high" />);
    
    const badge = screen.getByText('High');
    expect(badge).toHaveClass('bg-red-500/15', 'text-red-400');
  });

  it('renders medium priority with correct styling', () => {
    render(<PriorityBadge priority="medium" />);
    
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('bg-amber-500/15', 'text-amber-400');
  });

  it('renders low priority with correct styling', () => {
    render(<PriorityBadge priority="low" />);
    
    const badge = screen.getByText('Low');
    expect(badge).toHaveClass('bg-green-500/15', 'text-green-400');
  });

  it('applies custom className', () => {
    render(<PriorityBadge priority="high" className="custom-class" />);
    
    const badge = screen.getByText('High');
    expect(badge).toHaveClass('custom-class');
  });
});
