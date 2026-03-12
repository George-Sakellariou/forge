import path from "node:path"

/**
 * Safety policies for agent tool execution.
 * Blocks destructive commands, restricts paths, and protects sensitive files.
 */

// Commands that are always blocked (destructive / system-level)
const BLOCKED_COMMANDS = [
  /\brm\s+(-[a-zA-Z]*)?.*\s+[/~]/,   // rm targeting root or home
  /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f/,     // rm -rf (any flag combo)
  /\brm\s+-[a-zA-Z]*f[a-zA-Z]*r/,     // rm -fr
  /\bmkfs\b/,                           // format filesystem
  /\bdd\s+/,                            // disk destroyer
  /\b:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;/, // fork bomb
  /\bchmod\s+-R\s+777/,                // open permissions recursively
  /\bchown\s+-R/,                       // recursive ownership change
  /\bcurl\b.*\|\s*bash/,               // pipe curl to bash
  /\bwget\b.*\|\s*bash/,               // pipe wget to bash
  /\bcurl\b.*\|\s*sh/,                 // pipe curl to sh
  /\bwget\b.*\|\s*sh/,                 // pipe wget to sh
  /\bsudo\b/,                           // no sudo allowed
  /\bsu\s/,                             // no user switching
  /\bshutdown\b/,                       // no system shutdown
  /\breboot\b/,                         // no reboot
  /\bsystemctl\b/,                      // no service management
  /\blaunchctl\b/,                      // no macOS service management
  /\bnpm\s+publish\b/,                  // no publishing packages
  /\bgit\s+push\s+.*--force/,          // no force push
  /\bgit\s+push\s+-f\b/,              // no force push shorthand
  /\bgit\s+reset\s+--hard/,            // no hard reset
  /\bgit\s+clean\s+-[a-zA-Z]*f/,      // no force clean
  /\bdrop\s+database\b/i,              // no dropping databases
  /\bdrop\s+table\b/i,                 // no dropping tables
  /\btruncate\s+table\b/i,            // no truncating tables
  /\bkill\s+-9\b/,                     // no force kill
  /\bkillall\b/,                       // no kill all processes
  /\bpkill\b/,                         // no pattern kill
  /\bopen\s+\/\b/,                     // no opening system paths
  /\benv\b.*PASSWORD/i,                // no dumping passwords from env
  /\benv\b.*SECRET/i,                  // no dumping secrets from env
  /\benv\b.*KEY/i,                     // no dumping keys from env
  /\bcat\b.*\.env\b/,                  // no reading .env files
  /\bcat\b.*\/etc\/passwd/,            // no reading system files
  /\bcat\b.*\/etc\/shadow/,            // no reading shadow file
  /\bnetstat\b/,                       // no network inspection
  /\bss\s+-/,                          // no socket stats
]

// Patterns that require the command to stay within working directory
const DIRECTORY_ESCAPE_PATTERNS = [
  /\bcd\s+\//,                          // cd to absolute path
  /\bcd\s+~/,                           // cd to home
  /\bcd\s+\.\.\//,                     // cd up directories
]

// Protected file patterns (cannot be written/edited)
const PROTECTED_FILE_PATTERNS = [
  /\.env$/,
  /\.env\.local$/,
  /\.env\.production$/,
  /\.env\.development$/,
  /credentials/i,
  /\.pem$/,
  /\.key$/,
  /\.crt$/,
  /id_rsa/,
  /id_ed25519/,
  /\.ssh\//,
  /\.aws\//,
  /\.gnupg\//,
]

// Directories that should never be a working directory
const FORBIDDEN_WORKING_DIRS = [
  "/",
  "/etc",
  "/usr",
  "/var",
  "/bin",
  "/sbin",
  "/System",
  "/Library",
  "/Applications",
]

export interface SafetyCheckResult {
  allowed: boolean
  reason?: string
}

export function validateCommand(command: string, workingDirectory: string): SafetyCheckResult {
  // Check blocked commands
  for (const pattern of BLOCKED_COMMANDS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `BLOCKED: Command matches safety policy. Pattern: ${pattern.source}`,
      }
    }
  }

  // Check directory escape attempts
  for (const pattern of DIRECTORY_ESCAPE_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `BLOCKED: Command attempts to escape working directory. Stay within: ${workingDirectory}`,
      }
    }
  }

  return { allowed: true }
}

export function validateWorkingDirectory(dir: string): SafetyCheckResult {
  const normalized = path.normalize(dir)

  // Block forbidden directories
  for (const forbidden of FORBIDDEN_WORKING_DIRS) {
    if (normalized === forbidden) {
      return {
        allowed: false,
        reason: `BLOCKED: "${dir}" is a protected system directory. Use a specific project directory.`,
      }
    }
  }

  // Block home directory itself (but allow subdirs)
  const homeDir = process.env.HOME || "/Users"
  if (normalized === homeDir) {
    return {
      allowed: false,
      reason: `BLOCKED: Cannot use home directory as working directory. Use a specific project folder like ~/Projects/myproject.`,
    }
  }

  return { allowed: true }
}

export function validateFileWrite(filePath: string): SafetyCheckResult {
  for (const pattern of PROTECTED_FILE_PATTERNS) {
    if (pattern.test(filePath)) {
      return {
        allowed: false,
        reason: `BLOCKED: Cannot write to protected file "${filePath}". This file may contain secrets or credentials.`,
      }
    }
  }

  return { allowed: true }
}
