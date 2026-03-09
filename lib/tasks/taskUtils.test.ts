import { Task } from '../types';
import {
  calculateTaskStats,
  filterTasksByStatus,
  getActiveTasksCount,
  updateTaskStatus,
  createTask,
  sortTasksByStatus,
  isTaskOverdue,
} from './taskUtils';

describe('calculateTaskStats', () => {
  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', status: 'backlog', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
    { id: '2', title: 'Task 2', status: 'in-progress', assignee: 'Lisa', priority: 'medium', createdAt: '2025-01-15' },
    { id: '3', title: 'Task 3', status: 'in-progress', assignee: 'Bob', priority: 'low', createdAt: '2025-01-15' },
    { id: '4', title: 'Task 4', status: 'done', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
    { id: '5', title: 'Task 5', status: 'review', assignee: 'Alice', priority: 'medium', createdAt: '2025-01-15' },
  ];

  it('calculates correct stats', () => {
    const stats = calculateTaskStats(mockTasks);
    
    expect(stats.backlog).toBe(1);
    expect(stats.inProgress).toBe(2);
    expect(stats.review).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.total).toBe(5);
  });

  it('returns zero stats for empty array', () => {
    const stats = calculateTaskStats([]);
    
    expect(stats.backlog).toBe(0);
    expect(stats.inProgress).toBe(0);
    expect(stats.review).toBe(0);
    expect(stats.done).toBe(0);
    expect(stats.total).toBe(0);
  });
});

describe('filterTasksByStatus', () => {
  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', status: 'backlog', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
    { id: '2', title: 'Task 2', status: 'in-progress', assignee: 'Lisa', priority: 'medium', createdAt: '2025-01-15' },
    { id: '3', title: 'Task 3', status: 'backlog', assignee: 'Bob', priority: 'low', createdAt: '2025-01-15' },
  ];

  it('filters tasks by status', () => {
    const result = filterTasksByStatus(mockTasks, 'backlog');
    
    expect(result).toHaveLength(2);
    expect(result.every(t => t.status === 'backlog')).toBe(true);
  });

  it('returns empty array when no matches', () => {
    const result = filterTasksByStatus(mockTasks, 'done');
    
    expect(result).toHaveLength(0);
  });
});

describe('getActiveTasksCount', () => {
  it('counts non-done tasks', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', status: 'backlog', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
      { id: '2', title: 'Task 2', status: 'done', assignee: 'Lisa', priority: 'medium', createdAt: '2025-01-15' },
      { id: '3', title: 'Task 3', status: 'in-progress', assignee: 'Bob', priority: 'low', createdAt: '2025-01-15' },
    ];
    
    expect(getActiveTasksCount(tasks)).toBe(2);
  });
});

describe('updateTaskStatus', () => {
  const tasks: Task[] = [
    { id: '1', title: 'Task 1', status: 'backlog', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
    { id: '2', title: 'Task 2', status: 'in-progress', assignee: 'Bob', priority: 'low', createdAt: '2025-01-15' },
  ];

  it('updates task status immutably', () => {
    const updated = updateTaskStatus(tasks, '1', 'in-progress');
    
    expect(updated[0].status).toBe('in-progress');
    expect(tasks[0].status).toBe('backlog'); // Original unchanged
  });

  it('returns new array with same tasks when id not found', () => {
    const updated = updateTaskStatus(tasks, '999', 'done');
    
    expect(updated).toHaveLength(2);
    expect(updated.every(t => t.status !== 'done')).toBe(true);
  });
});

describe('createTask', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates task with required fields', () => {
    const task = createTask('New Task', 'Lisa');
    
    expect(task.title).toBe('New Task');
    expect(task.assignee).toBe('Lisa');
    expect(task.status).toBe('backlog');
    expect(task.priority).toBe('medium');
    expect(task.createdAt).toBe('2025-01-15');
    expect(task.id).toBeDefined();
  });

  it('trims title and assignee', () => {
    const task = createTask('  New Task  ', '  Lisa  ');
    
    expect(task.title).toBe('New Task');
    expect(task.assignee).toBe('Lisa');
  });

  it('accepts optional fields', () => {
    const task = createTask('New Task', 'Lisa', 'high', {
      description: 'A description',
      dueDate: '2025-01-20',
      tags: ['urgent'],
    });
    
    expect(task.priority).toBe('high');
    expect(task.description).toBe('A description');
    expect(task.dueDate).toBe('2025-01-20');
    expect(task.tags).toEqual(['urgent']);
  });
});

describe('sortTasksByStatus', () => {
  it('sorts tasks by status order', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Done Task', status: 'done', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
      { id: '2', title: 'Backlog Task', status: 'backlog', assignee: 'Lisa', priority: 'medium', createdAt: '2025-01-15' },
      { id: '3', title: 'In Progress', status: 'in-progress', assignee: 'Bob', priority: 'low', createdAt: '2025-01-15' },
    ];
    
    const sorted = sortTasksByStatus(tasks);
    
    expect(sorted[0].status).toBe('backlog');
    expect(sorted[1].status).toBe('in-progress');
    expect(sorted[2].status).toBe('done');
  });

  it('does not mutate original array', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', status: 'done', assignee: 'Lisa', priority: 'high', createdAt: '2025-01-15' },
    ];
    
    sortTasksByStatus(tasks);
    
    expect(tasks[0].status).toBe('done');
  });
});

describe('isTaskOverdue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true for past due dates', () => {
    const task: Task = {
      id: '1',
      title: 'Task',
      status: 'in-progress',
      assignee: 'Lisa',
      priority: 'high',
      createdAt: '2025-01-10',
      dueDate: '2025-01-10',
    };
    
    expect(isTaskOverdue(task)).toBe(true);
  });

  it('returns false for future due dates', () => {
    const task: Task = {
      id: '1',
      title: 'Task',
      status: 'in-progress',
      assignee: 'Lisa',
      priority: 'high',
      createdAt: '2025-01-10',
      dueDate: '2025-01-20',
    };
    
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns false for completed tasks', () => {
    const task: Task = {
      id: '1',
      title: 'Task',
      status: 'done',
      assignee: 'Lisa',
      priority: 'high',
      createdAt: '2025-01-10',
      dueDate: '2025-01-10',
    };
    
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns false when no due date', () => {
    const task: Task = {
      id: '1',
      title: 'Task',
      status: 'in-progress',
      assignee: 'Lisa',
      priority: 'high',
      createdAt: '2025-01-10',
    };
    
    expect(isTaskOverdue(task)).toBe(false);
  });
});
