import { NextRequest, NextResponse } from 'next/server';
import { taskDb, webhookLogDb } from '@/lib/db';
import { sendWebhook, buildWebhookPayload } from '@/lib/webhook';

/**
 * POST /api/poll
 * Polling endpoint for tasks that failed webhook delivery
 * 
 * This should be called by a cron job every 5 minutes.
 * It finds tasks that:
 * 1. Are still pending
 * 2. Were created more than 2 minutes ago
 * 3. Have at least 1 failed webhook attempt
 * 4. Have not been successfully delivered
 * 
 * Example cron configuration:
 * */5 * * * * curl -X POST http://localhost:3000/api/poll -H "Authorization: Bearer $CRON_SECRET"
 */

const CRON_SECRET = process.env.CRON_SECRET || process.env.WEBHOOK_SECRET || 'default-secret';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
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

    // Find tasks needing polling (older than 2 minutes, pending, with failed webhooks)
    const tasksNeedingPolling = taskDb.getTasksNeedingPolling(2);
    results.checked = tasksNeedingPolling.length;

    // Process each task
    for (const task of tasksNeedingPolling) {
      results.processed++;

      try {
        // Build payload and send webhook
        const payload = buildWebhookPayload(task);
        const webhookResult = await sendWebhook(payload);

        if (webhookResult.success) {
          // Mark as delivered
          taskDb.markWebhookDelivered(task.id);
          webhookLogDb.log(task.id, 'success', 'Delivered via polling');
          results.succeeded++;
          console.log(`[Polling] Webhook delivered for task ${task.id}`);
        } else {
          // Increment attempt counter
          taskDb.incrementWebhookAttempt(task.id, webhookResult.error);
          webhookLogDb.log(task.id, 'failed', `Polling attempt failed: ${webhookResult.error}`);
          results.failed++;
          results.errors.push(`Task ${task.id}: ${webhookResult.error}`);
          console.error(`[Polling] Webhook failed for task ${task.id}: ${webhookResult.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        taskDb.incrementWebhookAttempt(task.id, errorMsg);
        webhookLogDb.log(task.id, 'failed', `Polling exception: ${errorMsg}`);
        results.failed++;
        results.errors.push(`Task ${task.id}: ${errorMsg}`);
        console.error(`[Polling] Exception for task ${task.id}:`, error);
      }

      // Small delay between requests to avoid overwhelming the receiver
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

/**
 * GET /api/poll
 * Health check and preview of tasks that would be processed
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional for GET)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${CRON_SECRET}`;
    const isAuthenticated = authHeader === expectedAuth;

    // Get tasks that would be processed
    const tasksNeedingPolling = taskDb.getTasksNeedingPolling(2);

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
