'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/hooks/useTasks';
import { WebhookStatusDot } from '@/components/webhook/WebhookStatusIndicator';
import { MoreHorizontal, Calendar, User, GripVertical, Trash2, Edit } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  showWebhookStatus?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  backlog: 'status-pending',
  'in-progress': 'status-in-progress',
  review: 'status-review',
  done: 'status-done',
};

const priorityColors: Record<string, string> = {
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export function TaskList({ 
  tasks, 
  onUpdateStatus, 
  onDelete,
  showWebhookStatus = true 
}: TaskListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggingId) {
      await onUpdateStatus(draggingId, status);
      setDraggingId(null);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter(t => t.status === status);

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {columns.map(column => (
        <div
          key={column.id}
          className="flex flex-col bg-linear-surface rounded-xl border border-linear-border min-h-[400px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between p-4 border-b border-linear-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-linear-text">{column.title}</h3>
              <span className={`w-2 h-2 rounded-full ${statusColors[column.id]}`} />
            </div>
            <span className="text-sm text-linear-textMuted bg-linear-bg px-2 py-0.5 rounded-full">
              {getTasksByStatus(column.id).length}
            </span>
          </div>

          {/* Tasks */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            {getTasksByStatus(column.id).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                showWebhookStatus={showWebhookStatus}
                dropdownOpen={dropdownOpen === task.id}
                onDropdownToggle={() => setDropdownOpen(dropdownOpen === task.id ? null : task.id)}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  showWebhookStatus?: boolean;
  dropdownOpen?: boolean;
  onDropdownToggle?: () => void;
  onDelete?: (id: string) => Promise<void>;
}

function TaskCard({
  task,
  draggable,
  onDragStart,
  showWebhookStatus,
  dropdownOpen,
  onDropdownToggle,
  onDelete,
}: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(task.id);
    setIsDeleting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className="bg-linear-bg rounded-lg p-4 cursor-move card-hover group relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-linear-text flex-1 pr-2 line-clamp-2">
          {task.title}
        </h4>
        <div className="flex items-center gap-1">
          {showWebhookStatus && <WebhookStatusDot task={task} />}
          
          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={onDropdownToggle}
              className="p-1 text-linear-textMuted hover:text-linear-text rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-linear-surface border border-linear-border rounded-lg shadow-lg z-10 py-1">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-linear-danger hover:bg-linear-danger/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Description */}
      {task.description && (
        <p className="text-xs text-linear-textMuted mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-linear-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-linear-textMuted">
            <User className="w-3 h-3" />
            {task.assignee}
          </div>
          <div className="flex items-center gap-1 text-xs text-linear-textMuted">
            <Calendar className="w-3 h-3" />
            {formatDate(task.createdAt)}
          </div>
        </div>
        
        {/* Drag handle */}
        <GripVertical className="w-4 h-4 text-linear-textMuted opacity-0 group-hover:opacity-50" />
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={onDropdownToggle}
        />
      )}
    </div>
  );
}

// Simple list view variant
interface TaskListViewProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function TaskListView({ tasks, onUpdateStatus, onDelete }: TaskListViewProps) {
  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <div
          key={task.id}
          className="flex items-center gap-4 p-3 bg-linear-surface rounded-lg border border-linear-border hover:border-linear-primary/30 transition-colors"
        >
          <WebhookStatusDot task={task} />
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-linear-text truncate">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-linear-textMuted truncate">
                {task.description}
              </p>
            )}
          </div>

          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>

          <select
            value={task.status}
            onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
            className="text-xs bg-linear-bg border border-linear-border rounded px-2 py-1 text-linear-text"
          >
            <option value="backlog">Backlog</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>

          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-linear-textMuted hover:text-linear-danger transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
