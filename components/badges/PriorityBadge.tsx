import { cn } from '@/lib/classUtils';
import { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: {
    label: 'High',
    className: 'bg-red-500/15 text-red-400',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/15 text-amber-400',
  },
  low: {
    label: 'Low',
    className: 'bg-green-500/15 text-green-400',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
