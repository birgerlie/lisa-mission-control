import { NextRequest, NextResponse } from 'next/server';
import { killClaudeSession } from '@/lib/claudeAgent';
import { agentSessionDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/agents/[id] - Update or kill an agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Handle kill request
    if (body.status === 'completed' || body.status === 'killed') {
      const killed = await killClaudeSession(id);
      
      if (killed) {
        return NextResponse.json({
          success: true,
          message: 'Agent session terminated',
          taskId: id,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to kill agent session' },
          { status: 500 }
        );
      }
    }

    // Handle other updates
    const session = await agentSessionDb.update(id, {
      status: body.status,
      task: body.task,
      runtime: body.runtime,
      progress: body.progress,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: session.id,
        name: session.name,
        status: session.status,
        task: session.task,
        runtime: session.runtime,
        startTime: session.start_time,
        progress: session.progress,
        parentSession: session.parent_session,
        logs: session.logs,
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

// DELETE /api/agents/[id] - Delete an agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Kill if running
    await killClaudeSession(id);
    
    // Delete from database
    const deleted = await agentSessionDb.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agent deleted',
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

// GET /api/agents/[id] - Get single agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await agentSessionDb.getById(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: session.id,
        name: session.name,
        status: session.status,
        task: session.task,
        runtime: session.runtime,
        startTime: session.start_time,
        progress: session.progress,
        parentSession: session.parent_session,
        logs: session.logs,
      },
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
