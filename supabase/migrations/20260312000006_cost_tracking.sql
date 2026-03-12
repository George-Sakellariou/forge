CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  agent_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cost_project ON cost_tracking(project_id, created_at DESC);
CREATE INDEX idx_cost_agent ON cost_tracking(agent_id, created_at DESC);
