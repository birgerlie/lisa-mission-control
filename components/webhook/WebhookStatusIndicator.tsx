'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Wifi, WifiOff, Clock } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface WebhookStatusIndicatorProps {
  task: Task;
  showDetails?: boolean;
}

type WebhookState = 'delivered' | 'pending' | 'failed' | 'waiting';

function getWebhookState(task: Task): WebhookState {
  if (task.webhookDeliveredAt) {
    return 'delivered';
  }
  const attempts = task.webhookAttempts ?? 0;
  if (attempts === 0) {
    return 'waiting';
  }
  if (attempts >= 3) {
    return 'failed';
  }
  return 'pending';
}

function getStatusConfig(state: WebhookState) {
  switch (state) {
    case 'delivered':
      return {
        icon: CheckCircle,
        color: 'text-linear-success',
        bgColor: 'bg-linear-success/10',
        borderColor: 'border-linear-success/20',
        label: 'Delivered',
        tooltip: 'Webhook delivered successfully',
      };
    case 'waiting':
      return {
        icon: Clock,
        color: 'text-linear-textMuted',
        bgColor: 'bg-linear-textMuted/10',
        borderColor: 'border-linear-textMuted/20',
        label: 'Waiting',
        tooltip: 'Webhook will be sent shortly',
      };
    case 'failed':
      return {
        icon: WifiOff,
        color: 'text-linear-danger',
        bgColor: 'bg-linear-danger/10',
        borderColor: 'border-linear-danger/20',
        label: 'Failed',
        tooltip: 'Webhook delivery failed - will retry via polling',
      };
    case 'pending':
      return {
        icon: Loader2,
        color: 'text-linear-warning',
        bgColor: 'bg-linear-warning/10',
        borderColor: 'border-linear-warning/20',
        label: 'Retrying',
        tooltip: 'Retrying webhook delivery...',
      };
  }
}

export function WebhookStatusIndicator({ task, showDetails = false }: WebhookStatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const state = getWebhookState(task);
  const config = getStatusConfig(state);
  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
          ${config.bgColor} ${config.color} ${config.borderColor}
          border transition-colors hover:opacity-80
        `}
      >
        <Icon className={`w-3.5 h-3.5 ${state === 'pending' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
        {(task.webhookAttempts ?? 0) > 0 && state !== 'delivered' && (
          <span className="ml-0.5 opacity-60">({task.webhookAttempts})</span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
          <div className="bg-linear-tooltip text-linear-tooltipText text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="font-medium mb-1">{config.tooltip}</div>
            {task.lastWebhookError && state === 'failed' && (
              <div className="text-linear-danger/80 max-w-[200px] truncate">
                Error: {task.lastWebhookError}
              </div>
            )}
            {task.webhookDeliveredAt && (
              <div className="text-linear-textMuted">
                Delivered: {new Date(task.webhookDeliveredAt).toLocaleString()}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-linear-tooltip rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version - just the dot
export function WebhookStatusDot({ task }: { task: Task }) {
  const state = getWebhookState(task);
  
  const dotColors = {
    delivered: 'bg-linear-success',
    waiting: 'bg-linear-textMuted',
    failed: 'bg-linear-danger',
    pending: 'bg-linear-warning',
  };

  return (
    <div className="relative group">
      <div className={`
        w-2.5 h-2.5 rounded-full ${dotColors[state]}
        ${state === 'pending' ? 'animate-pulse' : ''}
      `} />
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-linear-tooltip text-linear-tooltipText text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {state === 'delivered' && 'Webhook delivered'}
          {state === 'waiting' && 'Waiting to send'}
          {state === 'failed' && 'Delivery failed'}
          {state === 'pending' && 'Retrying...'}
        </div>
      </div>
    </div>
  );
}

// Status summary for the dashboard
interface WebhookSummaryProps {
  tasks: Task[];
}

export function WebhookSummary({ tasks }: WebhookSummaryProps) {
  const stats = tasks.reduce(
    (acc, task) => {
      const state = getWebhookState(task);
      acc[state]++;
      return acc;
    },
    { delivered: 0, waiting: 0, failed: 0, pending: 0 }
  );

  const total = tasks.length;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <Wifi className="w-4 h-4 text-linear-textMuted" />
        <span className="text-linear-textMuted">Webhooks:</span>
      </div>
      
      {stats.delivered > 0 && (
        <div className="flex items-center gap-1 text-linear-success">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{stats.delivered}</span>
        </div>
      )}
      
      {stats.pending > 0 && (
        <div className="flex items-center gap-1 text-linear-warning">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{stats.pending}</span>
        </div>
      )}
      
      {stats.failed > 0 && (
        <div className="flex items-center gap-1 text-linear-danger">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{stats.failed}</span>
        </div>
      )}
      
      {stats.waiting > 0 && (
        <div className="flex items-center gap-1 text-linear-textMuted">
          <Clock className="w-3.5 h-3.5" />
          <span>{stats.waiting}</span>
        </div>
      )}
    </div>
  );
}
