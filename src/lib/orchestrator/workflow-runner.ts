import type { WorkflowStep } from "@/lib/types/workflow"

/**
 * Executes workflow DAGs step by step.
 * Tracks completed, failed, and skipped steps separately.
 */
export class WorkflowRunner {
  private steps: WorkflowStep[]
  private completedSteps = new Set<string>()
  private failedSteps = new Set<string>()
  private skippedSteps = new Set<string>()

  constructor(steps: WorkflowStep[]) {
    this.steps = steps
  }

  getReadySteps(): WorkflowStep[] {
    return this.steps.filter(
      (step) =>
        !this.completedSteps.has(step.id) &&
        !this.failedSteps.has(step.id) &&
        !this.skippedSteps.has(step.id) &&
        step.dependsOn.every((dep) => this.completedSteps.has(dep)),
    )
  }

  markCompleted(stepId: string): void {
    this.completedSteps.add(stepId)
  }

  markFailed(stepId: string): void {
    this.failedSteps.add(stepId)
    // Skip any steps that depend on this failed step
    for (const step of this.steps) {
      if (step.dependsOn.includes(stepId)) {
        this.markSkipped(step.id)
      }
    }
  }

  markSkipped(stepId: string): void {
    if (this.skippedSteps.has(stepId)) return
    this.skippedSteps.add(stepId)
    // Cascade: skip steps that depend on skipped steps
    for (const step of this.steps) {
      if (step.dependsOn.includes(stepId)) {
        this.markSkipped(step.id)
      }
    }
  }

  get isFinished(): boolean {
    const resolved = this.completedSteps.size + this.failedSteps.size + this.skippedSteps.size
    return resolved === this.steps.length
  }

  get hasFailures(): boolean {
    return this.failedSteps.size > 0
  }

  get progress(): number {
    if (this.steps.length === 0) return 100
    return Math.round((this.completedSteps.size / this.steps.length) * 100)
  }

  get summary() {
    return {
      total: this.steps.length,
      completed: this.completedSteps.size,
      failed: this.failedSteps.size,
      skipped: this.skippedSteps.size,
    }
  }
}
