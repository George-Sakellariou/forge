"use client"

import { WorkflowCanvas } from "@/components/workflow/workflow-canvas"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WorkflowPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Define and execute multi-step agent workflows
          </p>
        </div>
      </div>

      <WorkflowCanvas projectId={projectId} onExecute={async (steps, workingDirectory) => {
        try {
          // First create the workflow
          const createRes = await fetch("/api/workflows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              name: `Workflow ${new Date().toLocaleTimeString()}`,
              steps,
            }),
          })
          const createJson = await createRes.json()
          if (!createJson.success) return

          // Then execute it
          await fetch("/api/workflows/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflowId: createJson.data.id,
              workingDirectory: workingDirectory || "/tmp/forge-workflow",
            }),
          })
        } catch {
          // Handle error
        }
      }} />
    </div>
  )
}
