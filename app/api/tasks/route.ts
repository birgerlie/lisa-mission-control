import { NextRequest, NextResponse } from 'next/server';
import { taskDb, CreateTaskInput } from '@/lib/db';
import { sendWebhook, buildWebhookPayload, webhookLogDb } from '@/lib/webhook';
import { TaskStatus } from '@/lib/types';

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const assigneeParam = searchParams.get('assignee');

    const filters: { status?: TaskStatus; assignee?: string } = {};
    
    if (statusParam) {
      const validStatuses: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];
      if (validStatuses.includes(statusParam as TaskStatus)) {
        filters.status = statusParam as TaskStatus;
      }
    }
    
    if (assigneeParam) {
      filters.assignee = assigneeParam;
    }

    const hasFilters = filters.status !== undefined || filters.assignee !== undefined;
    const tasks = hasFilters ? await taskDb.getAll(filters) : await taskDb.getAll();

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

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const input: CreateTaskInput = {
      title: body.title.trim(),
      description: body.description?.trim(),
      priority: body.priority || 'medium',
      assignee: body.assignee || 'Lisa',
    };

    const task = await taskDb.create(input);

    // Send webhook asynchronously
    setImmediate(async () => {
      try {
        const payload = buildWebhookPayload(task);
        const result = await sendWebhook(payload);

        if (result.success) {
          await taskDb.markWebhookDelivered(task.id);
          await webhookLogDb.log(task.id, 'success');
          console.log(`Webhook delivered for task ${task.id}`);
        } else {
          await taskDb.incrementWebhookAttempt(task.id, result.error);
          await webhookLogDb.log(task.id, 'failed', result.error);
          console.error(`Webhook failed for task ${task.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await taskDb.incrementWebhookAttempt(task.id, errorMsg);
        await webhookLogDb.log(task.id, 'failed', errorMsg);
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
