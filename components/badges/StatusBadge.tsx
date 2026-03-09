import { cn } from '@/lib/classUtils';
import { TaskStatus, AgentStatus, CronStatus } from '@/lib/types';

type StatusType = TaskStatus | AgentStatus | CronStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  // Task statuses
  backlog: {
    label: 'Backlog',
    className: 'bg-gray-500/15 text-gray-400',
    dotColor: 'bg-gray-400',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-blue-500/15 text-blue-400',
    dotColor: 'bg-blue-400',
  },
  review: {
    label: 'Review',
    className: 'bg-amber-500/15 text-amber-400',
    dotColor: 'bg-amber-400',
  },
  done: {
    label: 'Done',
    className: 'bg-green-500/15 text-green-400',
    dotColor: 'bg-green-400',
  },
  // Agent statuses
  active: {
    label: 'Active',
    className: 'bg-green-500/15 text-green-400',
    dotColor: 'bg-green-400 animate-pulse',
  },
  idle: {
    label: 'Idle',
    className: 'bg-gray-500/15 text-gray-400',
    dotColor: 'bg-gray-400',
  },
  error: {
    label: 'Error',
    className: 'bg-red-500/15 text-red-400',
    dotColor: 'bg-red-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-500/15 text-blue-400',
    dotColor: 'bg-blue-400',
  },
  // Cron statuses
  paused: {
    label: 'Paused',
    className: 'bg-amber-500/15 text-amber-400',
    dotColor: 'bg-amber-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-500/15 text-gray-400',
    dotColor: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
