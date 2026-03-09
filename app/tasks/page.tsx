'use client';

import { useTasks, TaskStatus } from '@/hooks/useTasks';
import { TaskCreationForm } from '@/components/tasks/TaskCreationForm';
import { TaskList, TaskListView } from '@/components/tasks/TaskList';
import { WebhookSummary } from '@/components/webhook/WebhookStatusIndicator';
import { TaskStatus } from '@/hooks/useTasks';
import { Loader2, LayoutGrid, List, RefreshCw, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function TasksPage() {
  const { tasks, loading, error, createTask, updateTask, deleteTask, refreshTasks } = useTasks();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreateTask = async (input: { title: string; description?: string; priority?: 'high' | 'medium' | 'low'; assignee?: string }) => {
    await createTask(input);
  };

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    await updateTask(id, { status });
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTasks();
    setIsRefreshing(false);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Task Board</h1>
          <p className="text-linear-textMuted">Manage and track work items</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Webhook Status Summary */}
          <WebhookSummary tasks={tasks} />

          {/* View Toggle */}
          <div className="flex items-center bg-linear-surface rounded-lg p-1 border border-linear-border">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'board' 
                  ? 'bg-linear-primary text-white' 
                  : 'text-linear-textMuted hover:text-linear-text'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'list' 
                  ? 'bg-linear-primary text-white' 
                  : 'text-linear-textMuted hover:text-linear-text'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-linear-textMuted hover:text-linear-text transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Create Task Button */}
          <TaskCreationForm onSubmit={handleCreateTask} disabled={loading} />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-linear-danger/10 border border-linear-danger/20 rounded-lg flex items-center gap-3 text-linear-danger">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button 
            onClick={handleRefresh}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-linear-textMuted">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading tasks...</span>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-linear-surface rounded-full flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-linear-textMuted" />
          </div>
          <h3 className="text-lg font-medium text-linear-text mb-2">No tasks yet</h3>
          <p className="text-linear-textMuted max-w-sm">
            Get started by creating your first task. Tasks will be synced to Lisa via webhooks.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'board' ? (
            <TaskList
              tasks={tasks}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTask}
              showWebhookStatus
            />
          ) : (
            <div className="h-full overflow-y-auto pr-2">
              <TaskListView
                tasks={tasks}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteTask}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
