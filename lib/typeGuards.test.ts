import { 
  TaskStatus, 
  Priority, 
  AgentStatus, 
  CronStatus,
  isValidTaskStatus,
  isValidPriority,
  isValidAgentStatus,
  isValidCronStatus,
  statusOrder,
  priorityWeight
} from './typeGuards';

describe('Type Guards', () => {
  describe('isValidTaskStatus', () => {
    it('returns true for valid task statuses', () => {
      expect(isValidTaskStatus('backlog')).toBe(true);
      expect(isValidTaskStatus('in-progress')).toBe(true);
      expect(isValidTaskStatus('review')).toBe(true);
      expect(isValidTaskStatus('done')).toBe(true);
    });

    it('returns false for invalid task statuses', () => {
      expect(isValidTaskStatus('unknown')).toBe(false);
      expect(isValidTaskStatus('')).toBe(false);
    });
  });

  describe('isValidPriority', () => {
    it('returns true for valid priorities', () => {
      expect(isValidPriority('high')).toBe(true);
      expect(isValidPriority('medium')).toBe(true);
      expect(isValidPriority('low')).toBe(true);
    });

    it('returns false for invalid priorities', () => {
      expect(isValidPriority('critical')).toBe(false);
      expect(isValidPriority('')).toBe(false);
    });
  });

  describe('isValidAgentStatus', () => {
    it('returns true for valid agent statuses', () => {
      expect(isValidAgentStatus('active')).toBe(true);
      expect(isValidAgentStatus('idle')).toBe(true);
      expect(isValidAgentStatus('error')).toBe(true);
      expect(isValidAgentStatus('completed')).toBe(true);
    });

    it('returns false for invalid agent statuses', () => {
      expect(isValidAgentStatus('running')).toBe(false);
    });
  });

  describe('isValidCronStatus', () => {
    it('returns true for valid cron statuses', () => {
      expect(isValidCronStatus('active')).toBe(true);
      expect(isValidCronStatus('paused')).toBe(true);
      expect(isValidCronStatus('error')).toBe(true);
    });

    it('returns false for invalid cron statuses', () => {
      expect(isValidCronStatus('stopped')).toBe(false);
    });
  });
});

describe('Status Order', () => {
  it('has correct order for task statuses', () => {
    expect(statusOrder.backlog).toBe(0);
    expect(statusOrder['in-progress']).toBe(1);
    expect(statusOrder.review).toBe(2);
    expect(statusOrder.done).toBe(3);
  });
});

describe('Priority Weight', () => {
  it('has correct weight for priorities', () => {
    expect(priorityWeight.high).toBe(3);
    expect(priorityWeight.medium).toBe(2);
    expect(priorityWeight.low).toBe(1);
  });
});
