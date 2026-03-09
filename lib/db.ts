import { Pool, PoolClient } from 'pg';
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

// PostgreSQL connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });
  
  return pool;
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'backlog',
        priority TEXT NOT NULL DEFAULT 'medium',
        assignee TEXT NOT NULL DEFAULT 'Lisa',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        webhook_attempts INTEGER NOT NULL DEFAULT 0,
        last_webhook_error TEXT,
        webhook_delivered_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Webhook delivery log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_webhook_attempts ON tasks(webhook_attempts);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_task_id ON webhook_logs(task_id);
    `);
  } finally {
    client.release();
  }
}

// Task operations
export const taskDb = {
  // Create a new task
  async create(input: CreateTaskInput): Promise<Task> {
    const client = await getPool().connect();
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const result = await client.query(
        `INSERT INTO tasks (id, title, description, status, priority, assignee, created_at, updated_at, webhook_attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
         RETURNING *`,
        [
          id,
          input.title,
          input.description || null,
          'backlog',
          input.priority || 'medium',
          input.assignee || 'Lisa',
          now,
          now
        ]
      );
      
      return mapRowToTask(result.rows[0]);
    } finally {
      client.release();
    }
  },

  // Get task by ID
  async getById(id: string): Promise<Task | null> {
    const client = await getPool().connect();
    try {
      const result = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
      return result.rows[0] ? mapRowToTask(result.rows[0]) : null;
    } finally {
      client.release();
    }
  },

  // Get all tasks with optional filtering
  async getAll(filters?: { status?: TaskStatus; assignee?: string }): Promise<Task[]> {
    const client = await getPool().connect();
    try {
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.assignee) {
        query += ` AND assignee = $${paramIndex}`;
        params.push(filters.assignee);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, params);
      return result.rows.map(mapRowToTask);
    } finally {
      client.release();
    }
  },

  // Update task
  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const client = await getPool().connect();
    try {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updates: string[] = [];
      const values: (string | number | null)[] = [];
      let paramIndex = 1;

      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(input.status);
        paramIndex++;
      }
      if (input.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        values.push(input.title);
        paramIndex++;
      }
      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(input.description || null);
        paramIndex++;
      }
      if (input.priority !== undefined) {
        updates.push(`priority = $${paramIndex}`);
        values.push(input.priority);
        paramIndex++;
      }
      if (input.assignee !== undefined) {
        updates.push(`assignee = $${paramIndex}`);
        values.push(input.assignee);
        paramIndex++;
      }

      updates.push(`updated_at = $${paramIndex}`);
      values.push(new Date().toISOString());
      paramIndex++;

      values.push(id);

      const result = await client.query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      return result.rows[0] ? mapRowToTask(result.rows[0]) : null;
    } finally {
      client.release();
    }
  },

  // Delete task
  async delete(id: string): Promise<boolean> {
    const client = await getPool().connect();
    try {
      const result = await client.query('DELETE FROM tasks WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  },

  // Get tasks that need polling
  async getTasksNeedingPolling(minutesOld: number = 2): Promise<Task[]> {
    const client = await getPool().connect();
    try {
      const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000).toISOString();
      
      const result = await client.query(
        `SELECT * FROM tasks 
         WHERE status = 'backlog' 
           AND created_at < $1 
           AND webhook_attempts >= 1
           AND webhook_delivered_at IS NULL
         ORDER BY created_at ASC`,
        [cutoffTime]
      );
      
      return result.rows.map(mapRowToTask);
    } finally {
      client.release();
    }
  },

  // Increment webhook attempt counter
  async incrementWebhookAttempt(id: string, error?: string): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(
        `UPDATE tasks 
         SET webhook_attempts = webhook_attempts + 1,
             last_webhook_error = $1
         WHERE id = $2`,
        [error || null, id]
      );
    } finally {
      client.release();
    }
  },

  // Mark webhook as delivered
  async markWebhookDelivered(id: string): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(
        `UPDATE tasks 
         SET webhook_delivered_at = NOW(),
             last_webhook_error = NULL
         WHERE id = $1`,
        [id]
      );
    } finally {
      client.release();
    }
  },
};

// Webhook log operations
export const webhookLogDb = {
  // Log a webhook attempt
  async log(taskId: string, status: 'success' | 'failed', error?: string): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(
        `INSERT INTO webhook_logs (task_id, status, error, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [taskId, status, error || null]
      );
    } finally {
      client.release();
    }
  },

  // Get logs for a task
  async getLogsForTask(taskId: string): Promise<Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    const client = await getPool().connect();
    try {
      const result = await client.query(
        `SELECT id, task_id as "taskId", status, error, created_at as "createdAt"
         FROM webhook_logs 
         WHERE task_id = $1 
         ORDER BY created_at DESC`,
        [taskId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  // Get recent logs
  async getRecentLogs(limit: number = 100): Promise<Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    const client = await getPool().connect();
    try {
      const result = await client.query(
        `SELECT id, task_id as "taskId", status, error, created_at as "createdAt"
         FROM webhook_logs 
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },
};

// Health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const client = await getPool().connect();
    try {
      await client.query('SELECT 1');
      return { healthy: true, message: 'Database connection is healthy' };
    } finally {
      client.release();
    }
  } catch (error) {
    return { 
      healthy: false, 
      message: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

// Helper function to map PostgreSQL row to Task interface
function mapRowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    webhookAttempts: row.webhook_attempts,
    lastWebhookError: row.last_webhook_error,
    webhookDeliveredAt: row.webhook_delivered_at,
  };
}

// Initialize on module load
if (typeof window === 'undefined') {
  initializeDatabase().catch(console.error);
}

export { getPool as db };
export default getPool;
