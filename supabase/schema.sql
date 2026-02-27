-- OnTheWay Supabase Schema
-- Run this in Supabase SQL Editor

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  api_key TEXT NOT NULL DEFAULT ('otw_' || encode(gen_random_bytes(16), 'hex')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'manual' CHECK (trigger IN ('auto', 'manual', 'first-visit')),
  steps JSONB NOT NULL DEFAULT '[]',
  targeting JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);

-- Task completions (analytics)
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  steps_completed INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_completions_task ON task_completions(task_id);
CREATE INDEX idx_completions_visitor ON task_completions(visitor_id);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Projects: users can only access their own
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks: users can access tasks in their projects
CREATE POLICY "Users can view tasks in own projects" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert tasks in own projects" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update tasks in own projects" ON tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete tasks in own projects" ON tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

-- Completions: public insert, owner read
CREATE POLICY "Anyone can insert completions" ON task_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view completions" ON task_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      JOIN projects ON projects.id = tasks.project_id 
      WHERE tasks.id = task_completions.task_id AND projects.user_id = auth.uid()
    )
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- User plans & usage tracking
CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- '2025-02'
  sdk_views INTEGER NOT NULL DEFAULT 0,
  projects_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, month)
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON usage_records FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER user_plans_updated_at BEFORE UPDATE ON user_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
