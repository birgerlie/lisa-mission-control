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

-- Insert sample data
INSERT INTO tasks (title, description, status, priority, assignee, created_at, updated_at)
VALUES 
  ('Review Moltera AI pitch deck', 'Check the latest version of the pitch deck', 'backlog', 'high', 'Lisa', NOW(), NOW()),
  ('Research SiliconDB competitors', 'Find 3-5 main competitors in the RAG space', 'in-progress', 'high', 'Lisa', NOW() - INTERVAL '1 day', NOW()),
  ('Update HEARTBEAT.md with new tasks', 'Add the new monitoring tasks to heartbeat', 'done', 'medium', 'Lisa', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT DO NOTHING;
