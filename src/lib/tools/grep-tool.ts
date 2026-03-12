import { spawn } from "node:child_process"
import { registerTool, type ToolContext, type ToolOutput } from "./tool-registry"

registerTool({
  name: "grep",
  description:
    "Search file contents using ripgrep (rg). Supports regex patterns, file type filtering, and context lines. Fast and efficient for searching codebases.",
  inputSchema: {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description: "Regex pattern to search for",
      },
      path: {
        type: "string",
        description: "File or directory to search in (defaults to working directory)",
      },
      glob: {
        type: "string",
        description: 'Glob pattern to filter files (e.g. "*.ts", "*.{ts,tsx}")',
      },
      case_insensitive: {
        type: "boolean",
        description: "Case insensitive search (default false)",
      },
      context_lines: {
        type: "number",
        description: "Number of context lines before and after each match",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results (default 50)",
      },
    },
    required: ["pattern"],
  },
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const pattern = input.pattern as string
    const searchPath = (input.path as string) || context.workingDirectory
    const glob = input.glob as string | undefined
    const caseInsensitive = input.case_insensitive as boolean
    const contextLines = input.context_lines as number | undefined
    const maxResults = (input.max_results as number) || 50

    const args = ["--no-heading", "--line-number", "--color=never", `-m`, String(maxResults)]

    if (caseInsensitive) args.push("-i")
    if (contextLines) args.push(`-C`, String(contextLines))
    if (glob) args.push("--glob", glob)

    args.push(pattern, searchPath)

    return new Promise((resolve) => {
      const proc = spawn("rg", args, {
        cwd: context.workingDirectory,
        timeout: 30000,
      })

      let output = ""
      proc.stdout.on("data", (data: Buffer) => {
        output += data.toString()
      })

      let stderr = ""
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString()
      })

      proc.on("close", (code) => {
        if (code === 1 && !stderr) {
          resolve({ content: "No matches found" })
        } else if (code !== 0 && code !== 1) {
          resolve({ content: `Grep error: ${stderr || `exit code ${code}`}`, isError: true })
        } else {
          resolve({ content: output.trim() || "No matches found" })
        }
      })

      proc.on("error", () => {
        resolve({
          content: "ripgrep (rg) not found. Install it: brew install ripgrep",
          isError: true,
        })
      })
    })
  },
})
