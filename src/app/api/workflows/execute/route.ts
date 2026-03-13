import { NextResponse } from "next/server"
import { findWorkflowById, updateWorkflowStatus } from "@/lib/db/workflows"
import { findAllAgents } from "@/lib/db/agents"
import { WorkflowRunner } from "@/lib/orchestrator/workflow-runner"
import { agentPool } from "@/lib/orchestrator/agent-pool"
import { eventBus } from "@/lib/orchestrator/event-bus"
import { validateWorkingDirectory } from "@/lib/tools/safety"
import type { Agent } from "@/lib/types/agent"
import type { WorkflowStep } from "@/lib/types/workflow"
import { z } from "zod/v4"

const ExecuteSchema = z.object({
  workflowId: z.string().uuid(),
  workingDirectory: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = ExecuteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  const { workflowId, workingDirectory } = parsed.data

  const dirCheck = validateWorkingDirectory(workingDirectory)
  if (!dirCheck.allowed) {
    return NextResponse.json({ success: false, error: dirCheck.reason }, { status: 403 })
  }

  const workflow = await findWorkflowById(workflowId)
  if (!workflow) {
    return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
  }

  const agents = await findAllAgents()
  const agentsByRole = new Map<string, Agent>()
  for (const agent of agents) {
    agentsByRole.set(agent.role, agent)
  }

  const steps = workflow.steps as WorkflowStep[]
  const runner = new WorkflowRunner(steps)

  await updateWorkflowStatus(workflowId, "running")

  eventBus.publish("workflow:started", {
    workflowName: workflow.name,
    stepCount: steps.length,
  }, { projectId: workflow.projectId })

  // Execute asynchronously
  executeWorkflowSteps(runner, steps, agentsByRole, workingDirectory, workflow.projectId, workflowId)

  return NextResponse.json({
    success: true,
    data: { workflowId, status: "running", totalSteps: steps.length },
  })
}

/** Max chars of previous step output to pass as context to the next step */
const MAX_STEP_CONTEXT_CHARS = 8000

/** Trim step output for handoff — keep beginning and end for key decisions/conclusions */
function trimStepOutput(output: string): string {
  if (output.length <= MAX_STEP_CONTEXT_CHARS) return output
  const half = Math.floor(MAX_STEP_CONTEXT_CHARS / 2)
  return (
    output.slice(0, half) +
    "\n\n... [middle trimmed for token efficiency] ...\n\n" +
    output.slice(-half)
  )
}

async function executeWorkflowSteps(
  runner: WorkflowRunner,
  steps: WorkflowStep[],
  agentsByRole: Map<string, Agent>,
  workingDirectory: string,
  projectId: string,
  workflowId: string,
) {
  const stepOutputs = new Map<string, string>()

  while (!runner.isFinished) {
    const readySteps = runner.getReadySteps()
    if (readySteps.length === 0) break

    const promises = readySteps.map(async (step) => {
      const agent = agentsByRole.get(step.agentRole)
      if (!agent) {
        runner.markSkipped(step.id)
        eventBus.publish("workflow:step_skipped", {
          stepId: step.id,
          agentRole: step.agentRole,
          reason: `No agent found for role "${step.agentRole}"`,
        }, { projectId })
        return
      }

      // Cap context from previous steps to prevent token explosion in handoffs
      const depContext = step.dependsOn
        .map((depId) => stepOutputs.get(depId))
        .filter((v): v is string => Boolean(v))
        .map(trimStepOutput)
        .join("\n\n---\n\n")

      const fullPrompt = depContext
        ? `Context from previous steps:\n${depContext}\n\n---\n\nYour task: ${step.prompt}`
        : step.prompt

      await updateWorkflowStatus(workflowId, "running", step.id)

      return new Promise<void>((resolve) => {
        let output = ""

        agentPool.runAgent({
          agent,
          message: fullPrompt,
          workingDirectory,
          projectId,
          onEvent: (event) => {
            if (event.type === "text_delta") {
              output += event.data.text as string
            }
            if (event.type === "loop_complete") {
              stepOutputs.set(step.id, output)
              runner.markCompleted(step.id)

              eventBus.publish("workflow:step_complete", {
                stepId: step.id,
                agentRole: step.agentRole,
                agentName: agent.name,
                progress: runner.progress,
              }, { projectId, agentId: agent.id })

              resolve()
            }
            if (event.type === "error") {
              runner.markFailed(step.id)
              eventBus.publish("workflow:step_failed", {
                stepId: step.id,
                agentRole: step.agentRole,
                agentName: agent.name,
                error: event.data.error,
              }, { projectId, agentId: agent.id })
              resolve()
            }
          },
        })
      })
    })

    await Promise.all(promises)
  }

  const finalStatus = runner.hasFailures ? "failed" : "completed"
  await updateWorkflowStatus(workflowId, finalStatus, null)

  eventBus.publish(
    finalStatus === "completed" ? "workflow:completed" : "workflow:failed",
    { workflowId, progress: runner.progress, ...runner.summary },
    { projectId },
  )
}
