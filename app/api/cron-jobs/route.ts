import { NextRequest, NextResponse } from 'next/server';
import { cronJobDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/cron-jobs - List all cron jobs with history
export async function GET() {
  try {
    const jobs = await cronJobDb.getAll();

    // Fetch history for each job
    const jobsWithHistory = await Promise.all(
      jobs.map(async (job) => {
        const history = await cronJobDb.getHistory(job.id);
        return {
          id: job.id,
          name: job.name,
          schedule: job.schedule,
          command: job.command,
          status: job.status,
          lastRun: job.last_run,
          nextRun: job.next_run,
          history,
        };
      })
    );

    return NextResponse.json({ success: true, jobs: jobsWithHistory });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}

// POST /api/cron-jobs - Create a new cron job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.schedule || !body.command) {
      return NextResponse.json(
        { success: false, error: 'name, schedule, and command are required' },
        { status: 400 }
      );
    }

    const job = await cronJobDb.create({
      name: body.name.trim(),
      schedule: body.schedule.trim(),
      command: body.command.trim(),
      status: body.status || 'active',
      next_run: body.nextRun,
    });

    return NextResponse.json(
      {
        success: true,
        job: {
          id: job.id,
          name: job.name,
          schedule: job.schedule,
          command: job.command,
          status: job.status,
          lastRun: job.last_run,
          nextRun: job.next_run,
          history: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create cron job' },
      { status: 500 }
    );
  }
}
