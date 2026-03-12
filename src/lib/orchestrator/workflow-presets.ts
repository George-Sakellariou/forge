import type { WorkflowStep } from "@/lib/types/workflow"

export interface WorkflowPreset {
  name: string
  description: string
  steps: WorkflowStep[]
}

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    name: "New Feature",
    description: "Full feature implementation: plan, architect, code, test, review",
    steps: [
      {
        id: "plan",
        agentRole: "lead",
        action: "Plan feature implementation",
        prompt: "Analyze the feature request and create a detailed implementation plan. Break it down into concrete tasks with dependencies. Identify which components need changes and what new files are needed.",
        dependsOn: [],
      },
      {
        id: "architect",
        agentRole: "architect",
        action: "Design architecture",
        prompt: "Based on the implementation plan, design the architecture. Define component boundaries, data flow, API contracts, and database schema changes if needed. Produce a clear technical specification.",
        dependsOn: ["plan"],
      },
      {
        id: "backend",
        agentRole: "backend",
        action: "Implement backend",
        prompt: "Implement the server-side code based on the architecture design. Create API routes, database queries, server actions, and business logic. Follow existing patterns in the codebase.",
        dependsOn: ["architect"],
      },
      {
        id: "frontend",
        agentRole: "frontend",
        action: "Implement frontend",
        prompt: "Implement the UI components and pages based on the architecture design. Use Server Components by default. Build responsive, accessible interfaces that follow the design system.",
        dependsOn: ["architect"],
      },
      {
        id: "test",
        agentRole: "tester",
        action: "Write tests",
        prompt: "Write comprehensive tests for the new feature. Include unit tests for utilities and hooks, component tests for UI, and integration tests for API routes. Aim for 80%+ coverage.",
        dependsOn: ["backend", "frontend"],
      },
      {
        id: "review",
        agentRole: "lead",
        action: "Code review",
        prompt: "Review all changes made for this feature. Check for code quality, security issues, RSC violations, performance concerns, and consistency with codebase patterns. Provide actionable feedback.",
        dependsOn: ["test"],
      },
    ],
  },
  {
    name: "Bug Fix",
    description: "Analyze, fix, test, and review a bug",
    steps: [
      {
        id: "analyze",
        agentRole: "lead",
        action: "Analyze bug",
        prompt: "Analyze the bug report. Reproduce the issue, identify the root cause, and determine what files and components are affected. Create a clear diagnosis with the fix approach.",
        dependsOn: [],
      },
      {
        id: "fix",
        agentRole: "backend",
        action: "Implement fix",
        prompt: "Implement the bug fix based on the analysis. Make minimal, focused changes. Ensure the fix addresses the root cause, not just the symptom.",
        dependsOn: ["analyze"],
      },
      {
        id: "test",
        agentRole: "tester",
        action: "Verify fix",
        prompt: "Write a regression test that covers the bug scenario. Verify the fix resolves the issue. Run the existing test suite to ensure no regressions.",
        dependsOn: ["fix"],
      },
      {
        id: "review",
        agentRole: "lead",
        action: "Review fix",
        prompt: "Review the bug fix and regression test. Verify the root cause was correctly identified and fixed. Check for side effects and ensure the fix is complete.",
        dependsOn: ["test"],
      },
    ],
  },
  {
    name: "Security Audit",
    description: "Full security review of the codebase",
    steps: [
      {
        id: "scan",
        agentRole: "security",
        action: "Security scan",
        prompt: "Perform a comprehensive security audit. Check for OWASP Top 10 vulnerabilities, hardcoded secrets, SQL injection, XSS, CSRF, auth bypass, and insecure configurations. Report all findings with severity levels.",
        dependsOn: [],
      },
      {
        id: "fix",
        agentRole: "backend",
        action: "Fix critical issues",
        prompt: "Fix all CRITICAL and HIGH severity security issues found in the audit. Implement proper input validation, output encoding, parameterized queries, and auth checks.",
        dependsOn: ["scan"],
      },
      {
        id: "verify",
        agentRole: "security",
        action: "Verify fixes",
        prompt: "Re-scan the codebase to verify all CRITICAL and HIGH issues are resolved. Check that fixes are complete and don't introduce new vulnerabilities.",
        dependsOn: ["fix"],
      },
    ],
  },
  {
    name: "Refactor",
    description: "Code refactoring with safety checks",
    steps: [
      {
        id: "analyze",
        agentRole: "architect",
        action: "Analyze code",
        prompt: "Analyze the target code for refactoring opportunities. Identify code smells, duplication, complex functions, tight coupling, and areas that would benefit from better abstractions. Create a refactoring plan.",
        dependsOn: [],
      },
      {
        id: "refactor",
        agentRole: "backend",
        action: "Refactor code",
        prompt: "Execute the refactoring plan. Make incremental, safe changes. Maintain behavior while improving structure. Keep changes focused and reviewable.",
        dependsOn: ["analyze"],
      },
      {
        id: "test",
        agentRole: "tester",
        action: "Verify no regressions",
        prompt: "Run the full test suite and verify no regressions from the refactoring. Add any missing tests for refactored code. Ensure coverage is maintained or improved.",
        dependsOn: ["refactor"],
      },
    ],
  },
]

export function getWorkflowPreset(name: string): WorkflowPreset | undefined {
  return WORKFLOW_PRESETS.find((p) => p.name === name)
}
