import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookAuth, checkRateLimit } from '@/lib/webhook';
import { taskDb, webhookLogDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhook/receive
 * Receives webhooks from Lisa (clawdbot)
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = checkRateLimit(clientIp, 60, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          resetTime: rateLimit.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
          }
        }
      );
    }

    const authHeader = request.headers.get('authorization');
    
    if (!verifyWebhookAuth(authHeader)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body.taskId || typeof body.taskId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      );
    }

    const task = await taskDb.getById(body.taskId);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    if (body.status) {
      const validStatuses = ['backlog', 'in-progress', 'review', 'done'];
      
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      await taskDb.update(body.taskId, { status: body.status });
    }

    await taskDb.markWebhookDelivered(body.taskId);
    await webhookLogDb.log(body.taskId, 'success', 'Received confirmation from Lisa');

    return NextResponse.json({
      success: true,
      message: 'Webhook received and processed',
      taskId: body.taskId,
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const isAuthenticated = verifyWebhookAuth(authHeader);

  return NextResponse.json({
    status: 'ok',
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString(),
  });
}
