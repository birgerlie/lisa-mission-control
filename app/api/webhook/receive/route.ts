import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookAuth, checkRateLimit } from '@/lib/webhook';
import { taskDb, webhookLogDb } from '@/lib/db';

/**
 * POST /api/webhook/receive
 * Receives webhooks from Lisa (clawdbot)
 * 
 * Expected payload:
 * {
 *   taskId: string;
 *   title: string;
 *   description?: string;
 *   priority: string;
 *   status?: string;
 * }
 * 
 * Headers:
 *   Authorization: Bearer <WEBHOOK_SECRET>
 *   Content-Type: application/json
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - limit by IP address
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = checkRateLimit(clientIp, 60, 60000); // 60 requests per minute
    
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

    // Verify authorization
    const authHeader = request.headers.get('authorization');
    
    if (!verifyWebhookAuth(authHeader)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.taskId || typeof body.taskId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      );
    }

    // Find the task
    const task = taskDb.getById(body.taskId);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status if provided
    if (body.status) {
      const validStatuses = ['pending', 'in-progress', 'review', 'done'];
      
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      taskDb.update(body.taskId, { status: body.status });
    }

    // Mark webhook as delivered
    taskDb.markWebhookDelivered(body.taskId);
    webhookLogDb.log(body.taskId, 'success', 'Received confirmation from Lisa');

    // Return success
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

/**
 * GET /api/webhook/receive
 * Health check endpoint for webhook receiver
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const isAuthenticated = verifyWebhookAuth(authHeader);

  return NextResponse.json({
    status: 'ok',
    authenticated: isAuthenticated,
    timestamp: new Date().toISOString(),
  });
}
