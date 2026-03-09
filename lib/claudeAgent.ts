import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';

// Active Claude Code processes
const activeProcesses = new Map<string, ChildProcess>();

interface SpawnClaudeOptions {
  task: string;
  workingDirectory?: string;
  systemPrompt?: string;
  allowedTools?: string[];
  timeout?: number;
}

export interface ClaudeSession {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'completed';
  task: string;
  runtime: number;
  startTime: string;
  progress?: number;
  logs: string[];
  pid?: number;
}

/**
 * Spawn a new Claude Code session as a background process
 */
export async function spawnClaudeSession(
  name: string,
  options: SpawnClaudeOptions
): Promise<ClaudeSession> {
  const id = uuidv4();
  const startTime = new Date().toISOString();
  
  // Store in database first
  const { data: session, error } = await getDb()
    .from('agent_sessions')
    .insert({
      id,
      name,
      status: 'active',
      task: options.task,
      runtime: 0,
      start_time: startTime,
      progress: 0,
      logs: [],
    })
    .select()
    .single();

  if (error) throw error;

  // Build Claude Code command
  const workingDir = options.workingDirectory || '/Users/birgerlie/clawd';
  const allowedTools = options.allowedTools || [
    'Bash', 'Edit', 'Read', 'Write', 'Exec', 'Glob', 'LS'
  ];
  
  const systemPrompt = options.systemPrompt || 
    `You are a coding assistant working on: ${options.task}. Be thorough and report progress.`;

  // Spawn Claude Code process
  const claudeProcess = spawn('claude', [
    '--dangerously-skip-permissions',
    '--print',
    '--model', 'sonnet',
    '--effort', 'high',
    '--allowed-tools', allowedTools.join(','),
    '--session-id', id,
    '--system-prompt', systemPrompt,
    '-p', options.task
  ], {
    cwd: workingDir,
    env: { ...process.env, HOME: '/Users/birgerlie' },
    detached: false, // Keep attached so we can monitor
  });

  // Store process reference
  activeProcesses.set(id, claudeProcess);
  
  // Capture output
  const logs: string[] = [];
  
  claudeProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    logs.push(`[OUTPUT] ${output}`);
    updateSessionLogs(id, logs);
  });

  claudeProcess.stderr?.on('data', (data) => {
    const error = data.toString();
    logs.push(`[ERROR] ${error}`);
    updateSessionLogs(id, logs);
  });

  claudeProcess.on('close', (code) => {
    const status = code === 0 ? 'completed' : 'error';
    updateSessionStatus(id, status);
    activeProcesses.delete(id);
    logs.push(`[SYSTEM] Process exited with code ${code}`);
    updateSessionLogs(id, logs);
  });

  // Update with PID
  if (claudeProcess.pid) {
    await getDb()
      .from('agent_sessions')
      .update({ pid: claudeProcess.pid })
      .eq('id', id);
  }

  // Start runtime tracking
  startRuntimeTracking(id);

  return {
    id,
    name,
    status: 'active',
    task: options.task,
    runtime: 0,
    startTime,
    progress: 0,
    logs: [],
    pid: claudeProcess.pid,
  };
}

/**
 * Kill a running Claude Code session
 */
export async function killClaudeSession(id: string): Promise<boolean> {
  const process = activeProcesses.get(id);
  
  if (process && !process.killed) {
    process.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }, 5000);
    
    activeProcesses.delete(id);
  }

  // Update database
  const { error } = await getDb()
    .from('agent_sessions')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  return !error;
}

/**
 * Get all active sessions with live status
 */
export async function getActiveSessions(): Promise<ClaudeSession[]> {
  const { data, error } = await getDb()
    .from('agent_sessions')
    .select()
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    task: s.task,
    runtime: s.runtime,
    startTime: s.start_time,
    progress: s.progress,
    logs: s.logs || [],
    pid: s.pid,
  }));
}

/**
 * Update session logs in database
 */
async function updateSessionLogs(id: string, logs: string[]) {
  // Keep only last 100 log entries to prevent DB bloat
  const recentLogs = logs.slice(-100);
  
  await getDb()
    .from('agent_sessions')
    .update({ 
      logs: recentLogs,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

/**
 * Update session status
 */
async function updateSessionStatus(id: string, status: string) {
  await getDb()
    .from('agent_sessions')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

/**
 * Track runtime and update progress
 */
function startRuntimeTracking(id: string) {
  const interval = setInterval(async () => {
    const process = activeProcesses.get(id);
    if (!process || process.killed) {
      clearInterval(interval);
      return;
    }

    // Get current session to calculate runtime
    const { data } = await getDb()
      .from('agent_sessions')
      .select('start_time')
      .eq('id', id)
      .single();

    if (data) {
      const startTime = new Date(data.start_time).getTime();
      const runtime = Math.floor((Date.now() - startTime) / 1000);
      
      // Simulate progress (in real implementation, parse from logs)
      const progress = Math.min(Math.floor((runtime / 300) * 100), 95); // Cap at 95% until done
      
      await getDb()
        .from('agent_sessions')
        .update({ runtime, progress })
        .eq('id', id);
    }
  }, 5000); // Update every 5 seconds
}

/**
 * Spawn a coding task with Claude Code
 */
export async function spawnCodingTask(
  name: string,
  task: string,
  workingDirectory: string = '/Users/birgerlie/clawd'
): Promise<ClaudeSession> {
  return spawnClaudeSession(name, {
    task,
    workingDirectory,
    systemPrompt: `You are a senior developer working on: ${task}. Be thorough, test your changes, and report progress. Work independently and complete the task.`,
    allowedTools: ['Bash', 'Edit', 'Read', 'Write', 'Exec', 'Glob', 'LS', 'Source'],
  });
}

/**
 * Spawn a research task
 */
export async function spawnResearchTask(
  name: string,
  topic: string
): Promise<ClaudeSession> {
  return spawnClaudeSession(name, {
    task: `Research: ${topic}. Find comprehensive information, sources, and summarize findings.`,
    workingDirectory: '/Users/birgerlie/clawd',
    systemPrompt: 'You are a research assistant. Gather information thoroughly and provide detailed summaries with sources.',
    allowedTools: ['Bash', 'Read', 'Write', 'Exec', 'Glob', 'LS'],
  });
}

// Export for use in API routes
export { activeProcesses };
