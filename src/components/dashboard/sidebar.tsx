"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  FolderKanban,
  Settings,
  FolderOpen,
  GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/stores/project-store"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeProjectName = useProjectStore((s) => s.activeProjectName)

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-forge-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forge-accent to-purple-500 shadow-lg shadow-forge-accent/20">
          <span className="text-base font-black text-white">F</span>
        </div>
        <div>
          <span className="gradient-text text-lg font-bold tracking-tight">
            FORGE
          </span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            AI Workforce
          </p>
        </div>
      </div>

      {/* Active Project Context */}
      {activeProjectId && activeProjectName && (
        <div className="mx-3 mb-2 rounded-lg border border-forge-accent/15 bg-forge-accent/5 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active Project
          </p>
          <Link
            href={`/projects/${activeProjectId}`}
            className="mt-1 flex items-center gap-2 text-sm font-medium text-forge-accent-bright transition-colors hover:text-forge-accent"
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{activeProjectName}</span>
          </Link>
          <Link
            href={`/projects/${activeProjectId}/workflow`}
            className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitBranch className="h-3 w-3" />
            Workflows
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Command Center
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-forge-accent/10 text-forge-accent accent-glow"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-forge-accent"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-forge-accent shadow-sm shadow-forge-accent/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-forge-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-forge-success shadow-sm shadow-forge-success/50" />
          <p className="text-[11px] text-muted-foreground">
            v0.1.0 <span className="text-forge-muted">&middot;</span> Local
          </p>
        </div>
      </div>
    </aside>
  )
}
