'use client';

import { useState } from 'react';
import { cn } from '@/lib/classUtils';
import { formatRelativeTime, formatDate } from '@/lib/dateUtils';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  History
} from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
  command: string;
  history?: { timestamp: string; status: 'success' | 'error'; output?: string }[];
}

const initialJobs: CronJob[] = [
  {
    id: '1',
    name: 'Morning Briefing',
    schedule: '0 8 * * *',
    lastRun: '2025-01-16T08:00:00Z',
    nextRun: '2025-01-17T08:00:00Z',
    status: 'active',
    command: 'generate-daily-brief',
    history: [
      { timestamp: '2025-01-16T08:00:00Z', status: 'success' },
      { timestamp: '2025-01-15T08:00:00Z', status: 'success' },
      { timestamp: '2025-01-14T08:00:00Z', status: 'error', output: 'API timeout' }
    ]
  },
  {
    id: '2',
    name: 'Email Check',
    schedule: '*/30 * * * *',
    lastRun: '2025-01-16T14:30:00Z',
    nextRun: '2025-01-16T15:00:00Z',
    status: 'active',
    command: 'check-emails',
    history: [
      { timestamp: '2025-01-16T14:30:00Z', status: 'success' },
      { timestamp: '2025-01-16T14:00:00Z', status: 'success' }
    ]
  },
  {
    id: '3',
    name: 'Weekly Report',
    schedule: '0 9 * * 1',
    nextRun: '2025-01-20T09:00:00Z',
    status: 'paused',
    command: 'generate-weekly-report'
  },
  {
    id: '4',
    name: 'Memory Cleanup',
    schedule: '0 2 * * 0',
    lastRun: '2025-01-12T02:00:00Z',
    nextRun: '2025-01-19T02:00:00Z',
    status: 'active',
    command: 'cleanup-old-memories'
  },
  {
    id: '5',
    name: 'System Health Check',
    schedule: '0 */6 * * *',
    lastRun: '2025-01-16T12:00:00Z',
    nextRun: '2025-01-16T18:00:00Z',
    status: 'error',
    command: 'health-check',
    history: [
      { timestamp: '2025-01-16T12:00:00Z', status: 'error', output: 'Disk space warning' },
      { timestamp: '2025-01-16T06:00:00Z', status: 'success' }
    ]
  }
];

export default function CalendarPage() {
  const [jobs, setJobs] = useState<CronJob[]>(initialJobs);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const toggleJobStatus = (jobId: string) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: job.status === 'active' ? 'paused' : 'active'
        };
      }
      return job;
    }));
  };

  const runJobNow = (jobId: string) => {
    console.log(`Running job ${jobId}`);
  };

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalJobs = jobs.length;

  return (
    <div className="p-8 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Scheduled Jobs</h1>
          <p className="text-linear-textMuted">
            {activeJobs} of {totalJobs} jobs active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === 'list' 
                ? 'bg-linear-primary text-white' 
                : 'text-linear-textMuted hover:text-linear-text hover:bg-linear-surfaceHover'
            )}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === 'calendar' 
                ? 'bg-linear-primary text-white' 
                : 'text-linear-textMuted hover:text-linear-text hover:bg-linear-surfaceHover'
            )}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-linear-border bg-linear-bg">
                <th className="text-left px-6 py-4 text-sm font-medium text-linear-textMuted">Job Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-linear-textMuted">Schedule</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-linear-textMuted">Last Run</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-linear-textMuted">Next Run</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-linear-textMuted">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-linear-textMuted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr 
                  key={job.id} 
                  className="border-b border-linear-border hover:bg-linear-surfaceHover transition-colors cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-linear-text">{job.name}</p>
                      <p className="text-xs text-linear-textMuted font-mono">{job.command}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-linear-textMuted bg-linear-bg px-2 py-1 rounded">
                      {job.schedule}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-linear-textMuted">
                    {job.lastRun ? formatRelativeTime(job.lastRun) : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-linear-textMuted">
                    {job.nextRun ? formatRelativeTime(job.nextRun) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleJobStatus(job.id)}
                        className="p-2 hover:bg-linear-bg rounded-lg text-linear-textMuted hover:text-linear-text"
                        title={job.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => runJobNow(job.id)}
                        className="p-2 hover:bg-linear-bg rounded-lg text-linear-textMuted hover:text-linear-text"
                        title="Run now"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <CalendarView jobs={jobs} />
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedJob(null)}>
          <div className="bg-linear-surface rounded-xl p-6 w-[600px] max-h-[80vh] overflow-auto border border-linear-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-linear-text">{selectedJob.name}</h3>
                <p className="text-sm text-linear-textMuted font-mono mt-1">{selectedJob.command}</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-linear-bg rounded-lg p-4">
                <p className="text-xs text-linear-textMuted mb-1">Schedule</p>
                <code className="text-sm text-linear-text">{selectedJob.schedule}</code>
              </div>
              <div className="bg-linear-bg rounded-lg p-4">
                <p className="text-xs text-linear-textMuted mb-1">Last Run</p>
                <p className="text-sm text-linear-text">{selectedJob.lastRun ? formatDate(selectedJob.lastRun) : 'Never'}</p>
              </div>
              <div className="bg-linear-bg rounded-lg p-4">
                <p className="text-xs text-linear-textMuted mb-1">Next Run</p>
                <p className="text-sm text-linear-text">{selectedJob.nextRun ? formatDate(selectedJob.nextRun) : 'N/A'}</p>
              </div>
            </div>

            {selectedJob.history && selectedJob.history.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-linear-text mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Execution History
                </h4>
                <div className="space-y-2">
                  {selectedJob.history.map((record, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-linear-bg rounded-lg">
                      {record.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-linear-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-linear-danger" />
                      )}
                      <span className="text-sm text-linear-text">{formatDate(record.timestamp)}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        record.status === 'success' ? 'bg-linear-success/20 text-linear-success' : 'bg-linear-danger/20 text-linear-danger'
                      )}>
                        {record.status}
                      </span>
                      {record.output && (
                        <span className="text-xs text-linear-textMuted">{record.output}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 text-sm text-linear-textMuted hover:text-linear-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    active: 'bg-linear-success/20 text-linear-success',
    paused: 'bg-linear-warning/20 text-linear-warning',
    error: 'bg-linear-danger/20 text-linear-danger',
  };

  return (
    <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", classes[status as keyof typeof classes])}>
      {status}
    </span>
  );
}

function CalendarView({ jobs }: { jobs: CronJob[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getJobsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return jobs.filter(job => {
      if (job.nextRun) {
        const nextRun = new Date(job.nextRun);
        const nextRunStr = `${nextRun.getFullYear()}-${String(nextRun.getMonth() + 1).padStart(2, '0')}-${String(nextRun.getDate()).padStart(2, '0')}`;
        return nextRunStr === dateStr;
      }
      return false;
    });
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-linear-text">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-linear-surfaceHover rounded-lg">
            <ChevronLeft className="w-5 h-5 text-linear-text" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-linear-surfaceHover rounded-lg">
            <ChevronRight className="w-5 h-5 text-linear-text" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium text-linear-textMuted">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayJobs = getJobsForDay(day);
          const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
          
          return (
            <div 
              key={day} 
              className={cn(
                "aspect-square p-2 border border-linear-border rounded-lg flex flex-col gap-1",
                isToday && "bg-linear-primary/10 border-linear-primary"
              )}
            >
              <span className={cn(
                "text-sm",
                isToday ? "font-bold text-linear-primary" : "text-linear-text"
              )}>
                {day}
              </span>
              {dayJobs.map(job => (
                <div 
                  key={job.id} 
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded truncate",
                    job.status === 'active' ? 'bg-linear-success/20 text-linear-success' :
                    job.status === 'error' ? 'bg-linear-danger/20 text-linear-danger' :
                    'bg-linear-warning/20 text-linear-warning'
                  )}
                >
                  {job.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}