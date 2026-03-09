import { NextResponse } from 'next/server';
import { webhookLogDb, taskDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [logs, tasks] = await Promise.all([
      webhookLogDb.getRecentLogs(20),
      taskDb.getAll(),
    ]);

    // Sort tasks by updatedAt desc, take recent 20
    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20);

    const activities = [
      ...recentTasks.map(t => ({
        id: `task-${t.id}`,
        type: 'task_updated',
        message: `Task "${t.title}" is ${t.status}`,
        timestamp: t.updatedAt,
        taskId: t.id,
      })),
      ...logs.map(l => ({
        id: `webhook-${l.id}`,
        type: l.status === 'success' ? 'webhook_sent' : 'webhook_failed',
        message: l.status === 'success' ? 'Webhook delivered' : `Webhook failed: ${l.error || 'Unknown error'}`,
        timestamp: l.createdAt,
        taskId: l.taskId,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 });
  }
}
