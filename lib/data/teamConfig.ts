import { MissionInfo } from '../types';

export const teamConfig: MissionInfo = {
  name: 'Lisa',
  role: 'Chief AI Assistant',
  mission: 'Build an autonomous organization of AI agents that produce value 24/7, helping Birger stay organized, productive, and always moving forward on key projects.',
  capabilities: [
    'Task management & prioritization',
    'Research & analysis',
    'Code review & development',
    'Document creation & organization',
    'Scheduled automation via cron jobs',
    'Memory management & context retention',
    'Webhook-driven task orchestration',
  ],
  team: [
    {
      name: 'Lisa',
      role: 'Chief AI Assistant - Orchestrator & strategist',
      capabilities: ['Task orchestration', 'Strategic planning', 'Communication', 'Research'],
      status: 'active',
    },
    {
      name: 'Research Agent',
      role: 'Deep research & competitive analysis',
      capabilities: ['Web research', 'Data analysis', 'Report generation'],
      status: 'active',
    },
    {
      name: 'Code Review Agent',
      role: 'Code quality & PR reviews',
      capabilities: ['Code analysis', 'Bug detection', 'Best practices'],
      status: 'idle',
    },
    {
      name: 'Documentation Agent',
      role: 'Documentation & content creation',
      capabilities: ['Technical writing', 'API docs', 'Newsletters'],
      status: 'idle',
    },
  ],
};
