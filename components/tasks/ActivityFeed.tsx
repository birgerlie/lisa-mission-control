'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, CheckCircle2, Send, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/dateUtils';
import { cn } from '@/lib/classUtils';
import type { ActivityItem } from '@/lib/types';

const POLL_INTERVAL = 15000;

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  switch (type) {
    case 'task_updated':
    case 'task_created':
      return <CheckCircle2 className="w-4 h-4 text-[#5e6ad2]" />;
    case 'webhook_sent':
      return <Send className="w-4 h-4 text-emerald-400" />;
    case 'webhook_failed':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Activity className="w-4 h-4 text-[#8a8f98]" />;
  }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch {
      // Silently fail on poll errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div className="bg-[#1b1b1f] border border-[#2a2a2e] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-3',
          'text-[#f7f8f8] hover:bg-[#25252a] transition-colors',
          'text-sm font-medium'
        )}
      >
        <Activity className="w-4 h-4 text-[#5e6ad2]" />
        <span>Activity</span>
        <span className="ml-auto text-[#8a8f98]">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[#2a2a2e] max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-[#8a8f98] text-sm">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="px-4 py-6 text-center text-[#8a8f98] text-sm">
              No recent activity
            </div>
          ) : (
            <ul className="divide-y divide-[#2a2a2e]">
              {activities.map((item) => (
                <li
                  key={item.id}
                  className="px-4 py-3 hover:bg-[#25252a] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <ActivityIcon type={item.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#d1d5db] truncate">
                        {item.message}
                      </p>
                      <p className="text-xs text-[#8a8f98] mt-0.5">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
