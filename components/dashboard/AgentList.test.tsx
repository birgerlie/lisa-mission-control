import { render, screen } from '@testing-library/react';
import { AgentList } from './AgentList';
import { AgentSession } from '@/lib/types';

describe('AgentList', () => {
  const mockAgents: AgentSession[] = [
    {
      id: 'agent-1',
      name: 'Code Reviewer',
      status: 'active',
      task: 'Reviewing PR #234',
      runtime: 45 * 60 * 1000,
      startTime: '2025-01-16T13:45:00Z',
      progress: 65,
    },
    {
      id: 'agent-2',
      name: 'Doc Writer',
      status: 'idle',
      task: 'Waiting for assignment',
      runtime: 0,
      startTime: '2025-01-16T10:00:00Z',
    },
  ];

  it('renders section title', () => {
    render(<AgentList agents={mockAgents} />);
    expect(screen.getByText('Active Agents')).toBeInTheDocument();
  });

  it('renders manage link', () => {
    render(<AgentList agents={mockAgents} />);
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('renders agent names', () => {
    render(<AgentList agents={mockAgents} />);
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Doc Writer')).toBeInTheDocument();
  });

  it('renders agent tasks', () => {
    render(<AgentList agents={mockAgents} />);
    expect(screen.getByText('Reviewing PR #234')).toBeInTheDocument();
    expect(screen.getByText('Waiting for assignment')).toBeInTheDocument();
  });

  it('renders runtime for active agents', () => {
    render(<AgentList agents={mockAgents} />);
    expect(screen.getByText('45m 0s')).toBeInTheDocument();
  });

  it('renders empty state when no agents', () => {
    render(<AgentList agents={[]} />);
    expect(screen.getByText('No active agents')).toBeInTheDocument();
  });
});
