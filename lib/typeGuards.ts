import { TaskStatus, Priority, AgentStatus, CronStatus } from './types';

const VALID_TASK_STATUSES: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];
const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const VALID_AGENT_STATUSES: AgentStatus[] = ['active', 'idle', 'error', 'completed'];
const VALID_CRON_STATUSES: CronStatus[] = ['active', 'paused', 'error'];

export function isValidTaskStatus(status: string): status is TaskStatus {
  return VALID_TASK_STATUSES.includes(status as TaskStatus);
}

export function isValidPriority(priority: string): priority is Priority {
  return VALID_PRIORITIES.includes(priority as Priority);
}

export function isValidAgentStatus(status: string): status is AgentStatus {
  return VALID_AGENT_STATUSES.includes(status as AgentStatus);
}

export function isValidCronStatus(status: string): status is CronStatus {
  return VALID_CRON_STATUSES.includes(status as CronStatus);
}

export const statusOrder: Record<TaskStatus, number> = {
  backlog: 0,
  'in-progress': 1,
  review: 2,
  done: 3,
};

export const priorityWeight: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function compareTasksByStatus(a: { status: TaskStatus }, b: { status: TaskStatus }): number {
  return statusOrder[a.status] - statusOrder[b.status];
}

export function compareTasksByPriority(a: { priority: Priority }, b: { priority: Priority }): number {
  return priorityWeight[b.priority] - priorityWeight[a.priority];
}
