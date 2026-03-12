import type { AgentRole } from "@/lib/types/agent"

/**
 * Maps task types to appropriate agent roles.
 * Phase 2: Full task routing with dependency resolution and priority queuing.
 */

const TASK_TYPE_TO_ROLE: Record<string, AgentRole> = {
  architecture: "architect",
  design: "architect",
  "task-breakdown": "lead",
  "code-review": "lead",
  "backend-implementation": "backend",
  api: "backend",
  database: "backend",
  "frontend-implementation": "frontend",
  ui: "frontend",
  styling: "frontend",
  "unit-test": "tester",
  "integration-test": "tester",
  e2e: "e2e",
  "security-audit": "security",
  deployment: "devops",
  ci: "devops",
  docker: "devops",
}

export function resolveAgentRole(taskType: string): AgentRole {
  return TASK_TYPE_TO_ROLE[taskType] || "backend"
}
