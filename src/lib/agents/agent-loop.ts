import Anthropic from "@anthropic-ai/sdk"
import { executeToolCall } from "@/lib/tools/tool-executor"
import { getAnthropicToolDefs } from "@/lib/tools/tool-registry"
import { calculateCost } from "./cost-tracker"
import type { AgentModel } from "@/lib/types/agent"
import type { ToolContext } from "@/lib/tools/tool-registry"

export interface AgentLoopConfig {
  model: AgentModel
  systemPrompt: string
  tools: string[]
  maxTokens: number
  temperature: number
  maxTurns: number
  workingDirectory: string
  agentId: string
  projectId?: string
}

export interface AgentLoopEvent {
  type:
    | "text_delta"
    | "tool_use_start"
    | "tool_use_input"
    | "tool_result"
    | "turn_complete"
    | "loop_complete"
    | "error"
    | "usage"
  data: Record<string, unknown>
}

export type AgentLoopEventHandler = (event: AgentLoopEvent) => void

export async function runAgentLoop(
  config: AgentLoopConfig,
  initialMessage: string,
  onEvent: AgentLoopEventHandler,
  abortSignal?: AbortSignal,
): Promise<void> {
  const client = new Anthropic()

  const toolDefs = getAnthropicToolDefs(config.tools)
  const toolContext: ToolContext = {
    workingDirectory: config.workingDirectory,
    agentId: config.agentId,
    projectId: config.projectId,
  }

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: initialMessage },
  ]

  let totalInputTokens = 0
  let totalOutputTokens = 0
  let turns = 0

  while (turns < config.maxTurns) {
    if (abortSignal?.aborted) break

    turns++

    try {
      const stream = await client.messages.stream({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: config.systemPrompt,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        messages,
      })

      const contentBlocks: Anthropic.ContentBlock[] = []
      let currentToolName = ""
      let currentToolInput = ""

      stream.on("text", (text) => {
        onEvent({ type: "text_delta", data: { text } })
      })

      stream.on("contentBlock", (block) => {
        contentBlocks.push(block)

        if (block.type === "tool_use") {
          currentToolName = block.name
          currentToolInput = JSON.stringify(block.input)
          onEvent({
            type: "tool_use_start",
            data: {
              toolName: block.name,
              toolUseId: block.id,
              input: block.input,
            },
          })
        }
      })

      const finalMessage = await stream.finalMessage()

      // Track usage
      const { input_tokens, output_tokens } = finalMessage.usage
      totalInputTokens += input_tokens
      totalOutputTokens += output_tokens
      const turnCost = calculateCost(config.model, input_tokens, output_tokens)

      onEvent({
        type: "usage",
        data: {
          inputTokens: input_tokens,
          outputTokens: output_tokens,
          totalInputTokens,
          totalOutputTokens,
          turnCost,
          totalCost: calculateCost(config.model, totalInputTokens, totalOutputTokens),
        },
      })

      // Add assistant message to history
      messages.push({ role: "assistant", content: finalMessage.content })

      onEvent({
        type: "turn_complete",
        data: { turn: turns, stopReason: finalMessage.stop_reason },
      })

      // If stop reason is end_turn or max_tokens, we're done
      if (finalMessage.stop_reason !== "tool_use") {
        break
      }

      // Execute tool calls
      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        if (abortSignal?.aborted) break

        const result = await executeToolCall(
          toolUse.id,
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          toolContext,
        )

        onEvent({
          type: "tool_result",
          data: {
            toolUseId: toolUse.id,
            toolName: toolUse.name,
            content: result.content.slice(0, 500), // Truncate for event display
            isError: result.isError,
            durationMs: result.durationMs,
          },
        })

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result.content,
          is_error: result.isError,
        })
      }

      // Add tool results to conversation
      messages.push({ role: "user", content: toolResults })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      onEvent({ type: "error", data: { error: message, turn: turns } })
      break
    }
  }

  onEvent({
    type: "loop_complete",
    data: {
      turns,
      totalInputTokens,
      totalOutputTokens,
      totalCost: calculateCost(config.model, totalInputTokens, totalOutputTokens),
    },
  })
}
