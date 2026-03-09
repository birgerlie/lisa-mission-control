import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// Database types
export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'done';
export type Priority = 'high' | 'medium' | 'low';

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
  description?: string;
  priority?: Priority;
  assignee?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  title?: string;
  description?: string;
  priority?: Priority;
  assignee?: string;
}

// Initialize database
const dbPath = process.env.DATABASE_PATH || './data/mission-control.db';
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
export function initializeDatabase(): void {
  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignee TEXT NOT NULL DEFAULT 'Lisa',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      webhookAttempts INTEGER NOT NULL DEFAULT 0,
      lastWebhookError TEXT,
      webhookDeliveredAt TEXT
    )
  `);

  // Webhook delivery log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskId TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(createdAt);
    CREATE INDEX IF NOT EXISTS idx_tasks_webhook_attempts ON tasks(webhookAttempts);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_task_id ON webhook_logs(taskId);
  `);
}

// Initialize on module load
initializeDatabase();

// Task operations
export const taskDb = {
  // Create a new task
  create(input: CreateTaskInput): Task {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, assignee, createdAt, updatedAt, webhookAttempts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(
      id,
      input.title,
      input.description || null,
      'pending',
      input.priority || 'medium',
      input.assignee || 'Lisa',
      now,
      now
    );
    
    return this.getById(id)!;
  },

  // Get task by ID
  getById(id: string): Task | null {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as Task | undefined;
    return row || null;
  },

  // Get all tasks with optional filtering
  getAll(filters?: { status?: TaskStatus; assignee?: string }): Task[] {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.assignee) {
      query += ' AND assignee = ?';
      params.push(filters.assignee);
    }

    query += ' ORDER BY createdAt DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as Task[];
  },

  // Update task
  update(id: string, input: UpdateTaskInput): Task | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description || null);
    }
    if (input.priority !== undefined) {
      updates.push('priority = ?');
      values.push(input.priority);
    }
    if (input.assignee !== undefined) {
      updates.push('assignee = ?');
      values.push(input.assignee);
    }

    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.getById(id);
  },

  // Delete task
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Get tasks that need polling (webhook failed, pending for >2 minutes)
  getTasksNeedingPolling(minutesOld: number = 2): Task[] {
    const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000).toISOString();
    
    const stmt = db.prepare(`
      SELECT * FROM tasks 
      WHERE status = 'pending' 
        AND createdAt < ? 
        AND webhookAttempts >= 1
        AND webhookDeliveredAt IS NULL
      ORDER BY createdAt ASC
    `);
    
    return stmt.all(cutoffTime) as Task[];
  },

  // Increment webhook attempt counter
  incrementWebhookAttempt(id: string, error?: string): void {
    const stmt = db.prepare(`
      UPDATE tasks 
      SET webhookAttempts = webhookAttempts + 1,
          lastWebhookError = ?
      WHERE id = ?
    `);
    
    stmt.run(error || null, id);
  },

  // Mark webhook as delivered
  markWebhookDelivered(id: string): void {
    const stmt = db.prepare(`
      UPDATE tasks 
      SET webhookDeliveredAt = ?,
          lastWebhookError = NULL
      WHERE id = ?
    `);
    
    stmt.run(new Date().toISOString(), id);
  },
};

// Webhook log operations
export const webhookLogDb = {
  // Log a webhook attempt
  log(taskId: string, status: 'success' | 'failed', error?: string): void {
    const stmt = db.prepare(`
      INSERT INTO webhook_logs (taskId, status, error, createdAt)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(taskId, status, error || null, new Date().toISOString());
  },

  // Get logs for a task
  getLogsForTask(taskId: string): Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }> {
    const stmt = db.prepare(`
      SELECT * FROM webhook_logs 
      WHERE taskId = ? 
      ORDER BY createdAt DESC
    `);
    
    return stmt.all(taskId) as Array<{
      id: number;
      taskId: string;
      status: string;
      error: string | null;
      createdAt: string;
    }>;
  },

  // Get recent logs
  getRecentLogs(limit: number = 100): Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }> {
    const stmt = db.prepare(`
      SELECT * FROM webhook_logs 
      ORDER BY createdAt DESC
      LIMIT ?
    `);
    
    return stmt.all(limit) as Array<{
      id: number;
      taskId: string;
      status: string;
      error: string | null;
      createdAt: string;
    }>;
  },
};

// Health check
export function checkDatabaseHealth(): { healthy: boolean; message: string } {
  try {
    db.prepare('SELECT 1').get();
    return { healthy: true, message: 'Database connection is healthy' };
  } catch (error) {
    return { 
      healthy: false, 
      message: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

export { db };
export default db;
