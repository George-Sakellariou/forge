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

      <WorkflowCanvas projectId={projectId} />
    </div>
  )
}
