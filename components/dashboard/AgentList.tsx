import Link from 'next/link';
import { AgentSession } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/cards/Card';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatDuration } from '@/lib/dateUtils';
import { Bot, ArrowRight } from 'lucide-react';

interface AgentListProps {
  agents: AgentSession[];
}

/**
 * Displays a list of active agents with their status and current task.
 */
export function AgentList({ agents }: AgentListProps) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader />
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <EmptyState />
        ) : (
          <AgentItems agents={agents} />
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-[#4ade80]" />
        Active Agents
      </CardTitle>
      <Link 
        href="/agents" 
        className="text-sm text-[#5e6ad2] hover:underline flex items-center gap-1"
      >
        Manage <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-[#8a8f98] text-sm">No active agents</p>
  );
}

interface AgentItemsProps {
  agents: AgentSession[];
}

function AgentItems({ agents }: AgentItemsProps) {
  return (
    <div className="space-y-3">
      {agents.map(renderAgentItem)}
    </div>
  );
}

function renderAgentItem(agent: AgentSession) {
  return (
    <div 
      key={agent.id}
      className="flex items-center gap-3 p-3 bg-[#0f1115] rounded-lg"
    >
      <StatusBadge status={agent.status} />
      <AgentInfo agent={agent} />
      <RuntimeDisplay runtime={agent.runtime} status={agent.status} />
    </div>
  );
}

interface AgentInfoProps {
  agent: AgentSession;
}

function AgentInfo({ agent }: AgentInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-[#f7f8f8]">{agent.name}</p>
      <p className="text-xs text-[#8a8f98] truncate">{agent.task}</p>
    </div>
  );
}

interface RuntimeDisplayProps {
  runtime: number;
  status: string;
}

function RuntimeDisplay({ runtime, status }: RuntimeDisplayProps) {
  if (status !== 'active' || runtime === 0) {
    return null;
  }

  return (
    <span className="text-xs text-[#8a8f98]">
      {formatDuration(runtime)}
    </span>
  );
}
