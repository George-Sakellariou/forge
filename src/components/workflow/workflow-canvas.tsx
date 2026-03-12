"use client"

import { useState } from "react"
import { WorkflowNode } from "./workflow-node"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WORKFLOW_PRESETS, type WorkflowPreset } from "@/lib/orchestrator/workflow-presets"
import type { WorkflowStep } from "@/lib/types/workflow"
import { ArrowDown, Play, Pause, RotateCcw } from "lucide-react"

interface WorkflowCanvasProps {
  projectId?: string
  onExecute?: (steps: WorkflowStep[], workingDirectory: string) => void
}

export function WorkflowCanvas({ onExecute }: WorkflowCanvasProps) {
  const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset | null>(null)
  const [stepStatuses, setStepStatuses] = useState<Record<string, "pending" | "running" | "completed" | "failed">>({})
  const [isRunning, setIsRunning] = useState(false)

  const handleSelectPreset = (preset: WorkflowPreset) => {
    setSelectedPreset(preset)
    const statuses: Record<string, "pending" | "running" | "completed" | "failed"> = {}
    for (const step of preset.steps) {
      statuses[step.id] = "pending"
    }
    setStepStatuses(statuses)
  }

  return (
    <div className="space-y-6">
      {/* Preset selector */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Workflow Templates</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {WORKFLOW_PRESETS.map((preset) => (
            <Card
              key={preset.name}
              className={`cursor-pointer border-forge-border transition-colors hover:border-forge-accent/30 ${
                selectedPreset?.name === preset.name ? "border-forge-accent bg-forge-accent/5" : "bg-card"
              }`}
              onClick={() => handleSelectPreset(preset)}
            >
              <CardContent className="p-3">
                <h4 className="text-sm font-medium">{preset.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {preset.description}
                </p>
                <p className="mt-2 text-xs text-forge-accent">
                  {preset.steps.length} steps
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Workflow DAG visualization */}
      {selectedPreset && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {selectedPreset.name} Workflow
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-forge-border"
                onClick={() => {
                  const statuses: Record<string, "pending" | "running" | "completed" | "failed"> = {}
                  for (const step of selectedPreset.steps) {
                    statuses[step.id] = "pending"
                  }
                  setStepStatuses(statuses)
                  setIsRunning(false)
                }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                size="sm"
                className="bg-forge-accent hover:bg-forge-accent/80"
                disabled={isRunning}
                onClick={() => {
                  if (onExecute) {
                    setIsRunning(true)
                    onExecute(selectedPreset.steps, "")
                  }
                }}
              >
                {isRunning ? (
                  <Pause className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isRunning ? "Running..." : "Execute"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {selectedPreset.steps.map((step, index) => (
              <div key={step.id}>
                <WorkflowNode
                  step={step}
                  status={stepStatuses[step.id] || "pending"}
                  index={index}
                />
                {index < selectedPreset.steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-4 w-4 text-forge-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedPreset && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-forge-border py-12">
          <p className="text-sm text-muted-foreground">
            Select a workflow template to get started
          </p>
        </div>
      )}
    </div>
  )
}
