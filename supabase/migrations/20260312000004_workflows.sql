CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  current_step TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workflows_project ON workflows(project_id, status);
