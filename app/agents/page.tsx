'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/classUtils';
import { formatDuration } from '@/lib/dateUtils';
import {
  Bot,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Activity,
  Clock,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AgentSession {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'completed';
  task: string;
  runtime: number;
  startTime: string;
  progress?: number;
  parentSession?: string;
  logs?: string[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      } else {
        setError(data.error || 'Failed to fetch agents');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const killSession = async (agentId: string) => {
    // Optimistic update
    setAgents(agents.map(agent =>
      agent.id === agentId ? { ...agent, status: 'completed' as const } : agent
    ));

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchAgents(); // Revert by refetching
      }
    } catch {
      fetchAgents();
    }
  };

  const restartSession = async (agentId: string) => {
    // Optimistic update
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? { ...agent, status: 'active' as const, runtime: 0, startTime: new Date().toISOString() }
        : agent
    ));

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', runtime: 0 }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchAgents();
      }
    } catch {
      fetchAgents();
    }
  };

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

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
          <button onClick={fetchAgents} className="mt-4 px-4 py-2 bg-linear-primary text-white rounded-lg text-sm">
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
          <h1 className="text-2xl font-bold text-linear-text mb-1">Agent Monitor</h1>
          <p className="text-linear-textMuted">
            {activeAgents} active, {idleAgents} idle, {errorAgents} errors
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover text-white rounded-lg text-sm font-medium transition-colors">
          <Bot className="w-4 h-4" />
          Spawn New Agent
        </button>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className="glass rounded-xl p-5 cursor-pointer card-hover"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  agent.status === 'active' ? 'bg-linear-success/20' :
                  agent.status === 'idle' ? 'bg-linear-textSecondary/20' :
                  agent.status === 'error' ? 'bg-linear-danger/20' :
                  'bg-linear-primary/20'
                )}>
                  <Bot className={cn(
                    "w-5 h-5",
                    agent.status === 'active' ? 'text-linear-success' :
                    agent.status === 'idle' ? 'text-linear-textMuted' :
                    agent.status === 'error' ? 'text-linear-danger' :
                    'text-linear-primary'
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold text-linear-text">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={agent.status} />
                    {agent.status === 'active' && agent.progress !== undefined && (
                      <span className="text-xs text-linear-textMuted">{agent.progress}%</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="text-linear-textMuted hover:text-linear-text">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-linear-textMuted mb-4 line-clamp-2">
              {agent.task}
            </p>

            <div className="flex items-center justify-between text-xs text-linear-textMuted">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {agent.status === 'active'
                  ? formatDuration(agent.runtime)
                  : agent.status === 'completed'
                    ? 'Completed'
                    : 'Idle'
                }
              </div>
              {agent.progress !== undefined && (
                <div className="flex items-center gap-2 flex-1 mx-4">
                  <div className="flex-1 h-1 bg-linear-bg rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        agent.status === 'error' ? 'bg-linear-danger' : 'bg-linear-primary'
                      )}
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <div className="bg-linear-surface rounded-xl w-[700px] max-h-[80vh] overflow-hidden border border-linear-border" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-linear-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    selectedAgent.status === 'active' ? 'bg-linear-success/20' :
                    selectedAgent.status === 'idle' ? 'bg-linear-textSecondary/20' :
                    selectedAgent.status === 'error' ? 'bg-linear-danger/20' :
                    'bg-linear-primary/20'
                  )}>
                    <Bot className={cn(
                      "w-6 h-6",
                      selectedAgent.status === 'active' ? 'text-linear-success' :
                      selectedAgent.status === 'idle' ? 'text-linear-textMuted' :
                      selectedAgent.status === 'error' ? 'text-linear-danger' :
                      'text-linear-primary'
                    )} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-linear-text">{selectedAgent.name}</h3>
                    <p className="text-sm text-linear-textMuted">ID: {selectedAgent.id}</p>
                  </div>
                </div>
                <StatusBadge status={selectedAgent.status} />
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-linear-bg rounded-lg p-4">
                  <p className="text-xs text-linear-textMuted mb-1">Current Task</p>
                  <p className="text-sm text-linear-text">{selectedAgent.task}</p>
                </div>
                <div className="bg-linear-bg rounded-lg p-4">
                  <p className="text-xs text-linear-textMuted mb-1">Runtime</p>
                  <p className="text-sm text-linear-text">{formatDuration(selectedAgent.runtime)}</p>
                </div>
                <div className="bg-linear-bg rounded-lg p-4">
                  <p className="text-xs text-linear-textMuted mb-1">Started At</p>
                  <p className="text-sm text-linear-text">{new Date(selectedAgent.startTime).toLocaleString()}</p>
                </div>
                <div className="bg-linear-bg rounded-lg p-4">
                  <p className="text-xs text-linear-textMuted mb-1">Parent Session</p>
                  <p className="text-sm text-linear-text">{selectedAgent.parentSession || 'None'}</p>
                </div>
              </div>

              {selectedAgent.progress !== undefined && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-linear-text">Progress</p>
                    <span className="text-sm text-linear-textMuted">{selectedAgent.progress}%</span>
                  </div>
                  <div className="h-2 bg-linear-bg rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        selectedAgent.status === 'error' ? 'bg-linear-danger' : 'bg-linear-primary'
                      )}
                      style={{ width: `${selectedAgent.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedAgent.logs && selectedAgent.logs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-linear-text mb-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Recent Logs
                  </h4>
                  <div className="bg-linear-bg rounded-lg p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                    {selectedAgent.logs.map((log, i) => (
                      <div key={i} className="text-linear-textMuted">
                        <span className="text-linear-textSecondary">[{new Date().toLocaleTimeString()}]</span>{' '}
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-linear-border flex justify-between">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 text-sm text-linear-textMuted hover:text-linear-text"
              >
                Close
              </button>
              <div className="flex gap-2">
                {selectedAgent.status === 'active' && (
                  <button
                    onClick={() => killSession(selectedAgent.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-linear-danger/20 hover:bg-linear-danger/30 text-linear-danger rounded-lg text-sm font-medium transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    Kill Session
                  </button>
                )}
                {(selectedAgent.status === 'completed' || selectedAgent.status === 'error') && (
                  <button
                    onClick={() => restartSession(selectedAgent.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-linear-primary hover:bg-linear-primaryHover text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { icon: Activity, className: 'bg-linear-success/20 text-linear-success', label: 'Active' },
    idle: { icon: PauseCircle, className: 'bg-linear-textSecondary/20 text-linear-textMuted', label: 'Idle' },
    error: { icon: AlertTriangle, className: 'bg-linear-danger/20 text-linear-danger', label: 'Error' },
    completed: { icon: CheckCircle2, className: 'bg-linear-primary/20 text-linear-primary', label: 'Completed' },
  };

  const { icon: Icon, className, label } = config[status as keyof typeof config];

  return (
    <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
