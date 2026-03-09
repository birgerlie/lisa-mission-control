import { NextRequest, NextResponse } from 'next/server';
import { taskDb, UpdateTaskInput } from '@/lib/db';

// PATCH /api/tasks/:id - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if task exists
    const existingTask = taskDb.getById(id);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Build update input
    const updates: UpdateTaskInput = {};

    if (body.status !== undefined) {
      const validStatuses = ['pending', 'in-progress', 'review', 'done'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || '';
    }

    if (body.priority !== undefined) {
      const validPriorities = ['high', 'medium', 'low'];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { success: false, error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
      updates.priority = body.priority;
    }

    if (body.assignee !== undefined) {
      updates.assignee = body.assignee.trim();
    }

    // Apply updates
    const updatedTask = taskDb.update(id, updates);

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/:id - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if task exists
    const existingTask = taskDb.getById(id);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete task
    const deleted = taskDb.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// GET /api/tasks/:id - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const task = taskDb.getById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}
