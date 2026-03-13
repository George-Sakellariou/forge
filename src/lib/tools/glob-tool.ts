import { spawn } from "node:child_process"
import path from "node:path"
import { registerTool, type ToolContext, type ToolOutput } from "./tool-registry"

function isWithinDirectory(target: string, boundary: string): boolean {
  const normalizedTarget = path.normalize(path.resolve(boundary, target))
  const normalizedBoundary = path.normalize(boundary)
  return normalizedTarget.startsWith(normalizedBoundary + path.sep) || normalizedTarget === normalizedBoundary
}

registerTool({
  name: "glob",
  description:
    'Find files matching a glob pattern. Returns matching file paths sorted by modification time. Use patterns like "**/*.ts" or "src/**/*.tsx".',
  inputSchema: {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description: 'Glob pattern to match files (e.g. "**/*.ts", "src/components/**/*.tsx")',
      },
      path: {
        type: "string",
        description: "Directory to search in (defaults to working directory)",
      },
    },
    required: ["pattern"],
  },
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const pattern = input.pattern as string
    const rawPath = (input.path as string) || context.workingDirectory
    const searchPath = path.resolve(context.workingDirectory, rawPath)

    if (!isWithinDirectory(searchPath, context.workingDirectory)) {
      return { content: `Access denied: search path is outside working directory ${context.workingDirectory}`, isError: true }
    }

    return new Promise((resolve) => {
      // Use fd if available, fall back to find
      const proc = spawn("fd", ["--glob", pattern, "--type", "f", searchPath], {
        cwd: context.workingDirectory,
        timeout: 30000,
      })

      let output = ""
      proc.stdout.on("data", (data: Buffer) => {
        output += data.toString()
      })

      proc.on("close", () => {
        const files = output.trim()
        resolve({ content: files || "No matching files found" })
      })

      proc.on("error", () => {
        // Fall back to find
        const findProc = spawn(
          "find",
          [searchPath, "-name", pattern, "-type", "f"],
          { cwd: context.workingDirectory, timeout: 30000 },
        )

        let findOutput = ""
        findProc.stdout.on("data", (data: Buffer) => {
          findOutput += data.toString()
        })

        findProc.on("close", () => {
          resolve({ content: findOutput.trim() || "No matching files found" })
        })

        findProc.on("error", (err) => {
          resolve({ content: `Error: ${err.message}`, isError: true })
        })
      })
    })
  },
})
