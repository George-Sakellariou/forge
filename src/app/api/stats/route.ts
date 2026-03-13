import { NextResponse } from "next/server"
import { sessionManager } from "@/lib/agents/session-manager"
import { agentPool } from "@/lib/orchestrator/agent-pool"
import { getTaskStats } from "@/lib/db/tasks"

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const sessions = sessionManager.getAllSessions()

  const activeAgents = sessions.filter((s) => s.status === "working").length
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokensUsed, 0)
  const totalCost = sessions.reduce((sum, s) => sum + s.costUsd, 0)

  let taskStats: Record<string, number> = { pending: 0, running: 0, completed: 0, failed: 0 }
  try {
    taskStats = await getTaskStats()
  } catch {
    // Non-critical
  }

  return NextResponse.json({
    success: true,
    data: {
      hasApiKey,
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
