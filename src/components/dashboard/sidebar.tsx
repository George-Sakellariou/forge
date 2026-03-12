"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  FolderKanban,
  GitBranch,
  BarChart3,
  Settings,
  Hammer,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-forge-border bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-forge-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forge-accent">
          <Hammer className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          FORGE
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-forge-accent/10 text-forge-accent"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-forge-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Forge v0.1.0</p>
      </div>
    </aside>
  )
}
