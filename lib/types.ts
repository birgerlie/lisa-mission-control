// Domain types for Mission Control

export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type Priority = 'high' | 'medium' | 'low';
export type AgentStatus = 'active' | 'idle' | 'error' | 'completed';
export type CronStatus = 'active' | 'paused' | 'error';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
  webhookAttempts: number;
  lastWebhookError: string | null;
  webhookDeliveredAt: string | null;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: CronStatus;
  command: string;
  history?: JobHistoryEntry[];
}

export interface JobHistoryEntry {
  timestamp: string;
  status: 'success' | 'error';
  output?: string;
}

export interface AgentSession {
  id: string;
  name: string;
  status: AgentStatus;
  task: string;
  runtime: number;
  startTime: string;
  progress?: number;
  parentSession?: string;
  logs?: string[];
}

export interface MemoryFile {
  date: string;
  filename: string;
  content: string;
  lastModified: Date;
}

export interface Document {
  path: string;
  name: string;
  category: string;
  createdAt: Date;
  size: number;
  extension: string;
}

export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_updated' | 'webhook_sent' | 'webhook_failed';
  message: string;
  timestamp: string;
  taskId?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  capabilities: string[];
  status: 'active' | 'idle';
}

export interface MissionInfo {
  name: string;
  role: string;
  mission: string;
  capabilities: string[];
  team: TeamMember[];
}
