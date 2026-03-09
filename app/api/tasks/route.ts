import { NextRequest, NextResponse } from 'next/server';
import { taskDb, CreateTaskInput, UpdateTaskInput } from '@/lib/db';
import { sendWebhook, buildWebhookPayload, webhookLogDb } from '@/lib/webhook';

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CreateTaskInput['status'] | null;
    const assignee = searchParams.get('assignee');

    const filters: { status?: typeof status; assignee?: string } = {};
    if (status) filters.status = status;
    if (assignee) filters.assignee = assignee;

    const tasks = taskDb.getAll(Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create task input
    const input: CreateTaskInput = {
      title: body.title.trim(),
      description: body.description?.trim(),
      priority: body.priority || 'medium',
      assignee: body.assignee || 'Lisa',
    };

    // Create task in database
    const task = taskDb.create(input);

    // Send webhook asynchronously (don't block response)
    // The webhook failure will be handled by polling
    setImmediate(async () => {
      try {
        const payload = buildWebhookPayload(task);
        const result = await sendWebhook(payload);

        if (result.success) {
          taskDb.markWebhookDelivered(task.id);
          webhookLogDb.log(task.id, 'success');
          console.log(`Webhook delivered for task ${task.id}`);
        } else {
          taskDb.incrementWebhookAttempt(task.id, result.error);
          webhookLogDb.log(task.id, 'failed', result.error);
          console.error(`Webhook failed for task ${task.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        taskDb.incrementWebhookAttempt(task.id, errorMsg);
        webhookLogDb.log(task.id, 'failed', errorMsg);
        console.error(`Webhook exception for task ${task.id}:`, error);
      }
    });

    return NextResponse.json(
      { success: true, task },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
