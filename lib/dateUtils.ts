// Date formatting utilities - Pure functions for easy testing

const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDateInput(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

export function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

export function formatDate(date: Date | string): string {
  const parsedDate = parseDateInput(date);
  
  if (!isValidDate(parsedDate)) {
    return 'Invalid date';
  }
  
  const currentYear = new Date().getFullYear();
  const dateYear = parsedDate.getFullYear();
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
  };
  
  if (dateYear !== currentYear) {
    options.year = 'numeric';
  }
  
  return parsedDate.toLocaleDateString('en-US', options);
}

export function calculateTimeDifference(date: Date): number {
  const now = new Date();
  return now.getTime() - date.getTime();
}

export function formatRelativeTime(date: Date | string): string {
  const parsedDate = parseDateInput(date);
  
  if (!isValidDate(parsedDate)) {
    return 'Invalid date';
  }
  
  const diff = calculateTimeDifference(parsedDate);
  
  if (diff < 0) {
    return formatFutureTime(-diff);
  }
  
  return formatPastTime(diff);
}

function formatPastTime(diffMs: number): string {
  const seconds = Math.floor(diffMs / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(diffMs / MILLISECONDS_PER_MINUTE);
  const hours = Math.floor(diffMs / MILLISECONDS_PER_HOUR);
  const days = Math.floor(diffMs / MILLISECONDS_PER_DAY);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(new Date(Date.now() - diffMs));
}

function formatFutureTime(diffMs: number): string {
  const minutes = Math.floor(diffMs / MILLISECONDS_PER_MINUTE);
  const hours = Math.floor(diffMs / MILLISECONDS_PER_HOUR);
  const days = Math.floor(diffMs / MILLISECONDS_PER_DAY);
  
  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h`;
  if (days < 7) return `in ${days}d`;
  
  return formatDate(new Date(Date.now() + diffMs));
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 0) {
    return '0s';
  }
  
  const totalSeconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingSeconds = totalSeconds % 60;
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${totalSeconds}s`;
}
