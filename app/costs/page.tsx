'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/classUtils';
import {
  DollarSign,
  TrendingUp,
  Coins,
  Users,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DailyCost {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface AgentCost {
  agent: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  sessions: number;
}

interface CostTotals {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalSessions: number;
  avgDailyCost: number;
}

interface CostData {
  dailyCosts: DailyCost[];
  agentBreakdown: AgentCost[];
  totals: CostTotals;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number): string {
  return value.toLocaleString();
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/costs');
      const json = await res.json();
      if (json.success) {
        setData({
          dailyCosts: json.dailyCosts,
          agentBreakdown: json.agentBreakdown,
          totals: json.totals,
        });
      } else {
        setError(json.error || 'Failed to fetch cost data');
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

  if (error || !data) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-linear-danger mx-auto mb-2" />
          <p className="text-linear-textMuted">{error || 'No data available'}</p>
          <button
            onClick={fetchCosts}
            className="mt-4 px-4 py-2 bg-linear-primary text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { dailyCosts, agentBreakdown, totals } = data;
  const maxDailyCost = Math.max(...dailyCosts.map((d) => d.cost));

  // Calculate trend (last 7 days vs previous 7 days)
  const last7 = dailyCosts.slice(-7).reduce((s, d) => s + d.cost, 0);
  const prev7 = dailyCosts.slice(-14, -7).reduce((s, d) => s + d.cost, 0);
  const trendPercent = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;
  const trendUp = trendPercent >= 0;

  const statCards = [
    {
      label: 'Total Spend',
      sublabel: 'This month',
      value: formatCurrency(totals.totalCost),
      icon: DollarSign,
      accent: 'text-linear-primary',
      accentBg: 'bg-linear-primary/20',
    },
    {
      label: 'Avg Daily Cost',
      sublabel: trendUp ? `+${trendPercent.toFixed(1)}% vs last week` : `${trendPercent.toFixed(1)}% vs last week`,
      value: formatCurrency(totals.avgDailyCost),
      icon: TrendingUp,
      accent: 'text-linear-success',
      accentBg: 'bg-linear-success/20',
    },
    {
      label: 'Total Tokens',
      sublabel: 'Input + Output',
      value: formatCompactTokens(totals.totalInputTokens + totals.totalOutputTokens),
      icon: Coins,
      accent: 'text-yellow-400',
      accentBg: 'bg-yellow-400/20',
    },
    {
      label: 'Total Sessions',
      sublabel: 'Across all agents',
      value: totals.totalSessions.toLocaleString(),
      icon: Users,
      accent: 'text-purple-400',
      accentBg: 'bg-purple-400/20',
    },
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-linear-text mb-1">Cost Tracking</h1>
        <p className="text-linear-textMuted">
          Monitor AI token usage and spending across agents
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="glass rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-linear-textMuted uppercase tracking-wider">
                {card.label}
              </span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.accentBg)}>
                <card.icon className={cn('w-4 h-4', card.accent)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-linear-text mb-1">{card.value}</p>
            <p className="text-xs text-linear-textMuted">{card.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Daily Cost Chart */}
      <div className="glass rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-linear-text">Daily Spending</h2>
            <p className="text-sm text-linear-textMuted">Last 30 days</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {trendUp ? (
              <ArrowUpRight className="w-4 h-4 text-linear-danger" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-linear-success" />
            )}
            <span className={trendUp ? 'text-linear-danger' : 'text-linear-success'}>
              {Math.abs(trendPercent).toFixed(1)}%
            </span>
            <span className="text-linear-textMuted ml-1">vs last week</span>
          </div>
        </div>

        <div className="flex items-end gap-1 h-48">
          {dailyCosts.map((day) => {
            const heightPercent = maxDailyCost > 0 ? (day.cost / maxDailyCost) * 100 : 0;
            const dateObj = new Date(day.date + 'T00:00:00');
            const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-linear-surface border border-linear-border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                    <p className="font-medium text-linear-text">{day.date}</p>
                    <p className="text-linear-textMuted">Cost: {formatCurrency(day.cost)}</p>
                    <p className="text-linear-textMuted">In: {formatTokens(day.inputTokens)}</p>
                    <p className="text-linear-textMuted">Out: {formatTokens(day.outputTokens)}</p>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    'w-full rounded-t transition-all duration-200 cursor-pointer',
                    isWeekend
                      ? 'bg-linear-primary/30 hover:bg-linear-primary/50'
                      : 'bg-linear-primary hover:bg-linear-primaryHover'
                  )}
                  style={{
                    height: `${Math.max(heightPercent, 2)}%`,
                    minHeight: '2px',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels (show every 5th day) */}
        <div className="flex gap-1 mt-2">
          {dailyCosts.map((day, i) => (
            <div key={day.date} className="flex-1 text-center">
              {i % 5 === 0 && (
                <span className="text-[10px] text-linear-textMuted">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Breakdown Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-6 border-b border-linear-border">
          <h2 className="text-lg font-semibold text-linear-text">Cost by Agent</h2>
          <p className="text-sm text-linear-textMuted">Breakdown of spending per agent</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-linear-border">
                <th className="text-left text-xs font-medium text-linear-textMuted uppercase tracking-wider px-6 py-3">
                  Agent
                </th>
                <th className="text-right text-xs font-medium text-linear-textMuted uppercase tracking-wider px-6 py-3">
                  Input Tokens
                </th>
                <th className="text-right text-xs font-medium text-linear-textMuted uppercase tracking-wider px-6 py-3">
                  Output Tokens
                </th>
                <th className="text-right text-xs font-medium text-linear-textMuted uppercase tracking-wider px-6 py-3">
                  Sessions
                </th>
                <th className="text-right text-xs font-medium text-linear-textMuted uppercase tracking-wider px-6 py-3">
                  Cost
                </th>
                <th className="text-right text-xs font-medium text-linear-textMuted uppercase tracking-wider px-6 py-3 w-32">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {agentBreakdown.map((agent) => {
                const totalAgentCost = agentBreakdown.reduce((s, a) => s + a.cost, 0);
                const sharePercent = totalAgentCost > 0 ? (agent.cost / totalAgentCost) * 100 : 0;

                return (
                  <tr
                    key={agent.agent}
                    className="border-b border-linear-border/50 hover:bg-linear-bg/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-linear-text">{agent.agent}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-linear-textMuted">
                        {formatTokens(agent.inputTokens)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-linear-textMuted">
                        {formatTokens(agent.outputTokens)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-linear-textMuted">{agent.sessions}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-linear-text">
                        {formatCurrency(agent.cost)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-linear-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-primary rounded-full"
                            style={{ width: `${sharePercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-linear-textMuted w-10 text-right">
                          {sharePercent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
