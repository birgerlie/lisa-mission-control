import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { TaskStatus, Priority, CronStatus, AgentStatus } from './types';

// Re-export types
export type { TaskStatus, Priority, CronStatus, AgentStatus } from './types';

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

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key must be set in environment variables');
  }
  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

// Cast to any to bypass TypeScript issues until tables are created
function getDb() {
  return getSupabase() as any;
}

// Task operations
export const taskDb = {
  async create(input: CreateTaskInput): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const insertData = {
      id,
      title: input.title,
      description: input.description || null,
      status: input.status || 'backlog',
      priority: input.priority || 'medium',
      assignee: input.assignee || 'Lisa',
      created_at: now,
      updated_at: now,
      webhook_attempts: 0,
      last_webhook_error: null,
      webhook_delivered_at: null,
    };
    
    const { data, error } = await getDb()
      .from('tasks')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    return mapRowToTask(data);
  },

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await getDb()
      .from('tasks')
      .select()
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return mapRowToTask(data);
  },

  async getAll(filters?: { status?: TaskStatus; assignee?: string }): Promise<Task[]> {
    let query = getDb().from('tasks').select();
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.assignee) {
      query = query.eq('assignee', filters.assignee);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapRowToTask);
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.status !== undefined) updates.status = input.status;
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.assignee !== undefined) updates.assignee = input.assignee;
    
    const { data, error } = await getDb()
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return null;
    return mapRowToTask(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getDb()
      .from('tasks')
      .delete()
      .eq('id', id);
    
    return !error;
  },

  async getTasksNeedingPolling(minutesOld: number = 2): Promise<Task[]> {
    const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000).toISOString();
    
    const { data, error } = await getDb()
      .from('tasks')
      .select()
      .eq('status', 'backlog')
      .lt('created_at', cutoffTime)
      .gte('webhook_attempts', 1)
      .is('webhook_delivered_at', null)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapRowToTask);
  },

  async incrementWebhookAttempt(id: string, errorMsg?: string): Promise<void> {
    const { error: dbError } = await getDb()
      .rpc('increment_webhook_attempt', { task_id: id, error_msg: errorMsg || null });
    
    if (dbError) {
      // Fallback if RPC doesn't exist
      const { data: task } = await getDb()
        .from('tasks')
        .select('webhook_attempts')
        .eq('id', id)
        .single();
      
      if (task) {
        await getDb()
          .from('tasks')
          .update({
            webhook_attempts: (task.webhook_attempts || 0) + 1,
            last_webhook_error: errorMsg || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      }
    }
  },

  async markWebhookDelivered(id: string): Promise<void> {
    const { error } = await getDb()
      .from('tasks')
      .update({
        webhook_delivered_at: new Date().toISOString(),
        last_webhook_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Webhook log operations
export const webhookLogDb = {
  async log(taskId: string, status: 'success' | 'failed', error?: string): Promise<void> {
    const logData = {
      task_id: taskId,
      status,
      error: error || null,
      created_at: new Date().toISOString(),
    };
    
    const { error: dbError } = await getDb()
      .from('webhook_logs')
      .insert(logData);
    
    if (dbError) console.error('Failed to log webhook:', dbError);
  },

  async getLogsForTask(taskId: string): Promise<Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    const { data, error } = await getDb()
      .from('webhook_logs')
      .select()
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map((log: any) => ({
      id: log.id,
      taskId: log.task_id,
      status: log.status,
      error: log.error,
      createdAt: log.created_at,
    }));
  },

  async getRecentLogs(limit: number = 100): Promise<Array<{
    id: number;
    taskId: string;
    status: string;
    error: string | null;
    createdAt: string;
  }>> {
    const { data, error } = await getDb()
      .from('webhook_logs')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return (data || []).map((log: any) => ({
      id: log.id,
      taskId: log.task_id,
      status: log.status,
      error: log.error,
      createdAt: log.created_at,
    }));
  },
};

// Cron job types
export interface CronJobRow {
  id: string;
  name: string;
  schedule: string;
  command: string;
  status: CronStatus;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCronJobInput {
  name: string;
  schedule: string;
  command: string;
  status?: CronStatus;
  next_run?: string;
}

export interface UpdateCronJobInput {
  name?: string;
  schedule?: string;
  command?: string;
  status?: CronStatus;
  last_run?: string;
  next_run?: string;
}

// Agent session types
export interface AgentSessionRow {
  id: string;
  name: string;
  status: AgentStatus;
  task: string;
  runtime: number;
  start_time: string;
  progress: number | null;
  parent_session: string | null;
  logs: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateAgentSessionInput {
  name: string;
  task: string;
  status?: AgentStatus;
  parent_session?: string;
}

export interface UpdateAgentSessionInput {
  status?: AgentStatus;
  task?: string;
  runtime?: number;
  progress?: number;
  logs?: string[];
}

// Cron job operations
export const cronJobDb = {
  async getAll(): Promise<CronJobRow[]> {
    const { data, error } = await getDb()
      .from('cron_jobs')
      .select()
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<CronJobRow | null> {
    const { data, error } = await getDb()
      .from('cron_jobs')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  },

  async create(input: CreateCronJobInput): Promise<CronJobRow> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await getDb()
      .from('cron_jobs')
      .insert({
        id,
        name: input.name,
        schedule: input.schedule,
        command: input.command,
        status: input.status || 'active',
        next_run: input.next_run || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateCronJobInput): Promise<CronJobRow | null> {
    const updates: any = { updated_at: new Date().toISOString() };

    if (input.name !== undefined) updates.name = input.name;
    if (input.schedule !== undefined) updates.schedule = input.schedule;
    if (input.command !== undefined) updates.command = input.command;
    if (input.status !== undefined) updates.status = input.status;
    if (input.last_run !== undefined) updates.last_run = input.last_run;
    if (input.next_run !== undefined) updates.next_run = input.next_run;

    const { data, error } = await getDb()
      .from('cron_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getDb()
      .from('cron_jobs')
      .delete()
      .eq('id', id);

    return !error;
  },

  async getHistory(jobId: string): Promise<Array<{ id: number; timestamp: string; status: string; output: string | null }>> {
    const { data, error } = await getDb()
      .from('job_history')
      .select()
      .eq('job_id', jobId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      status: row.status,
      output: row.output,
    }));
  },

  async addHistoryEntry(jobId: string, status: 'success' | 'error', output?: string): Promise<void> {
    const { error } = await getDb()
      .from('job_history')
      .insert({
        job_id: jobId,
        status,
        output: output || null,
        timestamp: new Date().toISOString(),
      });

    if (error) console.error('Failed to add job history:', error);
  },
};

// Agent session operations
export const agentSessionDb = {
  async getAll(): Promise<AgentSessionRow[]> {
    const { data, error } = await getDb()
      .from('agent_sessions')
      .select()
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<AgentSessionRow | null> {
    const { data, error } = await getDb()
      .from('agent_sessions')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  },

  async create(input: CreateAgentSessionInput): Promise<AgentSessionRow> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await getDb()
      .from('agent_sessions')
      .insert({
        id,
        name: input.name,
        status: input.status || 'idle',
        task: input.task,
        runtime: 0,
        start_time: now,
        progress: 0,
        parent_session: input.parent_session || null,
        logs: [],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateAgentSessionInput): Promise<AgentSessionRow | null> {
    const updates: any = { updated_at: new Date().toISOString() };

    if (input.status !== undefined) updates.status = input.status;
    if (input.task !== undefined) updates.task = input.task;
    if (input.runtime !== undefined) updates.runtime = input.runtime;
    if (input.progress !== undefined) updates.progress = input.progress;
    if (input.logs !== undefined) updates.logs = input.logs;

    const { data, error } = await getDb()
      .from('agent_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getDb()
      .from('agent_sessions')
      .delete()
      .eq('id', id);

    return !error;
  },
};

// Health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const { error } = await getDb().from('tasks').select('id').limit(1);
    if (error) throw error;
    return { healthy: true, message: 'Supabase connection is healthy' };
  } catch (error) {
    return { 
      healthy: false, 
      message: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

// Initialize (no-op for Supabase, tables managed via migrations)
export async function initializeDatabase(): Promise<void> {
  // Tables should be created via Supabase dashboard or migrations
  console.log('Supabase client initialized');
}

// Helper to map Supabase row to Task interface
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
    webhookAttempts: row.webhook_attempts || 0,
    lastWebhookError: row.last_webhook_error,
    webhookDeliveredAt: row.webhook_delivered_at,
  };
}

// Export Supabase client for direct access if needed
export { getSupabase as db };
export default getSupabase;
