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
