-- Mission Control Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in-progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  assignee TEXT NOT NULL DEFAULT 'Lisa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  webhook_attempts INTEGER DEFAULT 0,
  last_webhook_error TEXT,
  webhook_delivered_at TIMESTAMPTZ
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_webhook_attempts ON tasks(webhook_attempts);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_task_id ON webhook_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Function to increment webhook attempt (for atomic updates)
CREATE OR REPLACE FUNCTION increment_webhook_attempt(task_id UUID, error_msg TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE tasks
  SET 
    webhook_attempts = webhook_attempts + 1,
    last_webhook_error = error_msg,
    updated_at = NOW()
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow all access for service role (server-side)
CREATE POLICY "Allow all access for service role" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access for service role" ON webhook_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Cron jobs table
CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,
  command TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job history table
CREATE TABLE IF NOT EXISTS job_history (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES cron_jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'error', 'completed')),
  task TEXT NOT NULL,
  runtime INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER,
  parent_session TEXT,
  logs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cron_jobs_status ON cron_jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON job_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_timestamp ON job_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_cron_jobs_updated_at ON cron_jobs;
CREATE TRIGGER update_cron_jobs_updated_at
  BEFORE UPDATE ON cron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_sessions_updated_at ON agent_sessions;
CREATE TRIGGER update_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for new tables
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for service role" ON cron_jobs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access for service role" ON job_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access for service role" ON agent_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO tasks (title, description, status, priority, assignee, created_at, updated_at)
VALUES 
  ('Review Moltera AI pitch deck', 'Check the latest version of the pitch deck', 'backlog', 'high', 'Lisa', NOW(), NOW()),
  ('Research SiliconDB competitors', 'Find 3-5 main competitors in the RAG space', 'in-progress', 'high', 'Lisa', NOW() - INTERVAL '1 day', NOW()),
  ('Update HEARTBEAT.md with new tasks', 'Add the new monitoring tasks to heartbeat', 'done', 'medium', 'Lisa', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample cron jobs
INSERT INTO cron_jobs (name, schedule, command, status, last_run, next_run)
VALUES
  ('Morning Briefing', '0 8 * * *', 'generate-daily-brief', 'active', NOW() - INTERVAL '16 hours', NOW() + INTERVAL '8 hours'),
  ('Email Check', '*/30 * * * *', 'check-emails', 'active', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '15 minutes'),
  ('Weekly Report', '0 9 * * 1', 'generate-weekly-report', 'paused', NULL, NULL),
  ('Memory Cleanup', '0 2 * * 0', 'cleanup-old-memories', 'active', NOW() - INTERVAL '4 days', NOW() + INTERVAL '3 days'),
  ('System Health Check', '0 */6 * * *', 'health-check', 'active', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Insert sample agent sessions
INSERT INTO agent_sessions (name, status, task, runtime, start_time, progress, parent_session, logs)
VALUES
  ('Research Agent', 'active', 'Analyzing competitor landscape', 2456000, NOW() - INTERVAL '41 minutes', 67, 'main', ARRAY['Starting research...', 'Found 12 competitors', 'Analyzing features...']),
  ('Code Review Agent', 'completed', 'Reviewing PR #42', 189000, NOW() - INTERVAL '3 minutes', 100, 'main', ARRAY['Starting code review...', 'Analyzed 15 files', 'No issues found']),
  ('Documentation Agent', 'idle', 'Waiting for tasks', 0, NOW(), NULL, NULL, ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;
