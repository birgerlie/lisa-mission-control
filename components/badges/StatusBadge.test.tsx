import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  describe('task statuses', () => {
    it('renders backlog status', () => {
      render(<StatusBadge status="backlog" />);
      expect(screen.getByText('Backlog')).toBeInTheDocument();
    });

    it('renders in-progress status', () => {
      render(<StatusBadge status="in-progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('renders review status', () => {
      render(<StatusBadge status="review" />);
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('renders done status', () => {
      render(<StatusBadge status="done" />);
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('agent statuses', () => {
    it('renders active status with pulse animation', () => {
      render(<StatusBadge status="active" />);
      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
      
      const dot = badge.parentElement?.querySelector('.animate-pulse');
      expect(dot).toBeInTheDocument();
    });

    it('renders idle status', () => {
      render(<StatusBadge status="idle" />);
      expect(screen.getByText('Idle')).toBeInTheDocument();
    });

    it('renders error status', () => {
      render(<StatusBadge status="error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders completed status', () => {
      render(<StatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('cron statuses', () => {
    it('renders paused status', () => {
      render(<StatusBadge status="paused" />);
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });
  });

  it('renders unknown status with raw value', () => {
    render(<StatusBadge status="unknown-status" />);
    expect(screen.getByText('unknown-status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StatusBadge status="active" className="custom-class" />);
    expect(screen.getByText('Active')).toHaveClass('custom-class');
  });
});
