import type { AgentModel } from "@/lib/types/agent"

// Pricing per million tokens (as of 2026-03)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export function calculateCost(
  model: AgentModel,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0

  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000
}

export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) return `$${costUsd.toFixed(4)}`
  if (costUsd < 1) return `$${costUsd.toFixed(3)}`
  return `$${costUsd.toFixed(2)}`
}

export function formatTokens(count: number): string {
  if (count < 1000) return String(count)
  if (count < 1_000_000) return `${(count / 1000).toFixed(1)}k`
  return `${(count / 1_000_000).toFixed(2)}M`
}

export class CostAccumulator {
  private entries: Array<{
    model: AgentModel
    inputTokens: number
    outputTokens: number
    costUsd: number
    timestamp: string
  }> = []

  record(model: AgentModel, inputTokens: number, outputTokens: number): TokenUsage {
    const costUsd = calculateCost(model, inputTokens, outputTokens)
    this.entries.push({
      model,
      inputTokens,
      outputTokens,
      costUsd,
      timestamp: new Date().toISOString(),
    })
    return { inputTokens, outputTokens, costUsd }
  }

  get totalInputTokens(): number {
    return this.entries.reduce((sum, e) => sum + e.inputTokens, 0)
  }

  get totalOutputTokens(): number {
    return this.entries.reduce((sum, e) => sum + e.outputTokens, 0)
  }

  get totalCostUsd(): number {
    return this.entries.reduce((sum, e) => sum + e.costUsd, 0)
  }

  get totalTokens(): number {
    return this.totalInputTokens + this.totalOutputTokens
  }

  getEntries() {
    return [...this.entries]
  }
}
