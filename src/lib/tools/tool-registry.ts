import type Anthropic from "@anthropic-ai/sdk"

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Anthropic.Tool["input_schema"]
  execute: (input: Record<string, unknown>, context: ToolContext) => Promise<ToolOutput>
}

export interface ToolContext {
  workingDirectory: string
  agentId: string
  projectId?: string
}

export interface ToolOutput {
  content: string
  isError?: boolean
}

const tools = new Map<string, ToolDefinition>()

export function registerTool(tool: ToolDefinition): void {
  tools.set(tool.name, tool)
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name)
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(tools.values())
}

export function getToolsByNames(names: string[]): ToolDefinition[] {
  return names
    .map((name) => tools.get(name))
    .filter((tool): tool is ToolDefinition => tool !== undefined)
}

export function getAnthropicToolDefs(names?: string[]): Anthropic.Tool[] {
  const defs = names ? getToolsByNames(names) : getAllTools()
  return defs.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }))
}
