import { getTool, type ToolContext } from "./tool-registry"

// Import tools to register them
import "./file-tools"
import "./bash-tool"
import "./grep-tool"
import "./glob-tool"
import "./web-tools"

export interface ToolExecutionResult {
  toolUseId: string
  toolName: string
  content: string
  isError: boolean
  durationMs: number
}

export async function executeToolCall(
  toolUseId: string,
  toolName: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolExecutionResult> {
  const tool = getTool(toolName)

  if (!tool) {
    return {
      toolUseId,
      toolName,
      content: `Unknown tool: ${toolName}`,
      isError: true,
      durationMs: 0,
    }
  }

  const startTime = Date.now()

  try {
    const result = await tool.execute(input, context)
    return {
      toolUseId,
      toolName,
      content: result.content,
      isError: result.isError ?? false,
      durationMs: Date.now() - startTime,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      toolUseId,
      toolName,
      content: `Tool execution error: ${message}`,
      isError: true,
      durationMs: Date.now() - startTime,
    }
  }
}
