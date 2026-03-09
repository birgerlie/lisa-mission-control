'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { TaskStats } from '@/components/dashboard/TaskStats';
import { AgentList } from '@/components/dashboard/AgentList';
import { CronJobsList } from '@/components/dashboard/CronJobsList';
import { RecentMemory } from '@/components/dashboard/RecentMemory';
import { ActivityFeed } from '@/components/tasks/ActivityFeed';
import type { Task, AgentSession, CronJob, MemoryFile, MissionInfo } from '@/lib/types';

const REFRESH_INTERVAL = 30000;

interface DashboardData {
  tasks: Task[];
  agents: AgentSession[];
  cronJobs: CronJob[];
  memories: MemoryFile[];
  mission: MissionInfo | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, cronRes, agentsRes, memoryRes, teamRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/cron-jobs'),
        fetch('/api/agents'),
        fetch('/api/memory'),
        fetch('/api/team'),
      ]);

      const [tasksData, cronData, agentsData, memoryData, teamData] = await Promise.all([
        tasksRes.json(),
        cronRes.json(),
        agentsRes.json(),
        memoryRes.json(),
        teamRes.json(),
      ]);

      const memories: MemoryFile[] = (memoryData.memories || []).map((m: MemoryFile & { lastModified: string }) => ({
        ...m,
        lastModified: new Date(m.lastModified),
      }));

      setData({
        tasks: tasksData.tasks || [],
        agents: agentsData.agents || [],
        cronJobs: cronData.jobs || [],
        memories,
        mission: teamData.team || null,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#5e6ad2] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {data?.mission && (
        <div className="mb-6 px-5 py-4 bg-[#1b1b1f] border border-[#2a2a2e] rounded-lg">
          <p className="text-sm text-[#5e6ad2] font-medium">{data.mission.name} &middot; {data.mission.role}</p>
          <p className="text-[#d1d5db] mt-1">{data.mission.mission}</p>
        </div>
      )}

      <DashboardHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskStats tasks={data?.tasks || []} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <AgentList agents={data?.agents || []} />
            <CronJobsList jobs={data?.cronJobs || []} />
            <RecentMemory memories={data?.memories || []} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
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
