import { Task, TaskStatus } from '../types';
import { statusOrder } from '../typeGuards';

export interface TaskStats {
  backlog: number;
  inProgress: number;
  review: number;
  done: number;
  total: number;
}

export function calculateTaskStats(tasks: Task[]): TaskStats {
  const stats = {
    backlog: countTasksByStatus(tasks, 'backlog'),
    inProgress: countTasksByStatus(tasks, 'in-progress'),
    review: countTasksByStatus(tasks, 'review'),
    done: countTasksByStatus(tasks, 'done'),
  };

  return {
    ...stats,
    total: tasks.length,
  };
}

function countTasksByStatus(tasks: Task[], status: TaskStatus): number {
  return tasks.filter(task => task.status === status).length;
}

export function filterTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter(task => task.status === status);
}

export function getActiveTasksCount(tasks: Task[]): number {
  return tasks.filter(task => task.status !== 'done').length;
}

export function updateTaskStatus(
  tasks: Task[], 
  taskId: string, 
  newStatus: TaskStatus
): Task[] {
  return tasks.map(task => 
    task.id === taskId 
      ? { ...task, status: newStatus }
      : task
  );
}

export function createTask(
  title: string,
  assignee: string,
  priority: Task['priority'] = 'medium',
  options: Partial<Omit<Task, 'id' | 'title' | 'assignee' | 'priority' | 'status' | 'createdAt'>> = {}
): Task {
  return {
    id: generateTaskId(),
    title: title.trim(),
    status: 'backlog',
    assignee: assignee.trim(),
    priority,
    createdAt: getCurrentDateString(),
    description: options.description ?? null,
    dueDate: options.dueDate,
    completedAt: options.completedAt,
    tags: options.tags,
    webhookAttempts: options.webhookAttempts ?? 0,
    lastWebhookError: options.lastWebhookError ?? null,
    webhookDeliveredAt: options.webhookDeliveredAt ?? null,
  };
}

function generateTaskId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function sortTasksByStatus(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}