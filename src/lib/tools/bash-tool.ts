import { spawn } from "node:child_process"
import { registerTool, type ToolContext, type ToolOutput } from "./tool-registry"
import { validateCommand, validateWorkingDirectory } from "./safety"

const MAX_OUTPUT_LENGTH = 20000
const DEFAULT_TIMEOUT = 120000

registerTool({
  name: "bash",
  description:
    "Execute a shell command and return its output. Commands run in the agent's working directory. Use for git, npm, running tests, building, and any system commands. Destructive commands (rm -rf, sudo, force push, etc.) are blocked by safety policies.",
  inputSchema: {
    type: "object" as const,
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds (default 120000, max 600000)",
      },
    },
    required: ["command"],
  },
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolOutput> {
    const command = input.command as string
    const timeout = Math.min((input.timeout as number) || DEFAULT_TIMEOUT, 600000)

    // Safety: validate working directory
    const dirCheck = validateWorkingDirectory(context.workingDirectory)
    if (!dirCheck.allowed) {
      return { content: dirCheck.reason!, isError: true }
    }

    // Safety: validate command
    const cmdCheck = validateCommand(command, context.workingDirectory)
    if (!cmdCheck.allowed) {
      return { content: cmdCheck.reason!, isError: true }
    }

    return new Promise((resolve) => {
      let stdout = ""
      let stderr = ""
      let killed = false

      const proc = spawn("bash", ["-c", command], {
        cwd: context.workingDirectory,
        env: { ...process.env, FORCE_COLOR: "0" },
        timeout,
      })

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString()
        if (stdout.length > MAX_OUTPUT_LENGTH) {
          stdout = stdout.slice(0, MAX_OUTPUT_LENGTH) + "\n... (output truncated)"
          proc.kill()
          killed = true
        }
      })

      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString()
        if (stderr.length > MAX_OUTPUT_LENGTH) {
          stderr = stderr.slice(0, MAX_OUTPUT_LENGTH) + "\n... (stderr truncated)"
        }
      })

      proc.on("close", (code) => {
        const output = [
          stdout ? stdout.trim() : "",
          stderr ? `STDERR:\n${stderr.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n\n")

        if (killed) {
          resolve({ content: output || "Output exceeded maximum length", isError: true })
        } else if (code !== 0) {
          resolve({
            content: output || `Command exited with code ${code}`,
            isError: true,
          })
        } else {
          resolve({ content: output || "(no output)" })
        }
      })

      proc.on("error", (err) => {
        resolve({ content: `Error executing command: ${err.message}`, isError: true })
      })
    })
  },
})
