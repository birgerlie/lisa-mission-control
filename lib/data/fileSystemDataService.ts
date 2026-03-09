import fs from 'fs';
import path from 'path';
import { Task, CronJob, AgentSession, MemoryFile, Document } from '../types';
import { DataService } from './dataService';

const WORKSPACE_ROOT = '/Users/birgerlie/clawd';
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory');

const readFileAsync = fs.promises.readFile;
const readdirAsync = fs.promises.readdir;
const statAsync = fs.promises.stat;

const EXCLUDED_FILES = ['node_modules', '.git', '.next', 'package-lock.json'];
const EXCLUDED_EXTENSIONS = ['.log', '.tmp', '.lock'];

export class FileSystemDataService implements DataService {
  private tasks: Task[] = [];

  constructor(initialTasks: Task[] = []) {
    this.tasks = initialTasks;
  }

  async getTasks(): Promise<Task[]> {
    return [...this.tasks];
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }
    this.tasks[taskIndex] = { ...this.tasks[taskIndex], status };
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      id: this.generateId(),
      createdAt: this.getCurrentDateString(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  async getCronJobs(): Promise<CronJob[]> {
    return this.createMockCronJobs();
  }

  async getAgentSessions(): Promise<AgentSession[]> {
    return this.createMockAgentSessions();
  }

  async killAgentSession(_sessionId: string): Promise<boolean> {
    return true;
  }

  async restartAgentSession(_sessionId: string): Promise<boolean> {
    return true;
  }

  async getMemoryFiles(): Promise<MemoryFile[]> {
    try {
      const files = await readdirAsync(MEMORY_DIR);
      const memoryFiles = await this.parseMemoryFiles(files);
      return this.sortMemoryFilesByDate(memoryFiles);
    } catch {
      return [];
    }
  }

  async getMemoryFile(date: string): Promise<MemoryFile | null> {
    try {
      const filename = `${date}.md`;
      const filePath = path.join(MEMORY_DIR, filename);
      const stats = await statAsync(filePath);
      const content = await readFileAsync(filePath, 'utf-8');
      
      return { date, filename, content, lastModified: stats.mtime };
    } catch {
      return null;
    }
  }

  async getLongTermMemory(): Promise<string | null> {
    try {
      const filePath = path.join(WORKSPACE_ROOT, 'MEMORY.md');
      return await readFileAsync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async getDocuments(): Promise<Document[]> {
    const documents: Document[] = [];
    await this.scanDirectory(WORKSPACE_ROOT, documents);
    return this.sortDocumentsByDate(documents);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  private getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private createMockCronJobs(): CronJob[] {
    return [
      {
        id: '1',
        name: 'Morning Briefing',
        schedule: '0 8 * * *',
        lastRun: '2025-01-16T08:00:00Z',
        nextRun: '2025-01-17T08:00:00Z',
        status: 'active',
        command: 'generate-daily-brief',
      },
      {
        id: '2',
        name: 'Email Check',
        schedule: '*/30 * * * *',
        lastRun: '2025-01-16T14:30:00Z',
        nextRun: '2025-01-16T15:00:00Z',
        status: 'active',
        command: 'check-emails',
      },
    ];
  }

  private createMockAgentSessions(): AgentSession[] {
    return [
      {
        id: 'agent-1',
        name: 'Code Reviewer',
        status: 'active',
        task: 'Reviewing PR #234',
        runtime: 45 * 60 * 1000,
        startTime: '2025-01-16T13:45:00Z',
        progress: 65,
        parentSession: 'main',
      },
    ];
  }

  private async parseMemoryFiles(files: string[]): Promise<MemoryFile[]> {
    const memoryFiles: MemoryFile[] = [];
    
    for (const filename of files) {
      if (!this.isMemoryFile(filename)) continue;
      
      const date = this.extractDateFromFilename(filename);
      if (!date) continue;
      
      const filePath = path.join(MEMORY_DIR, filename);
      const stats = await statAsync(filePath);
      const content = await readFileAsync(filePath, 'utf-8');
      
      memoryFiles.push({ date, filename, content, lastModified: stats.mtime });
    }
    
    return memoryFiles;
  }

  private isMemoryFile(filename: string): boolean {
    return filename.endsWith('.md') && filename !== 'MEMORY.md';
  }

  private extractDateFromFilename(filename: string): string | null {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})\.md/);
    return match ? match[1] : null;
  }

  private sortMemoryFilesByDate(files: MemoryFile[]): MemoryFile[] {
    return [...files].sort((a, b) => b.date.localeCompare(a.date));
  }

  private async scanDirectory(dir: string, documents: Document[], relativePath: string = ''): Promise<void> {
    const entries = await readdirAsync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (this.shouldSkipEntry(entry.name)) continue;
      
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, documents, relPath);
      } else {
        await this.addDocument(fullPath, relPath, entry.name, documents);
      }
    }
  }

  private shouldSkipEntry(name: string): boolean {
    return EXCLUDED_FILES.includes(name) || name.startsWith('.');
  }

  private async addDocument(fullPath: string, relPath: string, name: string, documents: Document[]): Promise<void> {
    const ext = path.extname(name);
    if (EXCLUDED_EXTENSIONS.includes(ext)) return;
    
    const stats = await statAsync(fullPath);
    documents.push({
      path: relPath,
      name,
      category: this.categorizeDocument(name, relPath),
      createdAt: stats.birthtime,
      size: stats.size,
      extension: ext || 'no-ext',
    });
  }

  private categorizeDocument(filename: string, filePath: string): string {
    const lowerPath = filePath.toLowerCase();
    const lowerName = filename.toLowerCase();
    
    if (lowerPath.includes('skill') || lowerName.includes('skill')) return 'Skills';
    if (lowerPath.includes('analysis') || lowerName.includes('analysis')) return 'Analysis';
    if (lowerPath.includes('business') || lowerName.includes('business')) return 'Business';
    if (lowerPath.includes('project') || lowerName.includes('project')) return 'Projects';
    if (lowerPath.includes('doc') || lowerName.endsWith('.md')) return 'Documentation';
    if (this.isConfigFile(lowerName)) return 'Config';
    if (this.isCodeFile(lowerName)) return 'Code';
    
    return 'Other';
  }

  private isConfigFile(filename: string): boolean {
    return ['.json', '.yaml', '.yml'].some(ext => filename.endsWith(ext));
  }

  private isCodeFile(filename: string): boolean {
    return ['.ts', '.tsx', '.js', '.jsx'].some(ext => filename.endsWith(ext));
  }

  private sortDocumentsByDate(documents: Document[]): Document[] {
    return [...documents].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
