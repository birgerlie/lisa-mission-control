import { render, screen } from '@testing-library/react';
import { CronJobsList } from './CronJobsList';
import { CronJob } from '@/lib/types';

describe('CronJobsList', () => {
  const mockJobs: CronJob[] = [
    {
      id: '1',
      name: 'Morning Briefing',
      schedule: '0 8 * * *',
      lastRun: '2025-01-16T08:00:00Z',
      nextRun: '2025-01-17T08:00:00Z',
      status: 'active',
      command: 'generate-daily-brief',
    },
    {
      id: '2',
      name: 'Email Check',
      schedule: '*/30 * * * *',
      status: 'paused',
      command: 'check-emails',
    },
  ];

  it('renders section title', () => {
    render(<CronJobsList jobs={mockJobs} />);
    expect(screen.getByText('Upcoming Jobs')).toBeInTheDocument();
  });

  it('renders calendar link', () => {
    render(<CronJobsList jobs={mockJobs} />);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('renders job names', () => {
    render(<CronJobsList jobs={mockJobs} />);
    expect(screen.getByText('Morning Briefing')).toBeInTheDocument();
    expect(screen.getByText('Email Check')).toBeInTheDocument();
  });

  it('renders job schedules', () => {
    render(<CronJobsList jobs={mockJobs} />);
    expect(screen.getByText('0 8 * * *')).toBeInTheDocument();
    expect(screen.getByText('*/30 * * * *')).toBeInTheDocument();
  });

  it('renders empty state when no jobs', () => {
    render(<CronJobsList jobs={[]} />);
    expect(screen.getByText('No scheduled jobs')).toBeInTheDocument();
  });
});
