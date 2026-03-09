import { Task, CronJob, AgentSession, MemoryFile, Document } from '../types';

export interface DataService {
  getTasks(): Promise<Task[]>;
  updateTaskStatus(taskId: string, status: Task['status']): Promise<void>;
  createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task>;
  getCronJobs(): Promise<CronJob[]>;
  getAgentSessions(): Promise<AgentSession[]>;
  killAgentSession(sessionId: string): Promise<boolean>;
  restartAgentSession(sessionId: string): Promise<boolean>;
  getMemoryFiles(): Promise<MemoryFile[]>;
  getMemoryFile(date: string): Promise<MemoryFile | null>;
  getLongTermMemory(): Promise<string | null>;
  getDocuments(): Promise<Document[]>;
}
