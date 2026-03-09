import { NextRequest, NextResponse } from 'next/server';
import { spawnCodingTask, spawnResearchTask, killClaudeSession, getActiveSessions } from '@/lib/claudeAgent';

export const dynamic = 'force-dynamic';

// POST /api/agents/spawn - Spawn a new Claude Code agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.task) {
      return NextResponse.json(
        { success: false, error: 'name and task are required' },
        { status: 400 }
      );
    }

    let session;
    
    if (body.type === 'research') {
      session = await spawnResearchTask(body.name, body.task);
    } else {
      session = await spawnCodingTask(
        body.name, 
        body.task, 
        body.workingDirectory
      );
    }

    return NextResponse.json(
      { success: true, session },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error spawning agent:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to spawn agent' },
      { status: 500 }
    );
  }
}

// GET /api/agents/spawn - Get spawn capabilities
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Use POST to spawn new Claude Code agents',
    types: ['coding', 'research'],
    example: {
      name: 'My Coding Agent',
      task: 'Refactor the auth system to use JWT tokens',
      type: 'coding',
      workingDirectory: '/Users/birgerlie/clawd/my-project'
    }
  });
}
