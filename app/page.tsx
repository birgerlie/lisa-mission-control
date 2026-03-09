import { TaskStats } from '@/components/dashboard/TaskStats';
import { AgentList } from '@/components/dashboard/AgentList';
import { CronJobsList } from '@/components/dashboard/CronJobsList';
import { RecentMemory } from '@/components/dashboard/RecentMemory';
import { FileSystemDataService } from '@/lib/data/fileSystemDataService';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const dataService = new FileSystemDataService();
  
  const [tasks, cronJobs, agents, memories] = await Promise.all([
    dataService.getTasks(),
    dataService.getCronJobs(),
    dataService.getAgentSessions(),
    dataService.getMemoryFiles(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <DashboardHeader />
      <TaskStats tasks={tasks} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AgentList agents={agents} />
        <CronJobsList jobs={cronJobs} />
        <RecentMemory memories={memories} />
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-[#f7f8f8] mb-2">Dashboard</h1>
      <p className="text-[#8a8f98]">Overview of Lisa&apos;s operations and activities</p>
    </div>
  );
}
