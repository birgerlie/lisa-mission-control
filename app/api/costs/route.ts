import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateMockCostData() {
  const agents = [
    { name: 'Code Review Agent', baseCost: 2.5 },
    { name: 'Task Planner', baseCost: 1.8 },
    { name: 'Documentation Writer', baseCost: 1.2 },
    { name: 'Test Generator', baseCost: 0.9 },
    { name: 'Bug Triager', baseCost: 0.6 },
    { name: 'Deployment Monitor', baseCost: 0.4 },
  ];

  // Generate daily costs for the last 30 days
  const dailyCosts = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Add some variance: weekdays are busier, with random spikes
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const baseMultiplier = isWeekday ? 1.0 : 0.4;
    const randomVariance = 0.6 + Math.random() * 0.8;
    const multiplier = baseMultiplier * randomVariance;

    const inputTokens = Math.round((150000 + Math.random() * 100000) * multiplier);
    const outputTokens = Math.round((40000 + Math.random() * 30000) * multiplier);
    // Pricing: $3/1M input tokens, $15/1M output tokens (Claude-like pricing)
    const cost = (inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000;

    dailyCosts.push({
      date: dateStr,
      inputTokens,
      outputTokens,
      cost: Math.round(cost * 100) / 100,
    });
  }

  // Generate per-agent breakdown
  const agentBreakdown = agents.map((agent) => {
    const variance = 0.7 + Math.random() * 0.6;
    const inputTokens = Math.round(agent.baseCost * 500000 * variance);
    const outputTokens = Math.round(agent.baseCost * 120000 * variance);
    const cost = (inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000;
    const sessions = Math.round(agent.baseCost * 20 * variance);

    return {
      agent: agent.name,
      inputTokens,
      outputTokens,
      cost: Math.round(cost * 100) / 100,
      sessions,
    };
  });

  // Sort by cost descending
  agentBreakdown.sort((a, b) => b.cost - a.cost);

  // Compute totals
  const totalCost = dailyCosts.reduce((sum, d) => sum + d.cost, 0);
  const totalInputTokens = dailyCosts.reduce((sum, d) => sum + d.inputTokens, 0);
  const totalOutputTokens = dailyCosts.reduce((sum, d) => sum + d.outputTokens, 0);
  const totalSessions = agentBreakdown.reduce((sum, a) => sum + a.sessions, 0);
  const avgDailyCost = totalCost / dailyCosts.length;

  return {
    dailyCosts,
    agentBreakdown,
    totals: {
      totalCost: Math.round(totalCost * 100) / 100,
      totalInputTokens,
      totalOutputTokens,
      totalSessions,
      avgDailyCost: Math.round(avgDailyCost * 100) / 100,
    },
  };
}

export async function GET() {
  try {
    const data = generateMockCostData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error generating cost data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate cost data' },
      { status: 500 }
    );
  }
}
