import { v4 as uuidv4 } from 'uuid';
import { TaskStatus, Priority } from './types';

// Re-export types for backward compatibility
export type { TaskStatus, Priority } from './types';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  webhookAttempts: number;
  lastWebhookError: string | null;
  webhookDeliveredAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  assignee?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  title?: string;
  description?: string;
  priority?: Priority;
  assignee?: string;
}

// In-memory storage for Vercel compatibility
const tasks: Map<string, Task> = new Map();
const webhookLogs: Map<string, Array<{
  id: number;
  taskId: string;
  status: string;
  error: string | null;
  createdAt: string;
}>> = new Map();

let logIdCounter = 1;

// Initialize with some sample data
function initializeSampleData() {
  if (tasks.size === 0) {
    const sampleTasks: Task[] = [
      {
        id: uuidv4(),
        title: 'Review Moltera AI pitch deck',
        description: 'Check the latest version of the pitch deck',
        status: 'backlog',
        priority: 'high',
        assignee: 'Lisa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        webhookAttempts: 0,
        lastWebhookError: null,
        webhookDeliveredAt: null,
      },
      {
        id: uuidv4(),
        title: 'Research SiliconDB competitors',
        description: 'Find 3-5 main competitors in the RAG space',
        status: 'in-progress',
        priority: 'high',
        assignee: 'Lisa',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        webhookAttempts: 1,
        lastWebhookError: null,
        webhookDeliveredAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        title: 'Update HEARTBEAT.md with new tasks',
        description: 'Add the new monitoring tasks to heartbeat',
        status: 'done',
        priority: 'medium',
        assignee: 'Lisa',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString(),
        webhookAttempts: 1,
        lastWebhookError: null,
        webhookDeliveredAt: new Date().toISOString(),
      },
    ];
    
    sampleTasks.forEach(task => tasks.set(task.id, task));
  }
}

// Initialize on module load
initializeSampleData();

// Task operations
export const taskDb = {
  // Create a new task
  async create(input: CreateTaskInput): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const task: Task = {
      id,
      title: input.title,
      description: input.description || null,
      status: input.status || 'backlog',
      priority: input.priority || 'medium',
      assignee: input.assignee || 'Lisa',
      createdAt: now,
      updatedAt: now,
      webhookAttempts: 0,
      lastWebhookError: null,
      webhookDeliveredAt: null,
    };
    
    tasks.set(id, task);
    return task;
  },

  // Get task by ID
  async getById(id: string): Promise<Task | null> {
    return tasks.get(id) || null;
  },

  // Get all tasks with optional filtering
  async getAll(filters?: { status?: TaskStatus; assignee?: string }): Promise<Task[]> {
    let result = Array.from(tasks.values());
    
    if (filters?.status) {
      result = result.filter(t => t.status === filters.status);
    }
    
    if (filters?.assignee) {
      result = result.filter(t => t.assignee === filters.assignee);
    }
    
    // Sort by createdAt descending
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Update task
  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const existing = tasks.get(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...input,
      id: existing.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };
    
    tasks.set(id, updated);
    return updated;
  },

  // Delete task
  async delete(id: string): Promise<boolean> {
    return tasks.delete(id);
  },

  // Get tasks that need polling
  async getTasksNeedingPolling(minutesOld: number = 2): Promise<Task[]> {
    const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000).toISOString();
    
    return Array.from(tasks.values()).filter(task => 
      task.status === 'backlog' &&
      task.createdAt < cutoffTime &&
      task.webhookAttempts >= 1 &&
      !task.webhookDeliveredAt
    );
  },

  // Increment webhook attempt counter
  async incrementWebhookAttempt(id: string, error?: string): Promise<void> {
    const task = tasks.get(id);
    if (task) {
      task.webhookAttempts++;
      task.lastWebhookError = error || null;
      task.updatedAt = new Date().toISOString();
    }
  },

  // Mark webhook as delivered
  async markWebhookDelivered(id: string): Promise<void> {
    const task = tasks.get(id);
    if (task) {
      task.webhookDeliveredAt = new Date().toISOString();
      task.lastWebhookError = null;
      task.updatedAt = new Date().toISOString();
    }
  },
};

// Webhook log operations
export const webhookLogDb = {
  // Log a webhook attempt
  async log(taskId: string, status: 'success' | 'failed', error?: string): Promise<void> {
    const logs = webhookLogs.get(taskId) || [];
    logs.push({
      id: logIdCounter++,
      taskId,
      status,
      error: error || null,
      createdAt: new Date().toISOString(),
    });
    webhookLogs.set(taskId, logs);
  },

  // Get logs for a task
  async getLogsForTask(taskId: string): Promise<Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    return webhookLogs.get(taskId) || [];
  },

  // Get recent logs
  async getRecentLogs(limit: number = 100): Promise<Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    const allLogs = Array.from(webhookLogs.values()).flat();
    return allLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },
};

// Health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  return { 
    healthy: true, 
    message: 'In-memory database is operational' 
  };
}

// Initialize database (no-op for in-memory)
export async function initializeDatabase(): Promise<void> {
  initializeSampleData();
}

// Export a mock db object for compatibility
export const db = {
  query: async () => ({ rows: [] }),
};

export default db;
