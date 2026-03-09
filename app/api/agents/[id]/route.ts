import { NextRequest, NextResponse } from 'next/server';
import { agentSessionDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/agents/[id] - Update an agent session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await agentSessionDb.update(id, {
      status: body.status,
      task: body.task,
      runtime: body.runtime,
      progress: body.progress,
      logs: body.logs,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Agent session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        task: updated.task,
        runtime: updated.runtime,
        startTime: updated.start_time,
        progress: updated.progress,
        parentSession: updated.parent_session,
        logs: updated.logs,
      },
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete an agent session
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await agentSessionDb.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
