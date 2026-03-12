import { NextResponse } from "next/server"
import { sessionManager } from "@/lib/agents/session-manager"
import { agentPool } from "@/lib/orchestrator/agent-pool"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const sessions = sessionManager.getAllSessions()

  const activeAgents = sessions.filter((s) => s.status === "working").length
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokensUsed, 0)
  const totalCost = sessions.reduce((sum, s) => sum + s.costUsd, 0)

  // Get task counts from DB
  let taskStats = { pending: 0, running: 0, completed: 0, failed: 0 }
  try {
    const supabase = await createClient()
    const { data: tasks } = await supabase.from("tasks").select("status")

    if (tasks) {
      for (const task of tasks) {
        const status = task.status as keyof typeof taskStats
        if (status in taskStats) {
          taskStats = { ...taskStats, [status]: taskStats[status] + 1 }
        }
      }
    }
  } catch {
    // Non-critical
  }

  return NextResponse.json({
    success: true,
    data: {
      activeAgents,
      totalSessions: sessions.length,
      totalTokens,
      totalCostUsd: totalCost,
      pool: agentPool.getStatus(),
      tasks: taskStats,
      sessions: sessions.map((s) => ({
        agentId: s.agentId,
        status: s.status,
        tokensUsed: s.tokensUsed,
        costUsd: s.costUsd,
        startedAt: s.startedAt,
      })),
    },
  })
}
