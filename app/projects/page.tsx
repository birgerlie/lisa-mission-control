'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/classUtils';
import {
  FolderKanban,
  Plus,
  Loader2,
  AlertCircle,
  MoreVertical,
  Trash2,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  progress: number;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
}

const STATUS_OPTIONS: Project['status'][] = ['active', 'on-hold', 'completed', 'archived'];

const STATUS_CONFIG: Record<Project['status'], { className: string; label: string }> = {
  active: { className: 'bg-linear-success/20 text-linear-success', label: 'Active' },
  'on-hold': { className: 'bg-linear-warning/20 text-linear-warning', label: 'On Hold' },
  completed: { className: 'bg-linear-primary/20 text-linear-primary', label: 'Completed' },
  archived: { className: 'bg-linear-textMuted/20 text-linear-textMuted', label: 'Archived' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState('');

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<Project['status']>('active');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects([data.project, ...projects]);
        setShowCreateModal(false);
        setNewName('');
        setNewDescription('');
        setNewStatus('active');
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch {
      setError('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (projectId: string, status: Project['status']) => {
    // Optimistic update
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, status } : p
    ));
    setMenuOpenId(null);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchProjects();
      }
    } catch {
      fetchProjects();
    }
  };

  const updateProgress = async (projectId: string) => {
    const value = Math.min(100, Math.max(0, parseInt(progressValue) || 0));
    // Optimistic update
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, progress: value } : p
    ));
    setEditingProgressId(null);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: value }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchProjects();
      }
    } catch {
      fetchProjects();
    }
  };

  const deleteProject = async (projectId: string) => {
    // Optimistic update
    setProjects(projects.filter(p => p.id !== projectId));
    setMenuOpenId(null);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        fetchProjects();
      }
    } catch {
      fetchProjects();
    }
  };

  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-linear-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-linear-danger mx-auto mb-2" />
          <p className="text-linear-textMuted">{error}</p>
          <button
            onClick={() => { setError(null); fetchProjects(); }}
            className="mt-4 px-4 py-2 bg-linear-primary text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Projects</h1>
          <p className="text-linear-textMuted">
            {projects.length} projects &middot; {activeCount} active &middot; {completedCount} completed
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FolderKanban className="w-12 h-12 text-linear-textMuted mb-4" />
          <p className="text-linear-textMuted text-lg mb-2">No projects yet</p>
          <p className="text-linear-textMuted text-sm mb-6">Create your first project to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="glass rounded-xl p-5 card-hover relative">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    STATUS_CONFIG[project.status].className.replace(/text-/, 'bg-').replace(/\/20/, '/10'),
                  )}>
                    <FolderKanban className={cn(
                      'w-5 h-5',
                      project.status === 'active' ? 'text-linear-success' :
                      project.status === 'on-hold' ? 'text-linear-warning' :
                      project.status === 'completed' ? 'text-linear-primary' :
                      'text-linear-textMuted'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-linear-text truncate">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                    className="text-linear-textMuted hover:text-linear-text p-1"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpenId === project.id && (
                    <div className="absolute right-0 top-8 bg-linear-surface border border-linear-border rounded-lg shadow-xl z-10 py-1 w-44">
                      <p className="px-3 py-1.5 text-xs text-linear-textMuted font-medium">Set status</p>
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(project.id, s)}
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-sm hover:bg-linear-bg transition-colors',
                            project.status === s ? 'text-linear-primary' : 'text-linear-text'
                          )}
                        >
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                      <div className="border-t border-linear-border my-1" />
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="w-full text-left px-3 py-1.5 text-sm text-linear-danger hover:bg-linear-danger/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-linear-textMuted mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-linear-textMuted">Progress</span>
                  {editingProgressId === project.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); updateProgress(project.id); }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={progressValue}
                        onChange={(e) => setProgressValue(e.target.value)}
                        className="w-14 px-1.5 py-0.5 bg-linear-bg border border-linear-border rounded text-xs text-linear-text text-right"
                        autoFocus
                        onBlur={() => updateProgress(project.id)}
                      />
                      <span className="text-xs text-linear-textMuted">%</span>
                    </form>
                  ) : (
                    <button
                      onClick={() => { setEditingProgressId(project.id); setProgressValue(String(project.progress)); }}
                      className="text-xs text-linear-textMuted hover:text-linear-text transition-colors"
                    >
                      {project.progress}%
                    </button>
                  )}
                </div>
                <div className="h-1.5 bg-linear-bg rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      project.status === 'completed' ? 'bg-linear-success' : 'bg-linear-primary'
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-linear-textMuted pt-2 border-t border-linear-border/50">
                <span>{project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}</span>
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-linear-surface rounded-xl w-[480px] border border-linear-border" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-linear-border">
              <h2 className="text-lg font-semibold text-linear-text">Create Project</h2>
              <p className="text-sm text-linear-textMuted mt-1">Add a new project to track work</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-linear-text mb-1.5">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  className="w-full px-3 py-2 bg-linear-bg border border-linear-border rounded-lg text-sm text-linear-text placeholder:text-linear-textMuted focus:outline-none focus:border-linear-primary"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-linear-text mb-1.5">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 bg-linear-bg border border-linear-border rounded-lg text-sm text-linear-text placeholder:text-linear-textMuted focus:outline-none focus:border-linear-primary resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-linear-text mb-1.5">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Project['status'])}
                  className="w-full px-3 py-2 bg-linear-bg border border-linear-border rounded-lg text-sm text-linear-text focus:outline-none focus:border-linear-primary"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-linear-border flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-linear-textMuted hover:text-linear-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newName.trim() || creating}
                className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpenId && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5', config.className)}>
      {config.label}
    </span>
  );
}
