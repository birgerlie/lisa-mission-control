import { NextRequest, NextResponse } from 'next/server';
import { cronJobDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/cron-jobs/[id] - Update a cron job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await cronJobDb.update(id, {
      name: body.name,
      schedule: body.schedule,
      command: body.command,
      status: body.status,
      last_run: body.lastRun,
      next_run: body.nextRun,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Cron job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updated.id,
        name: updated.name,
        schedule: updated.schedule,
        command: updated.command,
        status: updated.status,
        lastRun: updated.last_run,
        nextRun: updated.next_run,
      },
    });
  } catch (error) {
    console.error('Error updating cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cron job' },
      { status: 500 }
    );
  }
}

// DELETE /api/cron-jobs/[id] - Delete a cron job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await cronJobDb.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete cron job' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cron job' },
      { status: 500 }
    );
  }
}
