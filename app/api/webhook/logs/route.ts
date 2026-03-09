import { NextRequest, NextResponse } from 'next/server';
import { webhookLogDb } from '@/lib/db';

/**
 * GET /api/webhook/logs
 * Get recent webhook delivery logs
 * 
 * Query params:
 *   - taskId: Filter by specific task
 *   - limit: Number of logs to return (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '50', 10), 200);

    let logs;
    if (taskId) {
      logs = await webhookLogDb.getLogsForTask(taskId);
    } else {
      logs = await webhookLogDb.getRecentLogs(limit);
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}
