import fs from 'fs';
import path from 'path';
import { Task, CronJob, AgentSession, MemoryFile, Document } from '../types';
import { DataService, CreateTaskData } from './dataService';
import { taskDb, cronJobDb, agentSessionDb } from '../db';

const WORKSPACE_ROOT = '/Users/birgerlie/clawd';
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory');

const readFileAsync = fs.promises.readFile;
const readdirAsync = fs.promises.readdir;
const statAsync = fs.promises.stat;

const EXCLUDED_FILES = ['node_modules', '.git', '.next', 'package-lock.json'];
const EXCLUDED_EXTENSIONS = ['.log', '.tmp', '.lock'];

export class FileSystemDataService implements DataService {
  async getTasks(): Promise<Task[]> {
    return await taskDb.getAll();
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    const task = await taskDb.getById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    await taskDb.update(taskId, { status });
  }

  async createTask(taskData: CreateTaskData): Promise<Task> {
    const newTask = await taskDb.create({
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority,
      assignee: taskData.assignee,
    });
    return newTask;
  }

  async getCronJobs(): Promise<CronJob[]> {
    const rows = await cronJobDb.getAll();
    const jobs: CronJob[] = [];
    for (const row of rows) {
      const history = await cronJobDb.getHistory(row.id);
      jobs.push({
        id: row.id,
        name: row.name,
        schedule: row.schedule,
        command: row.command,
        status: row.status,
        lastRun: row.last_run || undefined,
        nextRun: row.next_run || undefined,
        history: history.map(h => ({
          timestamp: h.timestamp,
          status: h.status as 'success' | 'error',
          output: h.output || undefined,
        })),
      });
    }
    return jobs;
  }

  async getAgentSessions(): Promise<AgentSession[]> {
    const rows = await agentSessionDb.getAll();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      task: row.task,
      runtime: row.runtime,
      startTime: row.start_time,
      progress: row.progress || undefined,
      parentSession: row.parent_session || undefined,
      logs: row.logs,
    }));
  }

  async getMemoryFiles(): Promise<MemoryFile[]> {
    return this.readMemoryFiles();
  }

  async getDocuments(): Promise<Document[]> {
    return this.scanDocuments();
  }

  private async readMemoryFiles(): Promise<MemoryFile[]> {
    try {
      const files = await readdirAsync(MEMORY_DIR);
      const memoryFiles: MemoryFile[] = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(MEMORY_DIR, file);
          try {
            const content = await readFileAsync(filePath, 'utf-8');
            const stats = await statAsync(filePath);
            
            memoryFiles.push({
              date: path.basename(file, '.md'),
              filename: file,
              content,
              lastModified: stats.mtime,
            });
          } catch {
            // Skip files that can't be read
          }
        }
      }

      return memoryFiles.sort((a, b) => 
        b.lastModified.getTime() - a.lastModified.getTime()
      );
    } catch {
      return [];
    }
  }

  private async scanDocuments(): Promise<Document[]> {
    const documents: Document[] = [];
    
    try {
      await this.scanDirectory(WORKSPACE_ROOT, documents, '');
    } catch {
      // Return empty array if scan fails
    }

    return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async scanDirectory(dir: string, documents: Document[], relativePath: string): Promise<void> {
    try {
      const entries = await readdirAsync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!EXCLUDED_FILES.includes(entry.name) && !entry.name.startsWith('.')) {
            await this.scanDirectory(
              path.join(dir, entry.name),
              documents,
              path.join(relativePath, entry.name)
            );
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!EXCLUDED_EXTENSIONS.includes(ext) && !entry.name.startsWith('.')) {
            try {
              const stats = await statAsync(path.join(dir, entry.name));
              documents.push({
                path: path.join(relativePath, entry.name),
                name: entry.name,
                category: this.getCategory(relativePath),
                createdAt: stats.birthtime,
                size: stats.size,
                extension: ext,
              });
            } catch {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch {
      // Ignore errors for directories that can't be read
    }
  }

  private getCategory(relativePath: string): string {
    const parts = relativePath.split(path.sep);
    if (parts.length === 0) return 'root';
    
    const firstDir = parts[0].toLowerCase();
    const categoryMap: Record<string, string> = {
      'docs': 'documentation',
      'src': 'source',
      'components': 'components',
      'app': 'application',
      'lib': 'library',
      'skills': 'skills',
      'memory': 'memory',
    };

    return categoryMap[firstDir] || firstDir || 'other';
  }


  async killAgentSession(sessionId: string): Promise<boolean> {
    const updated = await agentSessionDb.update(sessionId, { status: 'completed' });
    return updated !== null;
  }

  async restartAgentSession(sessionId: string): Promise<boolean> {
    const updated = await agentSessionDb.update(sessionId, { status: 'active', runtime: 0 });
    return updated !== null;
  }

  async getMemoryFile(date: string): Promise<MemoryFile | null> {
    const files = await this.getMemoryFiles();
    return files.find(f => f.date === date) || null;
  }

  async getLongTermMemory(): Promise<string | null> {
    try {
      const memoryPath = path.join(WORKSPACE_ROOT, 'MEMORY.md');
      const content = await readFileAsync(memoryPath, 'utf-8');
      return content;
    } catch {
      return null;
    }
  }
}
