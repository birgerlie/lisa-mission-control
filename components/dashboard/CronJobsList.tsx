import Link from 'next/link';
import { CronJob } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/cards/Card';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { Clock, ArrowRight } from 'lucide-react';

interface CronJobsListProps {
  jobs: CronJob[];
}

/**
 * Displays a list of upcoming scheduled cron jobs.
 */
export function CronJobsList({ jobs }: CronJobsListProps) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader />
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <JobItems jobs={jobs} />
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#f2c94c]" />
        Upcoming Jobs
      </CardTitle>
      <Link 
        href="/calendar" 
        className="text-sm text-[#5e6ad2] hover:underline flex items-center gap-1"
      >
        Calendar <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-[#8a8f98] text-sm">No scheduled jobs</p>
  );
}

interface JobItemsProps {
  jobs: CronJob[];
}

function JobItems({ jobs }: JobItemsProps) {
  return (
    <div className="space-y-3">
      {jobs.map(renderJobItem)}
    </div>
  );
}

function renderJobItem(job: CronJob) {
  return (
    <div 
      key={job.id}
      className="flex items-center gap-3 p-3 bg-[#0f1115] rounded-lg"
    >
      <StatusBadge status={job.status} />
      <JobInfo job={job} />
    </div>
  );
}

interface JobInfoProps {
  job: CronJob;
}

function JobInfo({ job }: JobInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-[#f7f8f8]">{job.name}</p>
      <code className="text-xs text-[#8a8f98]">{job.schedule}</code>
    </div>
  );
}
