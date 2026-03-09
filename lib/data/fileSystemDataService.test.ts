import { FileSystemDataService } from './fileSystemDataService';
import { Task } from '../types';

describe('FileSystemDataService', () => {
  let service: FileSystemDataService;
  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', status: 'backlog', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
  ];

  beforeEach(() => {
    service = new FileSystemDataService(mockTasks);
  });

  describe('getTasks', () => {
    it('returns tasks array', async () => {
      const tasks = await service.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 1');
    });

    it('returns copy of tasks array', async () => {
      const tasks1 = await service.getTasks();
      const tasks2 = await service.getTasks();
      expect(tasks1).not.toBe(tasks2);
    });
  });

  describe('updateTaskStatus', () => {
    it('updates task status', async () => {
      await service.updateTaskStatus('1', 'in-progress');
      const tasks = await service.getTasks();
      expect(tasks[0].status).toBe('in-progress');
    });

    it('throws error for non-existent task', async () => {
      await expect(service.updateTaskStatus('999', 'done')).rejects.toThrow('Task not found');
    });
  });

  describe('createTask', () => {
    it('creates task with generated id and date', async () => {
      const newTask = await service.createTask({
        title: 'New Task',
        status: 'backlog',
        assignee: 'Bob',
        priority: 'medium',
      });

      expect(newTask.id).toBeDefined();
      expect(newTask.createdAt).toBeDefined();
      expect(newTask.title).toBe('New Task');
    });
  });

  describe('getCronJobs', () => {
    it('returns mock cron jobs', async () => {
      const jobs = await service.getCronJobs();
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0]).toHaveProperty('name');
      expect(jobs[0]).toHaveProperty('schedule');
    });
  });

  describe('getAgentSessions', () => {
    it('returns mock agent sessions', async () => {
      const sessions = await service.getAgentSessions();
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0]).toHaveProperty('name');
      expect(sessions[0]).toHaveProperty('status');
    });
  });

  describe('killAgentSession', () => {
    it('returns true', async () => {
      const result = await service.killAgentSession('agent-1');
      expect(result).toBe(true);
    });
  });

  describe('restartAgentSession', () => {
    it('returns true', async () => {
      const result = await service.restartAgentSession('agent-1');
      expect(result).toBe(true);
    });
  });

  describe('getMemoryFiles', () => {
    it('returns array of memory files', async () => {
      const files = await service.getMemoryFiles();
      // Either returns files (if directory exists) or empty array (if not)
      expect(Array.isArray(files)).toBe(true);
      // If files exist, they should have the correct shape
      if (files.length > 0) {
        expect(files[0]).toHaveProperty('date');
        expect(files[0]).toHaveProperty('filename');
        expect(files[0]).toHaveProperty('content');
        expect(files[0]).toHaveProperty('lastModified');
      }
    });
  });

  describe('getMemoryFile', () => {
    it('returns null for non-existent file', async () => {
      const file = await service.getMemoryFile('9999-99-99');
      expect(file).toBeNull();
    });
  });

  describe('getLongTermMemory', () => {
    it('returns null when file does not exist', async () => {
      const content = await service.getLongTermMemory();
      expect(content).toBeNull();
    });
  });
});
