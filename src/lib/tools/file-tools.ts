import { promises as fs } from "node:fs"
import path from "node:path"
import { registerTool, type ToolContext, type ToolOutput } from "./tool-registry"
import { validateFileWrite } from "./safety"

function resolvePath(filePath: string, context: ToolContext): string {
  if (path.isAbsolute(filePath)) return filePath
  return path.resolve(context.workingDirectory, filePath)
}

async function validatePath(resolved: string, context: ToolContext): Promise<string | null> {
  const normalizedResolved = path.normalize(resolved)
  const normalizedWd = path.normalize(context.workingDirectory)
  if (!normalizedResolved.startsWith(normalizedWd)) {
    return `Access denied: path ${resolved} is outside working directory ${context.workingDirectory}`
  }
  return null
}

registerTool({
  name: "read_file",
  description:
    "Read the contents of a file. Returns the file content with line numbers. Use this to examine source code, configuration files, or any text file.",
  inputSchema: {
    type: "object" as const,
    properties: {
      file_path: {
        type: "string",
        description: "Path to the file to read (absolute or relative to working directory)",
      },
      offset: {
        type: "number",
        description: "Line number to start reading from (1-based). Optional.",
      },
      limit: {
        type: "number",
        description: "Maximum number of lines to read. Optional, defaults to 2000.",
      },
    },
    required: ["file_path"],
  },
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const filePath = input.file_path as string
    const offset = (input.offset as number) || 1
    const limit = (input.limit as number) || 2000

    const resolved = resolvePath(filePath, context)
    const pathError = await validatePath(resolved, context)
    if (pathError) return { content: pathError, isError: true }

    try {
      const content = await fs.readFile(resolved, "utf-8")
      const lines = content.split("\n")
      const sliced = lines.slice(offset - 1, offset - 1 + limit)
      const numbered = sliced
        .map((line, i) => `${String(offset + i).padStart(6)} | ${line}`)
        .join("\n")
      return { content: numbered || "(empty file)" }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { content: `Error reading file: ${message}`, isError: true }
    }
  },
})

registerTool({
  name: "write_file",
  description:
    "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Creates parent directories as needed.",
  inputSchema: {
    type: "object" as const,
    properties: {
      file_path: {
        type: "string",
        description: "Path to the file to write",
      },
      content: {
        type: "string",
        description: "Content to write to the file",
      },
    },
    required: ["file_path", "content"],
  },
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const filePath = input.file_path as string
    const content = input.content as string

    const resolved = resolvePath(filePath, context)
    const pathError = await validatePath(resolved, context)
    if (pathError) return { content: pathError, isError: true }

    // Safety: check protected files
    const fileCheck = validateFileWrite(resolved)
    if (!fileCheck.allowed) return { content: fileCheck.reason!, isError: true }

    try {
      await fs.mkdir(path.dirname(resolved), { recursive: true })
      await fs.writeFile(resolved, content, "utf-8")
      return { content: `Successfully wrote ${content.split("\n").length} lines to ${filePath}` }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { content: `Error writing file: ${message}`, isError: true }
    }
  },
})

registerTool({
  name: "edit_file",
  description:
    "Edit a file by replacing an exact string match with new content. The old_string must be unique in the file.",
  inputSchema: {
    type: "object" as const,
    properties: {
      file_path: {
        type: "string",
        description: "Path to the file to edit",
      },
      old_string: {
        type: "string",
        description: "The exact string to find and replace",
      },
      new_string: {
        type: "string",
        description: "The replacement string",
      },
    },
    required: ["file_path", "old_string", "new_string"],
  },
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const filePath = input.file_path as string
    const oldString = input.old_string as string
    const newString = input.new_string as string

    const resolved = resolvePath(filePath, context)
    const pathError = await validatePath(resolved, context)
    if (pathError) return { content: pathError, isError: true }

    // Safety: check protected files
    const fileCheck = validateFileWrite(resolved)
    if (!fileCheck.allowed) return { content: fileCheck.reason!, isError: true }

    try {
      const content = await fs.readFile(resolved, "utf-8")
      const occurrences = content.split(oldString).length - 1

      if (occurrences === 0) {
        return { content: "Error: old_string not found in file", isError: true }
      }
      if (occurrences > 1) {
        return {
          content: `Error: old_string found ${occurrences} times. Must be unique.`,
          isError: true,
        }
      }

      const updated = content.replace(oldString, newString)
      await fs.writeFile(resolved, updated, "utf-8")
      return { content: `Successfully edited ${filePath}` }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { content: `Error editing file: ${message}`, isError: true }
    }
  },
})
