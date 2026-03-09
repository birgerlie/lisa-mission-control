-- Agent Sessions Table for Mission Control
-- This enables real agent monitoring and management

-- Agent sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'error', 'completed')),
  task TEXT NOT NULL,
  runtime INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  parent_session UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
  logs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_parent ON agent_sessions(parent_session);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agent_sessions_updated_at ON agent_sessions;
CREATE TRIGGER update_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_sessions_updated_at();

-- Insert sample agent sessions
INSERT INTO agent_sessions (name, status, task, runtime, progress, logs)
VALUES 
  ('Research Agent', 'active', 'Analyzing competitor landscape for Moltera', 2456, 67, '["Starting research...", "Found 12 competitors", "Analyzing features..."]'),
  ('Code Review Agent', 'completed', 'Reviewing PR #42', 189, 100, '["Starting code review...", "Analyzed 15 files", "No issues found"]'),
  ('Documentation Agent', 'idle', 'Waiting for tasks', 0, 0, '[]'),
  ('SiliconDB Monitor', 'active', 'Monitoring SiliconDB cluster health', 86400, 45, '["Cluster healthy", "3 nodes active", "CPU: 45%", "Memory: 60%"]')
ON CONFLICT DO NOTHING;
