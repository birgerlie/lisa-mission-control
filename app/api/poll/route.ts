import { NextRequest, NextResponse } from 'next/server';
import { taskDb, webhookLogDb } from '@/lib/db';
import { sendWebhook, buildWebhookPayload } from '@/lib/webhook';

/**
 * POST /api/poll
 * Polling endpoint for tasks that failed webhook delivery
 */

const CRON_SECRET = process.env.CRON_SECRET || process.env.WEBHOOK_SECRET || 'default-secret';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      checked: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    const tasksNeedingPolling = await taskDb.getTasksNeedingPolling(2);
    results.checked = tasksNeedingPolling.length;

    for (const task of tasksNeedingPolling) {
      results.processed++;

      try {
        const payload = buildWebhookPayload(task);
        const webhookResult = await sendWebhook(payload);

        if (webhookResult.success) {
          await taskDb.markWebhookDelivered(task.id);
          await webhookLogDb.log(task.id, 'success', 'Delivered via polling');
          results.succeeded++;
          console.log(`[Polling] Webhook delivered for task ${task.id}`);
        } else {
          await taskDb.incrementWebhookAttempt(task.id, webhookResult.error);
          await webhookLogDb.log(task.id, 'failed', `Polling attempt failed: ${webhookResult.error}`);
          results.failed++;
          results.errors.push(`Task ${task.id}: ${webhookResult.error}`);
          console.error(`[Polling] Webhook failed for task ${task.id}: ${webhookResult.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await taskDb.incrementWebhookAttempt(task.id, errorMsg);
        await webhookLogDb.log(task.id, 'failed', `Polling exception: ${errorMsg}`);
        results.failed++;
        results.errors.push(`Task ${task.id}: ${errorMsg}`);
        console.error(`[Polling] Exception for task ${task.id}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('Error in polling endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${CRON_SECRET}`;
    const isAuthenticated = authHeader === expectedAuth;

    const tasksNeedingPolling = await taskDb.getTasksNeedingPolling(2);

    return NextResponse.json({
      status: 'ok',
      authenticated: isAuthenticated,
      tasksPending: tasksNeedingPolling.length,
      tasks: isAuthenticated ? tasksNeedingPolling.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        webhookAttempts: t.webhookAttempts,
        lastWebhookError: t.lastWebhookError,
        createdAt: t.createdAt,
      })) : undefined,
      nextRun: 'Run POST /api/poll to process tasks',
    });
  } catch (error) {
    console.error('Error in polling health check:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
