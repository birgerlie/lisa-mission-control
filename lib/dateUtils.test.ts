import { 
  formatDate, 
  formatRelativeTime, 
  formatDuration,
  parseDateInput,
  isValidDate,
  calculateTimeDifference 
} from './dateUtils';

describe('parseDateInput', () => {
  it('returns Date object when given Date', () => {
    const date = new Date('2025-01-15');
    const result = parseDateInput(date);
    expect(result).toBe(date);
  });

  it('parses string into Date', () => {
    const result = parseDateInput('2025-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString().startsWith('2025-01-15')).toBe(true);
  });
});

describe('isValidDate', () => {
  it('returns true for valid date', () => {
    expect(isValidDate(new Date('2025-01-15'))).toBe(true);
  });

  it('returns false for invalid date', () => {
    expect(isValidDate(new Date('invalid'))).toBe(false);
  });
});

describe('formatDate', () => {
  it('formats date in short format without year for current year', () => {
    const now = new Date();
    const result = formatDate(now);
    expect(result).toMatch(/^[A-Za-z]{3}\s+\d{1,2}$/);
  });

  it('includes year for dates in different year', () => {
    const date = new Date('2023-06-15');
    const result = formatDate(date);
    expect(result).toContain('2023');
  });

  it('handles string date input', () => {
    const result = formatDate('2025-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });

  it('returns "Invalid date" for invalid input', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "just now" for times less than a minute ago', () => {
    const date = new Date('2025-01-15T11:59:30Z');
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns minutes for times within an hour', () => {
    const date = new Date('2025-01-15T11:30:00Z');
    expect(formatRelativeTime(date)).toBe('30m ago');
  });

  it('returns hours for times within a day', () => {
    const date = new Date('2025-01-15T08:00:00Z');
    expect(formatRelativeTime(date)).toBe('4h ago');
  });

  it('returns days for times within a week', () => {
    const date = new Date('2025-01-10T12:00:00Z');
    expect(formatRelativeTime(date)).toBe('5d ago');
  });

  it('formats future times correctly', () => {
    const date = new Date('2025-01-15T14:00:00Z');
    expect(formatRelativeTime(date)).toBe('in 2h');
  });

  it('returns "Invalid date" for invalid input', () => {
    expect(formatRelativeTime('invalid')).toBe('Invalid date');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(7500000)).toBe('2h 5m');
  });

  it('returns "0s" for negative duration', () => {
    expect(formatDuration(-1000)).toBe('0s');
  });

  it('returns "0s" for zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('calculateTimeDifference', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns positive difference for past dates', () => {
    const pastDate = new Date('2025-01-15T11:00:00Z');
    const diff = calculateTimeDifference(pastDate);
    expect(diff).toBe(3600000); // 1 hour in ms
  });

  it('returns negative difference for future dates', () => {
    const futureDate = new Date('2025-01-15T13:00:00Z');
    const diff = calculateTimeDifference(futureDate);
    expect(diff).toBe(-3600000); // -1 hour in ms
  });
});
