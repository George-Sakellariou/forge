import { eventBus } from "./event-bus"
import type { WorkflowStep } from "@/lib/types/workflow"

/**
 * Executes workflow DAGs step by step.
 * Phase 3: Full DAG execution with parallel steps, dependency resolution, pause/resume.
 */
export class WorkflowRunner {
  private steps: WorkflowStep[]
  private completedSteps = new Set<string>()

  constructor(steps: WorkflowStep[]) {
    this.steps = steps
  }

  getReadySteps(): WorkflowStep[] {
    return this.steps.filter(
      (step) =>
        !this.completedSteps.has(step.id) &&
        step.dependsOn.every((dep) => this.completedSteps.has(dep)),
    )
  }

  markCompleted(stepId: string): void {
    this.completedSteps.add(stepId)
  }

  get isComplete(): boolean {
    return this.completedSteps.size === this.steps.length
  }

  get progress(): number {
    if (this.steps.length === 0) return 100
    return Math.round((this.completedSteps.size / this.steps.length) * 100)
  }
}
