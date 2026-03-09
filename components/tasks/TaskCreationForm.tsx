'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CreateTaskInput, Priority } from '@/hooks/useTasks';

interface TaskCreationFormProps {
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  disabled?: boolean;
}

export function TaskCreationForm({ onSubmit, disabled }: TaskCreationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('Lisa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignee: assignee.trim() || 'Lisa',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignee('Lisa');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover disabled:bg-linear-primary/50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-linear-surface rounded-xl p-6 w-[500px] max-w-[90vw] border border-linear-border shadow-2xl">
        <h3 className="text-lg font-semibold text-linear-text mb-4">Create New Task</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-linear-text mb-1">
              Title <span className="text-linear-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-lg text-linear-text placeholder-linear-textMuted focus:outline-none focus:border-linear-primary focus:ring-1 focus:ring-linear-primary"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-linear-text mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-lg text-linear-text placeholder-linear-textMuted focus:outline-none focus:border-linear-primary focus:ring-1 focus:ring-linear-primary resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-linear-text mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-lg text-linear-text focus:outline-none focus:border-linear-primary"
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-linear-text mb-1">
                Assignee
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Who will do this?"
                className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-lg text-linear-text placeholder-linear-textMuted focus:outline-none focus:border-linear-primary"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-linear-danger bg-linear-danger/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-linear-textMuted hover:text-linear-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover disabled:bg-linear-primary/50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
