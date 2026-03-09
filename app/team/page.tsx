'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/classUtils';
import { MissionInfo, TeamMember } from '@/lib/types';
import {
  Users,
  Target,
  Bot,
  Activity,
  Circle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function TeamPage() {
  const [missionInfo, setMissionInfo] = useState<MissionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) {
        setMissionInfo(data.team);
      } else {
        setError(data.error || 'Failed to fetch team');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

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
          <button onClick={fetchTeam} className="mt-4 px-4 py-2 bg-linear-primary text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!missionInfo) return null;

  const activeCount = missionInfo.team.filter(m => m.status === 'active').length;
  const idleCount = missionInfo.team.filter(m => m.status === 'idle').length;
  const lisa = missionInfo.team.find(m => m.name === 'Lisa');
  const otherMembers = missionInfo.team.filter(m => m.name !== 'Lisa');

  return (
    <div className="p-8 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-linear-text mb-1">Team</h1>
          <p className="text-linear-textMuted">
            {activeCount} active, {idleCount} idle
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-linear-surface border border-linear-border rounded-lg text-sm text-linear-textMuted">
          <Users className="w-4 h-4" />
          {missionInfo.team.length} members
        </div>
      </div>

      {/* Mission Statement Banner */}
      <div className="glass rounded-xl p-6 mb-8 border border-linear-primary/30 bg-linear-primary/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-primary/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-linear-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-linear-text mb-2">Mission Statement</h2>
            <p className="text-linear-textMuted leading-relaxed">{missionInfo.mission}</p>
          </div>
        </div>
      </div>

      {/* Lisa - Lead Card */}
      {lisa && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-linear-textMuted uppercase tracking-wider mb-4">Lead</h3>
          <div className="glass rounded-xl p-6 border border-linear-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-linear-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-7 h-7 text-linear-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-semibold text-linear-text">{lisa.name}</h3>
                  <StatusDot status={lisa.status} />
                </div>
                <p className="text-sm text-linear-textMuted mb-4">{lisa.role}</p>
                <div className="flex flex-wrap gap-2">
                  {lisa.capabilities.map(cap => (
                    <span
                      key={cap}
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-linear-primary/15 text-linear-primary border border-linear-primary/20"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
                {/* Lisa's top-level capabilities */}
                <div className="mt-4 pt-4 border-t border-linear-border">
                  <p className="text-xs font-medium text-linear-textMuted uppercase tracking-wider mb-2">Core Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {missionInfo.capabilities.map(cap => (
                      <span
                        key={cap}
                        className="px-2.5 py-1 text-xs rounded-full bg-linear-surface text-linear-textMuted border border-linear-border"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div>
        <h3 className="text-sm font-medium text-linear-textMuted uppercase tracking-wider mb-4">Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherMembers.map(member => (
            <MemberCard key={member.name} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          member.status === 'active' ? 'bg-linear-success/20' : 'bg-linear-textSecondary/20'
        )}>
          <Bot className={cn(
            "w-5 h-5",
            member.status === 'active' ? 'text-linear-success' : 'text-linear-textMuted'
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-linear-text truncate">{member.name}</h3>
            <StatusDot status={member.status} />
          </div>
          <p className="text-xs text-linear-textMuted mt-0.5 truncate">{member.role}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {member.capabilities.map(cap => (
          <span
            key={cap}
            className="px-2 py-0.5 text-xs rounded-full bg-linear-surface text-linear-textMuted border border-linear-border"
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: 'active' | 'idle' }) {
  return (
    <span className="flex items-center gap-1">
      <Circle
        className={cn(
          "w-2.5 h-2.5 fill-current",
          status === 'active' ? 'text-linear-success' : 'text-linear-textMuted'
        )}
      />
      <span className={cn(
        "text-xs",
        status === 'active' ? 'text-linear-success' : 'text-linear-textMuted'
      )}>
        {status === 'active' ? 'Active' : 'Idle'}
      </span>
    </span>
  );
}
