import Link from 'next/link';
import { Task } from '@/lib/types';
import { calculateTaskStats, getActiveTasksCount } from '@/lib/tasks/taskUtils';
import { Card } from '@/components/cards/Card';
import { Kanban, ArrowRight } from 'lucide-react';

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const stats = calculateTaskStats(tasks);
  const activeCount = getActiveTasksCount(tasks);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Tasks"
        value={activeCount}
        subtitle={`${stats.inProgress} in progress`}
        icon={Kanban}
        color="bg-[#5e6ad2]/10 text-[#5e6ad2]"
      />
      <StatCard
        title="Total Tasks"
        value={stats.total}
        subtitle="All time"
        icon={Kanban}
        color="bg-[#4ade80]/10 text-[#4ade80]"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8a8f98] text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#f7f8f8]">{value}</p>
          <p className="text-xs text-[#8a8f98] mt-1">{subtitle}</p>
        </div>
        <div className={color + ' w-10 h-10 rounded-lg flex items-center justify-center'}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
