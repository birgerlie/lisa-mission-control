import { Task, CronJob, AgentSession, MemoryFile, Document, TaskStatus, Priority } from '../types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status: TaskStatus;
  assignee: string;
  priority: Priority;
  dueDate?: string;
  completedAt?: string;
  tags?: string[];
}

export interface DataService {
  getTasks(): Promise<Task[]>;
  updateTaskStatus(taskId: string, status: Task['status']): Promise<void>;
  createTask(task: CreateTaskData): Promise<Task>;
  getCronJobs(): Promise<CronJob[]>;
  getAgentSessions(): Promise<AgentSession[]>;
  killAgentSession(sessionId: string): Promise<boolean>;
  restartAgentSession(sessionId: string): Promise<boolean>;
  getMemoryFiles(): Promise<MemoryFile[]>;
  getMemoryFile(date: string): Promise<MemoryFile | null>;
  getLongTermMemory(): Promise<string | null>;
  getDocuments(): Promise<Document[]>;
}
