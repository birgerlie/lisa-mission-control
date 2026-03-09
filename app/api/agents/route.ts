import { NextRequest, NextResponse } from 'next/server';
import { agentSessionDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/agents - List all agent sessions
export async function GET() {
  try {
    const sessions = await agentSessionDb.getAll();

    const agents = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      task: s.task,
      runtime: s.runtime,
      startTime: s.start_time,
      progress: s.progress,
      parentSession: s.parent_session,
      logs: s.logs,
    }));

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.task) {
      return NextResponse.json(
        { success: false, error: 'name and task are required' },
        { status: 400 }
      );
    }

    const session = await agentSessionDb.create({
      name: body.name.trim(),
      task: body.task.trim(),
      status: body.status || 'idle',
      parent_session: body.parentSession,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
