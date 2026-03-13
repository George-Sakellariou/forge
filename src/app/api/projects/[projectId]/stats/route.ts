import { NextResponse } from "next/server"
import { getTaskStats, getProjectCostSummary } from "@/lib/db/tasks"
import { getProjectEventCounts } from "@/lib/db/events"
import { findEventsByProject } from "@/lib/db/events"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params

  try {
    const [taskStats, costSummary, eventCounts, recentEvents] = await Promise.all([
      getTaskStats(projectId),
      getProjectCostSummary(projectId),
      getProjectEventCounts(projectId),
      findEventsByProject(projectId, 30),
    ])

    return NextResponse.json({
      success: true,
      data: {
        tasks: taskStats,
        tokens: costSummary.totalTokens,
        costUsd: costSummary.totalCost,
        eventCounts,
        recentEvents: recentEvents.map((e) => ({
          id: e.id,
          type: e.type,
          payload: e.payload,
          agentId: e.agent_id,
          createdAt: e.created_at,
        })),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
