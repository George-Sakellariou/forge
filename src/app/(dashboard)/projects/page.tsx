"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useProjectStore } from "@/stores/project-store"
import type { Project } from "@/lib/types/project"
import { Plus, FolderOpen, Clock, Loader2, AlertCircle } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/format"
import Link from "next/link"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [workingDir, setWorkingDir] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError(null)
        const res = await fetch("/api/projects")
        const json = await res.json()
        if (!cancelled && json.success) {
          setProjects(json.data)
        } else if (!cancelled) {
          setError(json.error || "Failed to load projects")
        }
      } catch {
        if (!cancelled) setError("Failed to connect to server")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  const fetchProjects = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreateError(null)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          workingDirectory: workingDir.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        setName("")
        setDescription("")
        setWorkingDir("")
        setOpen(false)
        fetchProjects()
      } else {
        setCreateError(json.error || "Failed to create project")
      }
    } catch {
      setCreateError("Failed to connect to server")
    }
  }

  const handleProjectClick = (project: Project) => {
    setActiveProject(project.id, project.name)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your AI-assisted development projects
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setCreateError(null) }}>
          <DialogTrigger
            className="inline-flex items-center justify-center rounded-md bg-forge-accent px-4 py-2 text-sm font-medium text-white hover:bg-forge-accent/80"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </DialogTrigger>
          <DialogContent className="border-forge-border bg-card">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="border-forge-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  className="border-forge-border bg-background"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Working Directory</Label>
                <Input
                  value={workingDir}
                  onChange={(e) => setWorkingDir(e.target.value)}
                  placeholder="~/Projects/my-project"
                  className="border-forge-border bg-background font-mono text-sm"
                />
              </div>
              {createError && (
                <div className="flex items-center gap-2 text-sm text-forge-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {createError}
                </div>
              )}
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="w-full bg-forge-accent hover:bg-forge-accent/80"
              >
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-forge-accent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-forge-error/30 py-16">
          <AlertCircle className="h-6 w-6 text-forge-error" />
          <p className="text-sm text-forge-error">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-forge-border py-16">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              onClick={() => handleProjectClick(project)}
            >
              <Card className="border-forge-border bg-card transition-colors hover:border-forge-accent/30">
                <CardContent className="p-4">
                  <h3 className="font-medium">{project.name}</h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {project.workingDirectory && (
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        <span className="font-mono">{project.workingDirectory}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {project.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
