import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

  // Safety
  const dirCheck = validateWorkingDirectory(workingDirectory)
  if (!dirCheck.allowed) {
    return NextResponse.json({ success: false, error: dirCheck.reason }, { status: 403 })
  }

  const supabase = await createClient()

  // Fetch workflow
  const { data: workflow, error: wfError } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .single()

  if (wfError || !workflow) {
    return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
  }

  // Fetch all agents
  const { data: agents, error: agError } = await supabase.from("agents").select("*")

  if (agError || !agents) {
    return NextResponse.json({ success: false, error: "Failed to load agents" }, { status: 500 })
  }

  const agentsByRole = new Map<string, Agent>()
  for (const row of agents) {
    const agent: Agent = {
      id: row.id,
      name: row.name,
      role: row.role,
      systemPrompt: row.system_prompt,
      model: row.model,
      tools: row.tools || [],
      mcpServers: row.mcp_servers || [],
      config: row.config || {},
      isBuiltin: row.is_builtin,
      createdAt: row.created_at,
    }
    agentsByRole.set(agent.role, agent)
  }

  const steps = workflow.steps as WorkflowStep[]
  const runner = new WorkflowRunner(steps)

  // Update workflow status
  await supabase
    .from("workflows")
    .update({ status: "running" })
    .eq("id", workflowId)

  eventBus.publish("workflow:started", {
    workflowName: workflow.name,
    stepCount: steps.length,
  }, { projectId: workflow.project_id })

  // Execute steps asynchronously
  executeWorkflowSteps(runner, steps, agentsByRole, workingDirectory, workflow.project_id, workflowId, supabase)

  return NextResponse.json({
    success: true,
    data: {
      workflowId,
      status: "running",
      totalSteps: steps.length,
    },
  })
}

async function executeWorkflowSteps(
  runner: WorkflowRunner,
  steps: WorkflowStep[],
  agentsByRole: Map<string, Agent>,
  workingDirectory: string,
  projectId: string,
  workflowId: string,
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
) {
  const stepOutputs = new Map<string, string>()

  while (!runner.isComplete) {
    const readySteps = runner.getReadySteps()

    if (readySteps.length === 0) {
      // Deadlock or all remaining steps have unresolved dependencies
      break
    }

    // Execute ready steps (potentially in parallel)
    const promises = readySteps.map(async (step) => {
      const agent = agentsByRole.get(step.agentRole)
      if (!agent) {
        eventBus.publish("agent:error", {
          error: `No agent found for role: ${step.agentRole}`,
          stepId: step.id,
        }, { projectId })
        runner.markCompleted(step.id)
        return
      }

      // Build context from dependency outputs
      const depContext = step.dependsOn
        .map((depId) => stepOutputs.get(depId))
        .filter(Boolean)
        .join("\n\n---\n\n")

      const fullPrompt = depContext
        ? `Context from previous steps:\n${depContext}\n\n---\n\nYour task: ${step.prompt}`
        : step.prompt

      await supabase
        .from("workflows")
        .update({ current_step: step.id })
        .eq("id", workflowId)

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
              runner.markCompleted(step.id)
              resolve()
            }
          },
        })
      })
    })

    await Promise.all(promises)
  }

  // Update workflow as completed
  const finalStatus = runner.isComplete ? "completed" : "failed"
  await supabase
    .from("workflows")
    .update({ status: finalStatus, current_step: null })
    .eq("id", workflowId)

  eventBus.publish(
    finalStatus === "completed" ? "workflow:completed" : "workflow:failed",
    { workflowId, progress: runner.progress },
    { projectId },
  )
}
